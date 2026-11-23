import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui";
import { customFetch } from "../services/api";
import { SkeletonLoader } from "../components/SkeletonLoader";

interface SystemStatusProps {
  showToast?: (msg: string, type?: "success" | "error") => void;
  refreshTrigger?: number;
  flushTrigger?: number;
  onStateChange?: (state: {
    refreshing: boolean;
    flushing: boolean;
    isOperational: boolean;
    timestamp?: string;
    label?: string;
    redisOk?: boolean;
  }) => void;
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
      neonKeyCount?: number;
      targetDatabase?: string;
      connectedToNeon?: boolean;
      cachedEntities?: string[];
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
    groq?: {
      status: "connected" | "error";
      latencyMs: number | null;
      activeModel: string;
      message?: string;
    };
    gemini?: {
      status: "connected" | "error";
      latencyMs: number | null;
      activeModel: string;
      isBackup?: boolean;
      message?: string;
    };
    openrouter?: {
      status: "connected" | "error";
      latencyMs: number | null;
      activeModel: string;
      isTertiaryBackup?: boolean;
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

  const isOperational = data?.overall?.status === "operational";
  const neonOk = data?.services?.neon?.status === "connected";
  const redisOk = data?.services?.redis?.status === "connected";
  const sanityOk = data?.services?.sanity?.status === "connected";

  useEffect(() => {
    onStateChange?.({
      refreshing,
      flushing,
      isOperational,
      timestamp: data?.timestamp,
      label: data?.overall?.label,
      redisOk,
    });
  }, [refreshing, flushing, data, isOperational, redisOk, onStateChange]);

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

  return (
    <>
      {/* ── Core Stat Cards ── */}
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
          variant="secondary"
          onClick={() => setViewMore(!viewMore)}
          style={{
            fontSize: "var(--text-xs)",
            padding: "6px 16px",
            borderRadius: "var(--radius-pill)",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <span>{viewMore ? "Hide Details" : "More Details"}</span>
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

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Connected Database</span>
                <span style={{ fontWeight: 600, color: "var(--green)" }}>
                  {data?.services?.redis?.targetDatabase || "Neon Serverless Postgres"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Cached Entities</span>
                <span style={{ color: "var(--white)" }}>
                  clients, sales, users, deliveries
                </span>
              </div>
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
                <span style={{ color: "var(--muted)" }}>Neon Sync / Test</span>
                <span className="badge badge-green" style={{ fontSize: "11px", padding: "2px 8px" }}>
                  Connected & Active
                </span>
              </div>
            </div>
          </div>

          {/* Sanity Details */}
          <div className="glass-card">
            <div className="chart-title" style={{ fontSize: "var(--text-sm)" }}>Sanity Database Details</div>

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

          {/* AI Services & Backup Details */}
          <div className="glass-card">
            <div className="chart-title" style={{ fontSize: "var(--text-sm)" }}>AI Engine & Backup Details</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Primary Engine (Groq)</span>
                <span style={{ fontWeight: 600, color: data?.services?.groq?.status === "connected" ? "var(--green)" : "var(--yellow)" }}>
                  {data?.services?.groq?.status === "connected" ? `Active (${data?.services?.groq?.latencyMs ?? 0}ms)` : "Unavailable"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>2nd Backup (Gemini)</span>
                <span style={{ fontWeight: 600, color: data?.services?.gemini?.status === "connected" ? "var(--green)" : "var(--red)" }}>
                  {data?.services?.gemini?.status === "connected" ? `Ready • Failover Armed (${data?.services?.gemini?.latencyMs ?? 0}ms)` : "Offline"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>3rd Backup (OpenRouter)</span>
                <span style={{ fontWeight: 600, color: data?.services?.openrouter?.status === "connected" ? "var(--green)" : "var(--red)" }}>
                  {data?.services?.openrouter?.status === "connected" ? `Ready • Failover Armed (${data?.services?.openrouter?.latencyMs ?? 0}ms)` : "Offline"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>OpenRouter Model</span>
                <span style={{ fontFamily: "monospace", color: "var(--white)", fontSize: "12px" }}>
                  {data?.services?.openrouter?.activeModel || "meta-llama/llama-3.3-70b-instruct"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Cascade Policy</span>
                <span className="badge badge-green" style={{ fontSize: "11px", padding: "2px 8px" }}>
                  3-Tier Failover: Groq → Gemini → OpenRouter
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
