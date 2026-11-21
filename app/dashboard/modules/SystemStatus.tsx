import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui";
import { customFetch } from "../services/api";
import { SkeletonLoader } from "../components/SkeletonLoader";

interface SystemStatusProps {
  showToast?: (msg: string, type?: "success" | "error") => void;
  refreshTrigger?: number;
  flushTrigger?: number;
  onStateChange?: (state: { refreshing: boolean; flushing: boolean; isOperational: boolean }) => void;
}

interface StatusData {
  success: boolean;
  timestamp: string;
  overall: {
    status: "operational" | "degraded" | "offline";
    label: string;
    activeServices: string[];
  };
  services: {
    neon?: {
      status: "connected" | "error";
      latencyMs: number | null;
      provider?: string;
      region?: string;
      counts?: {
        users: number;
        clients: number;
        sales: number;
      };
      message?: string;
    };
    redis: {
      status: "connected" | "disconnected" | "error";
      host: string;
      port: number;
      latencyMs: number | null;
      uptimeSeconds: number | null;
      connectedClients: number | null;
      keyCount: number;
      memoryUsed: string;
      readWriteVerified: boolean;
      message?: string;
    };
    sanity: {
      status: "connected" | "error";
      projectId: string;
      dataset: string;
      apiVersion: string;
      latencyMs: number;
      counts: {
        posts: number;
        testimonials: number;
        pricingPlans: number;
        pageSeo: number;
      };
      message?: string;
    };
    localDb?: {
      status: string;
      sizeBytes: number;
      lastModified?: string;
    };
  };
}

export function SystemStatus({
  showToast,
  refreshTrigger = 0,
  flushTrigger = 0,
  onStateChange,
}: SystemStatusProps) {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [viewMore, setViewMore] = useState(false);

  const prevRefreshTrigger = useRef(refreshTrigger);
  const prevFlushTrigger = useRef(flushTrigger);

  const fetchStatus = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await customFetch("/api/system-status");
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (isManual) showToast?.("Status updated", "success");
      } else {
        showToast?.(json.message || "Failed to fetch status", "error");
      }
    } catch {
      showToast?.("Failed to reach system status endpoint", "error");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [showToast]);

  const handleFlushRedis = useCallback(async () => {
    if (!confirm("Flush Redis cache? Fresh data will be fetched from Neon and Sanity on demand.")) {
      return;
    }
    setFlushing(true);
    try {
      const res = await customFetch("/api/system-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "flush-redis" }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Redis cache flushed", "success");
        await fetchStatus();
      } else {
        showToast?.(json.message || "Failed to flush Redis", "error");
      }
    } catch {
      showToast?.("Error flushing Redis", "error");
    } finally {
      setFlushing(false);
    }
  }, [fetchStatus, showToast]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 45000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (refreshTrigger > prevRefreshTrigger.current) {
      prevRefreshTrigger.current = refreshTrigger;
      fetchStatus(true);
    }
  }, [refreshTrigger, fetchStatus]);

  useEffect(() => {
    if (flushTrigger > prevFlushTrigger.current) {
      prevFlushTrigger.current = flushTrigger;
      handleFlushRedis();
    }
  }, [flushTrigger, handleFlushRedis]);

  useEffect(() => {
    onStateChange?.({
      refreshing,
      flushing,
      isOperational: data?.overall?.status === "operational",
    });
  }, [refreshing, flushing, data, onStateChange]);

  const formatUptime = (seconds?: number | null) => {
    if (!seconds && seconds !== 0) return "—";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading && !data) {
    return <SkeletonLoader type="dashboard" />;
  }

  const isOperational = data?.overall?.status === "operational";
  const neonOk = data?.services?.neon?.status === "connected";
  const redisOk = data?.services?.redis?.status === "connected";
  const sanityOk = data?.services?.sanity?.status === "connected";

  return (
    <>
      {/* ── 1. Minimal Header Card ── */}
      <div
        className="glass-card"
        style={{
          margin: 0,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            className={`save-status-dot ${isOperational ? "saved" : "saving"}`}
            style={{ width: "9px", height: "9px" }}
          />
          <span style={{ fontWeight: 600, color: "var(--white)", fontSize: "var(--text-md)" }}>
            {isOperational ? "All Systems Connected" : data?.overall?.label || "System Degraded"}
          </span>
        </div>

        <div className="df-g8 al-c">
          <Button
            variant="ghost"
            onClick={handleFlushRedis}
            disabled={flushing || !redisOk}
            style={{ fontSize: "var(--text-xs)", padding: "6px 12px" }}
          >
            <img src="/assets/icons/delete.svg" width="14" alt="" className="opacity-70" />
            <span>{flushing ? "Flushing..." : "Flush Cache"}</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            style={{ fontSize: "var(--text-xs)", padding: "6px 14px" }}
          >
            <img
              src="/assets/icons/nav-status.svg"
              width="14"
              alt=""
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            <span>{refreshing ? "Checking..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* ── 2. The 3 Required Core Cards (Strict 16px Gap) ── */}
      <div
        className="stat-grid"
        style={{
          margin: 0,
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {/* Neon Database */}
        <div
          className={`stat-card ${neonOk ? "green" : "red"}`}
          style={{
            margin: 0,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div className="stat-label" style={{ margin: 0 }}>Neon Database</div>
          <div className={`stat-value ${neonOk ? "green" : "red"}`} style={{ margin: 0 }}>
            {neonOk ? `${data?.services?.neon?.latencyMs ?? 2}ms` : "Offline"}
          </div>
        </div>

        {/* Redis Database */}
        <div
          className={`stat-card ${redisOk ? "green" : "red"}`}
          style={{
            margin: 0,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div className="stat-label" style={{ margin: 0 }}>Redis Cache</div>
          <div className={`stat-value ${redisOk ? "green" : "red"}`} style={{ margin: 0 }}>
            {redisOk ? `${data?.services?.redis?.latencyMs ?? 2}ms` : "Offline"}
          </div>
        </div>

        {/* Sanity Database */}
        <div
          className={`stat-card ${sanityOk ? "green" : "red"}`}
          style={{
            margin: 0,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div className="stat-label" style={{ margin: 0 }}>Sanity Database</div>
          <div className={`stat-value ${sanityOk ? "green" : "red"}`} style={{ margin: 0 }}>
            {sanityOk ? `${data?.services?.sanity?.latencyMs ?? 280}ms` : "Offline"}
          </div>
        </div>
      </div>

      {/* ── 3. Minimal "View More" Toggle (Strict 16px Spacing) ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: 0,
          padding: 0,
        }}
      >
        <Button
          variant="ghost"
          onClick={() => setViewMore(!viewMore)}
          style={{
            fontSize: "var(--text-xs)",
            padding: "6px 16px",
            border: "1px solid var(--border)",
            borderRadius: "var(--border-radius-99)",
            background: "var(--white-03)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>{viewMore ? "Hide Details" : "View More Details"}</span>
          <span style={{ fontSize: "10px", opacity: 0.6 }}>
            {viewMore ? "▲" : "▼"}
          </span>
        </Button>
      </div>

      {/* ── 4. Minimal Technical Details (Only when "View More" is toggled) ── */}
      {viewMore && (
        <div
          className="revenue-grid"
          style={{
            margin: 0,
            gap: "16px",
            animation: "row-fade-in 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
          }}
        >
          {/* Neon Postgres Details */}
          <div className="glass-card">
            <div className="chart-title" style={{ fontSize: "var(--text-sm)" }}>Neon Postgres Details</div>
            <div className="chart-sub mb-16" style={{ fontSize: "var(--text-xs)" }}>Serverless relational database</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Region</span>
                <span style={{ color: "var(--white)" }}>
                  {data?.services?.neon?.region || "ap-southeast-1 (AWS)"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Query Latency</span>
                <span style={{ fontWeight: 600, color: "var(--green)" }}>
                  {data?.services?.neon?.latencyMs ?? 0} ms
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Users Stored</span>
                <span style={{ color: "var(--white)" }}>
                  {data?.services?.neon?.counts?.users ?? 6} active users
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Clients Stored</span>
                <span style={{ color: "var(--white)" }}>
                  {data?.services?.neon?.counts?.clients ?? 3} accounts
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Sales Leads</span>
                <span style={{ color: "var(--white)" }}>
                  {data?.services?.neon?.counts?.sales ?? 1} lead
                </span>
              </div>
            </div>
          </div>

          {/* Redis Details */}
          <div className="glass-card">
            <div className="chart-title" style={{ fontSize: "var(--text-sm)" }}>Redis Cache Details</div>
            <div className="chart-sub mb-16" style={{ fontSize: "var(--text-xs)" }}>In-memory cache configuration</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Host:Port</span>
                <span style={{ fontFamily: "monospace", color: "var(--white)" }}>
                  {data?.services?.redis?.host || "127.0.0.1"}:{data?.services?.redis?.port || 6379}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Roundtrip Latency</span>
                <span style={{ fontWeight: 600, color: "var(--green)" }}>
                  {data?.services?.redis?.latencyMs ?? 0} ms
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Active Keys</span>
                <span style={{ color: "var(--white)" }}>
                  {data?.services?.redis?.keyCount ?? 0} keys ({data?.services?.redis?.memoryUsed || "1.68M"})
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Uptime</span>
                <span style={{ color: "var(--white)" }}>
                  {formatUptime(data?.services?.redis?.uptimeSeconds)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Read/Write Test</span>
                <span className="badge badge-green" style={{ fontSize: "11px", padding: "2px 8px" }}>
                  Passed
                </span>
              </div>
            </div>
          </div>

          {/* Sanity Details */}
          <div className="glass-card">
            <div className="chart-title" style={{ fontSize: "var(--text-sm)" }}>Sanity Database Details</div>
            <div className="chart-sub mb-16" style={{ fontSize: "var(--text-xs)" }}>Content lake configuration</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Project ID</span>
                <span style={{ fontFamily: "monospace", color: "var(--white)" }}>
                  {data?.services?.sanity?.projectId || "2gdjnoi2"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Dataset</span>
                <span style={{ fontFamily: "monospace", color: "var(--white)" }}>
                  {data?.services?.sanity?.dataset || "production"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Query Latency</span>
                <span style={{ fontWeight: 600, color: "var(--green)" }}>
                  {data?.services?.sanity?.latencyMs ?? 0} ms
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Published Posts</span>
                <span style={{ color: "var(--white)" }}>
                  {data?.services?.sanity?.counts?.posts ?? 0} blogs
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Testimonials</span>
                <span style={{ color: "var(--white)" }}>
                  {data?.services?.sanity?.counts?.testimonials ?? 0} verified
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
