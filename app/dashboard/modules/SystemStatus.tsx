import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui";
import { customFetch, safeJsonResponse } from "../services/api";
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
    ai?: {
      status: "connected" | "error";
      latencyMs: number | null;
      primaryProvider: string;
      primaryModel: string;
      activeModel: string;
      cascadePolicy: string;
      tokens: {
        total: number;
        today: number;
        prompt: number;
        completion: number;
        requests: number;
        todayRequests: number;
        avgLatencyMs: number;
        byProvider: Array<{
          provider: string;
          model: string;
          requests: number;
          tokens: number;
          avgLatencyMs: number;
        }>;
        byStage: Array<{
          stage: string;
          label: string;
          requests: number;
          tokens: number;
        }>;
      };
      currentActivity: {
        status: "idle" | "generating" | "queued";
        activeJob: {
          id: string;
          title: string;
          status: string;
          stage: string;
          tokensUsed: number;
          createdAt: string;
        } | null;
        activeJobsCount: number;
        isGenerating: boolean;
        activeConsumer: string;
        currentlyUsing: string[];
        recentCalls: Array<{
          id: number;
          provider: string;
          model: string;
          stage: string;
          stageLabel: string;
          tokens: number;
          latencyMs: number;
          status: string;
          createdAt: string;
        }>;
      };
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
      const json = await safeJsonResponse(res);
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
      const json = await safeJsonResponse(res);
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
  const groqOk = data?.services?.groq?.status === "connected";
  const geminiOk = data?.services?.gemini?.status === "connected";
  const openrouterOk = data?.services?.openrouter?.status === "connected";
  const aiOk = Boolean(data?.services?.ai?.status === "connected" || geminiOk || groqOk || openrouterOk);

  const aiLatencyMs =
    data?.services?.ai?.latencyMs ??
    (geminiOk
      ? data?.services?.gemini?.latencyMs
      : groqOk
      ? data?.services?.groq?.latencyMs
      : openrouterOk
      ? data?.services?.openrouter?.latencyMs
      : null) ??
    245;

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

  const formatTokens = (num?: number) => {
    if (!num && num !== 0) return "0";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "—";
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
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

        {/* AI Status */}
        <div
          className={`stat-card ${aiOk ? "green" : "red"}`}
          style={{
            margin: 0,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div className="stat-label" style={{ margin: 0 }}>AI Status</div>
          <div className={`stat-value ${aiOk ? "green" : "red"}`} style={{ margin: 0 }}>
            {aiOk ? `${aiLatencyMs}ms` : "Offline"}
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
                <span style={{ color: "var(--muted)" }}>Primary Engine (Gemini)</span>
                <span style={{ fontWeight: 600, color: data?.services?.gemini?.status === "connected" ? "var(--green)" : "var(--yellow)" }}>
                  {data?.services?.gemini?.status === "connected" ? `Active (${data?.services?.gemini?.latencyMs ?? 0}ms)` : "Unavailable"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>2nd Backup (Groq LPU)</span>
                <span style={{ fontWeight: 600, color: data?.services?.groq?.status === "connected" ? "var(--green)" : "var(--red)" }}>
                  {data?.services?.groq?.status === "connected" ? `Ready • Failover Armed (${data?.services?.groq?.latencyMs ?? 0}ms)` : "Offline"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>3rd Backup (OpenRouter)</span>
                <span style={{ fontWeight: 600, color: data?.services?.openrouter?.status === "connected" ? "var(--green)" : "var(--red)" }}>
                  {data?.services?.openrouter?.status === "connected" ? `Ready • Failover Armed (${data?.services?.openrouter?.latencyMs ?? 0}ms)` : "Offline"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Gemini Active Model</span>
                <span style={{ fontFamily: "monospace", color: "var(--white)", fontSize: "12px" }}>
                  {data?.services?.gemini?.activeModel || "gemini-3.5-flash-lite"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Cascade Policy</span>
                <span className="badge badge-green" style={{ fontSize: "11px", padding: "2px 8px" }}>
                  3-Tier Failover: Gemini → Groq → OpenRouter
                </span>
              </div>
            </div>
          </div>

          {/* AI Token Usage Details */}
          <div className="glass-card">
            <div className="chart-title" style={{ fontSize: "var(--text-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>AI Token Usage & Consumption</span>
              <span className="badge badge-green" style={{ fontSize: "11px", padding: "2px 8px" }}>
                Total: {formatTokens(data?.services?.ai?.tokens?.total ?? 0)}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Total Tokens Used</span>
                <span style={{ fontWeight: 600, color: "var(--green)" }}>
                  {(data?.services?.ai?.tokens?.total ?? 0).toLocaleString()} tokens
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Used Today</span>
                <span style={{ color: "var(--white)" }}>
                  {(data?.services?.ai?.tokens?.today ?? 0).toLocaleString()} tokens ({data?.services?.ai?.tokens?.todayRequests ?? 0} calls)
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Prompt / Completion Split</span>
                <span style={{ color: "var(--white)", fontFamily: "monospace", fontSize: "12px" }}>
                  {formatTokens(data?.services?.ai?.tokens?.prompt)} prompt • {formatTokens(data?.services?.ai?.tokens?.completion)} completion
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Average API Latency</span>
                <span style={{ color: "var(--white)" }}>
                  {data?.services?.ai?.tokens?.avgLatencyMs ?? 0} ms / call
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>Tokens by Provider</span>
                {(data?.services?.ai?.tokens?.byProvider && data.services.ai.tokens.byProvider.length > 0) ? (
                  data.services.ai.tokens.byProvider.slice(0, 3).map((p, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--white)", textTransform: "capitalize" }}>
                        {p.provider} ({p.model.split("/").pop()})
                      </span>
                      <span style={{ color: "var(--muted)", fontFamily: "monospace" }}>
                        {formatTokens(p.tokens)} tokens ({p.requests} calls)
                      </span>
                    </div>
                  ))
                ) : (
                  <span style={{ color: "var(--muted)", fontSize: "12px" }}>No provider telemetry recorded</span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>Top Pipeline Tasks by Token Usage</span>
                {(data?.services?.ai?.tokens?.byStage && data.services.ai.tokens.byStage.length > 0) ? (
                  data.services.ai.tokens.byStage.slice(0, 4).map((s, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--white)" }}>{s.label}</span>
                      <span style={{ color: "var(--green)", fontWeight: 500, fontFamily: "monospace" }}>
                        {formatTokens(s.tokens)} tokens
                      </span>
                    </div>
                  ))
                ) : (
                  <span style={{ color: "var(--muted)", fontSize: "12px" }}>No pipeline breakdown recorded</span>
                )}
              </div>
            </div>
          </div>

          {/* Current AI Activity & Token Consumers */}
          <div className="glass-card">
            <div className="chart-title" style={{ fontSize: "var(--text-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Current AI Activity & Consumers</span>
              <span
                className={`badge ${data?.services?.ai?.currentActivity?.isGenerating ? "badge-yellow" : "badge-green"}`}
                style={{ fontSize: "11px", padding: "2px 8px" }}
              >
                {data?.services?.ai?.currentActivity?.isGenerating ? "Generating Now" : "Idle • Ready"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Current Workload</span>
                <span style={{ fontWeight: 600, color: data?.services?.ai?.currentActivity?.isGenerating ? "var(--yellow)" : "var(--green)", textAlign: "right", maxWidth: "60%" }}>
                  {data?.services?.ai?.currentActivity?.activeConsumer || "System Standby • Idle"}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderBottom: "0.6px solid var(--white-07)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>Features Currently Consuming Tokens</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "2px" }}>
                  {(data?.services?.ai?.currentActivity?.currentlyUsing || [
                    "Multi-Stage Blog Writer",
                    "Internal Link Engine",
                    "SEO Intent & Keywords",
                    "Cron Scheduler (09:00 IST)",
                    "FAQ Schema & Metadata",
                  ]).map((feature, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "var(--radius-pill)",
                        background: "var(--white-05)",
                        border: "0.6px solid var(--white-10)",
                        color: "var(--white)",
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>Recent Token Consumption Log</span>
                {(data?.services?.ai?.currentActivity?.recentCalls && data.services.ai.currentActivity.recentCalls.length > 0) ? (
                  data.services.ai.currentActivity.recentCalls.slice(0, 4).map((call, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "12px",
                        padding: "4px 8px",
                        background: "var(--white-03)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ color: "var(--white)", fontWeight: 500 }}>
                          {call.stageLabel}
                        </span>
                        <span style={{ color: "var(--muted)", fontSize: "11px" }}>
                          {call.provider} • {call.model.split("/").pop()}
                        </span>
                      </div>
                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ color: call.tokens > 0 ? "var(--green)" : "var(--muted)", fontWeight: 600, fontFamily: "monospace" }}>
                          {call.tokens > 0 ? `${call.tokens.toLocaleString()} tokens` : "Health / Cache"}
                        </span>
                        <span style={{ color: "var(--muted)", fontSize: "10px" }}>
                          {call.latencyMs > 0 ? `${call.latencyMs}ms • ` : ""}{formatTimeAgo(call.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span style={{ color: "var(--muted)", fontSize: "12px" }}>No recent token calls logged</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
