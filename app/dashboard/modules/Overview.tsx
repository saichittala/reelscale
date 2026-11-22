import { useEffect, useState } from "react";
import { Client } from "../types";
import { fmt, fmtFull } from "../utils/format";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { fetchDeliveries } from "../services/api";
import {
  getPreviousMonthKey,
  isClientActiveInMonth,
} from "../utils/subscription";
import {
  BarChart,
  DonutChart,
  type BarChartDatum,
  type DonutChartDatum,
} from "@/components/ui/chart";

interface OverviewProps {
  clients: Client[];
  allClients?: Client[];
  selectedMonth?: string;
  availableMonths?: { key: string; label: string }[];
  isLoading: boolean;
}

export function Overview({
  clients,
  allClients = [],
  selectedMonth = "all",
  availableMonths = [],
  isLoading,
}: OverviewProps) {
  const [totalDeliveredInMonth, setTotalDeliveredInMonth] = useState<number>(0);
  const [revenueChartMode, setRevenueChartMode] = useState<"bar" | "arc">("bar");
  const [breakdownMode, setBreakdownMode] = useState<"arc" | "list">("arc");

  useEffect(() => {
    async function loadDeliveries() {
      try {
        const res = await fetchDeliveries();
        const list = res.deliveries || [];
        const targetMonth =
          selectedMonth && selectedMonth !== "all"
            ? selectedMonth
            : new Date().toISOString().slice(0, 7);
        let monthTotal = 0;
        list.forEach((d) => {
          if (d.month === targetMonth && d.status === "Delivered") {
            monthTotal += 1;
          }
        });
        setTotalDeliveredInMonth(monthTotal);
      } catch (e) {
        console.warn("Could not load deliveries for overview", e);
      }
    }
    loadDeliveries();
  }, [selectedMonth]);

  const getClientRevenue = (c: Client) =>
    c.revenue || (c.reels || 0) * (c.ppr || 0);

  // Statistics
  const totalClients = clients.length;
  const totalReels = clients.reduce((sum, c) => sum + (c.reels || 0), 0);
  const monthlyRevenue = clients.reduce(
    (sum, c) => sum + getClientRevenue(c),
    0
  );
  const annualRevenue = monthlyRevenue * 12;
  const avgMonthlyRevenue = totalClients
    ? Math.round(monthlyRevenue / totalClients)
    : 0;
  const avgPricePerReel = totalReels
    ? Math.round(monthlyRevenue / totalReels)
    : 0;

  // Month-over-month comparisons when a specific month is selected
  const prevMonthKey =
    selectedMonth !== "all" ? getPreviousMonthKey(selectedMonth) : "";
  const prevClients = prevMonthKey
    ? allClients.filter((c) => isClientActiveInMonth(c, prevMonthKey))
    : [];
  const prevMonthlyRevenue = prevClients.reduce(
    (sum, c) => sum + getClientRevenue(c),
    0
  );
  const revenueDiff = monthlyRevenue - prevMonthlyRevenue;
  const revenueGrowth =
    prevMonthlyRevenue > 0
      ? Math.round((revenueDiff / prevMonthlyRevenue) * 100)
      : 0;
  const clientDiff = totalClients - prevClients.length;

  // Sorting for top clients & analytics
  const sortedClients = [...clients].sort(
    (a, b) => getClientRevenue(b) - getClientRevenue(a)
  );
  const topClients = sortedClients.slice(0, 8);
  const recentClients = [...clients].slice(-8).reverse();

  // Arc UI Chart data mapping
  const selectedMonthLabel =
    availableMonths.find((m) => m.key === selectedMonth)?.label ||
    (selectedMonth === "all" ? "All Time" : selectedMonth);

  const barChartData: BarChartDatum[] = sortedClients.map((c) => {
    const displayName =
      c.name && c.name.trim() ? c.name : c.business || "Unnamed";
    return {
      key: String(c.id),
      label: displayName,
      axisLabel: displayName.split(" ")[0],
      value: getClientRevenue(c),
    };
  });

  const donutColors = [
    "var(--series-1)",
    "var(--series-2)",
    "var(--series-3)",
    "var(--series-4)",
    "oklch(0.70 0.14 320)",
    "oklch(0.65 0.12 200)",
    "oklch(0.72 0.15 45)",
    "oklch(0.68 0.18 100)",
  ];

  const donutChartData: DonutChartDatum[] = sortedClients.map((c, i) => {
    const displayName =
      c.name && c.name.trim() ? c.name : c.business || "Unnamed";
    return {
      key: String(c.id),
      label: displayName,
      value: getClientRevenue(c),
      color: donutColors[i % donutColors.length],
    };
  });

  if (isLoading) {
    return <SkeletonLoader type="dashboard" />;
  }

  return (
    <>
      {/* Month Insights Banner when month filter is active */}
      {selectedMonth && selectedMonth !== "all" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "18px",
            padding: "10px 16px",
            marginBottom: "20px",
            fontSize: "13px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, color: "var(--white)" }}>
              📅 {availableMonths.find((m) => m.key === selectedMonth)?.label || selectedMonth} Overview
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
            <span style={{ color: "var(--muted)" }}>
              Subscription retainers carried forward & active in this month
            </span>
          </div>
          <span
            style={{
              padding: "2px 10px",
              borderRadius: "99px",
              fontSize: "11px",
              fontWeight: 600,
              background: "rgba(34, 197, 94, 0.15)",
              color: "var(--green)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
            }}
          >
            {totalClients} Active {totalClients === 1 ? "Account" : "Accounts"}
          </span>
        </div>
      )}

      {/* Unified Metrics Row */}
      <div className="stat-grid">
        <div className="stat-card white">
          <div className="stat-label">Monthly Revenue (MRR)</div>
          <div className="stat-value green">{fmtFull(monthlyRevenue)}</div>
          {selectedMonth && selectedMonth !== "all" && prevClients.length > 0 ? (
            <div className="stat-sub" style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              {revenueDiff >= 0 ? (
                <span style={{ color: "var(--green)", fontWeight: 600 }}>↑ +₹{Math.abs(revenueDiff).toLocaleString("en-IN")} ({revenueGrowth >= 0 ? `+${revenueGrowth}%` : `${revenueGrowth}%`})</span>
              ) : (
                <span style={{ color: "var(--red)", fontWeight: 600 }}>↓ -₹{Math.abs(revenueDiff).toLocaleString("en-IN")} ({revenueGrowth}%)</span>
              )}
              <span className="td-muted">MoM</span>
            </div>
          ) : (
            <div className="stat-sub dn">{fmt(monthlyRevenue)}</div>
          )}
          <div className="stat-icon">
            <img src="/assets/icons/revenue.svg" alt="MRR Icon" />
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-label" title="Annual Recurring Revenue">ARR</div>
          <div className="stat-value green">{fmtFull(annualRevenue)}</div>
          <div className="stat-sub dn">{fmt(annualRevenue)}</div>
          <div className="stat-icon">
            <img src="/assets/icons/revenue.svg" alt="ARR Icon" />
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-label">Active Clients</div>
          <div className="stat-value">{totalClients}</div>
          {selectedMonth && selectedMonth !== "all" && prevClients.length > 0 ? (
            <div className="stat-sub" style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              {clientDiff >= 0 ? (
                <span style={{ color: "var(--green)", fontWeight: 600 }}>+{clientDiff} clients</span>
              ) : (
                <span style={{ color: "var(--red)", fontWeight: 600 }}>{clientDiff} clients</span>
              )}
              <span className="td-muted">vs last mo</span>
            </div>
          ) : (
            <div className="stat-sub dn">Active monthly accounts</div>
          )}
          <div className="stat-icon">
            <img src="/assets/icons/nav-clients.svg" alt="Clients Icon" />
          </div>
        </div>

        <div className="stat-card gold">
          <div className="stat-label">
            {selectedMonth && selectedMonth !== "all" ? "Monthly Reels Target" : "Monthly Reels Quota"}
          </div>
          <div className="stat-value gold" style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span>{totalDeliveredInMonth}</span>
            <span style={{ fontSize: "16px", color: "var(--muted)", fontWeight: 500 }}>
              / {totalReels} Del.
            </span>
          </div>
          <div className="stat-sub" style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            {totalDeliveredInMonth >= totalReels && totalReels > 0 ? (
              <span style={{ color: "var(--green)", fontWeight: 600 }}>
                ✓ All {totalReels} delivered (100%)
              </span>
            ) : totalDeliveredInMonth > 0 ? (
              <span style={{ color: "var(--gold)", fontWeight: 600 }}>
                {totalDeliveredInMonth} delivered · {Math.max(0, totalReels - totalDeliveredInMonth)} pending
              </span>
            ) : (
              <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                {selectedMonth && selectedMonth !== "all"
                  ? `Cycle reset for ${availableMonths.find((m) => m.key === selectedMonth)?.label || selectedMonth} (0/${totalReels})`
                  : `0/${totalReels} delivered this cycle`}
              </span>
            )}
          </div>
          <div className="stat-icon">
            <img src="/assets/icons/reels.svg" alt="Reels Icon" />
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-label">Avg Rev / Client</div>
          <div className="stat-value blue">
            ₹{avgMonthlyRevenue ? fmt(avgMonthlyRevenue) : "0"}
          </div>
          <div className="stat-sub dn">Per client average</div>
          <div className="stat-icon">
            <img src="/assets/icons/nav-analytics.svg" alt="Avg Icon" />
          </div>
        </div>

        <div className="stat-card white">
          <div className="stat-label">Avg Rate / Reel</div>
          <div className="stat-value gold">
            ₹{avgPricePerReel ? avgPricePerReel.toLocaleString("en-IN") : "0"}
          </div>
          <div className="stat-sub dn">Agency average rate</div>
          <div className="stat-icon">
            <img src="/assets/icons/reels.svg" alt="Rate Icon" />
          </div>
        </div>
      </div>

      {/* Analytics Visuals: Chart & Revenue Breakdown */}
      <div className="revenue-grid">
        <div className="glass-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div className="chart-title" style={{ margin: 0 }}>
              Monthly Revenue Per Client
            </div>
            {clients.length > 0 && (
              <div
                style={{
                  display: "inline-flex",
                  gap: "4px",
                  background: "var(--white-04)",
                  padding: "3px",
                  borderRadius: "var(--radius-pill)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setRevenueChartMode("bar")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    cursor: "pointer",
                    background:
                      revenueChartMode === "bar" ? "var(--red)" : "transparent",
                    color: revenueChartMode === "bar" ? "#fff" : "var(--muted)",
                    fontWeight: 500,
                    transition: "all var(--duration-fast)",
                  }}
                >
                  Bar
                </button>
                <button
                  type="button"
                  onClick={() => setRevenueChartMode("arc")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    cursor: "pointer",
                    background:
                      revenueChartMode === "arc" ? "var(--red)" : "transparent",
                    color: revenueChartMode === "arc" ? "#fff" : "var(--muted)",
                    fontWeight: 500,
                    transition: "all var(--duration-fast)",
                  }}
                >
                  Arc
                </button>
              </div>
            )}
          </div>
          <div className="analytics-chart-container">
            {clients.length === 0 ? (
              <div
                className="text-muted"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "260px",
                }}
              >
                No client revenue data available for this selection
              </div>
            ) : revenueChartMode === "arc" ? (
              <div
                style={{
                  padding: "16px 0",
                  minHeight: "280px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DonutChart
                  data={donutChartData}
                  label="Monthly Revenue"
                  totalLabel="Total Revenue"
                  formatValue={(val) =>
                    "₹" + Math.round(val).toLocaleString("en-IN")
                  }
                  legendAction="select"
                  legend={true}
                  size={210}
                  thickness={26}
                />
              </div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                <BarChart
                  data={barChartData}
                  label="Monthly Revenue"
                  period={selectedMonthLabel}
                  averageLabel="Average per client"
                  valueLabel="Client Revenue"
                  showAverage={true}
                  height={220}
                  formatValue={(val) =>
                    "₹" + Math.round(val).toLocaleString("en-IN")
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div className="glass-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div className="chart-title" style={{ margin: 0 }}>
              Client Monthly Revenue Breakdown
            </div>
            {clients.length > 0 && (
              <div
                style={{
                  display: "inline-flex",
                  gap: "4px",
                  background: "var(--white-04)",
                  padding: "3px",
                  borderRadius: "var(--radius-pill)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setBreakdownMode("arc")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    cursor: "pointer",
                    background:
                      breakdownMode === "arc" ? "var(--red)" : "transparent",
                    color: breakdownMode === "arc" ? "#fff" : "var(--muted)",
                    fontWeight: 500,
                    transition: "all var(--duration-fast)",
                  }}
                >
                  Arc Graph
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownMode("list")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    cursor: "pointer",
                    background:
                      breakdownMode === "list" ? "var(--red)" : "transparent",
                    color: breakdownMode === "list" ? "#fff" : "var(--muted)",
                    fontWeight: 500,
                    transition: "all var(--duration-fast)",
                  }}
                >
                  List View
                </button>
              </div>
            )}
          </div>
          <div className="analytics-list-container">
            {clients.length === 0 ? (
              <div
                className="text-muted"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "200px",
                }}
              >
                No clients found
              </div>
            ) : breakdownMode === "arc" ? (
              <div
                style={{
                  padding: "16px 0",
                  minHeight: "280px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DonutChart
                  data={donutChartData}
                  label="Revenue Breakdown"
                  totalLabel="Total Revenue"
                  formatValue={(val) =>
                    "₹" + Math.round(val).toLocaleString("en-IN")
                  }
                  legendAction="select"
                  legend={true}
                  size={210}
                  thickness={26}
                />
              </div>
            ) : (
              sortedClients.map((c, i) => {
                const rev = getClientRevenue(c);
                const pct =
                  monthlyRevenue > 0
                    ? Math.round((rev / monthlyRevenue) * 100)
                    : 0;
                const displayName =
                  c.name && c.name.trim()
                    ? c.name
                    : c.business || "Unnamed Client";
                return (
                  <div className="rev-bar-wrap mb-20" key={c.id}>
                    <div className="rev-bar-label">
                      <span className="text-medium-14">
                        {i + 1}. {displayName}{" "}
                        <span className="text-muted">
                          · {c.business || "—"}
                        </span>
                      </span>
                      <span className="text-semibold-white">
                        ₹{rev.toLocaleString("en-IN")}{" "}
                        <span className="text-muted">({pct}%)</span>
                      </span>
                    </div>
                    <div className="rev-bar">
                      <div
                        className="rev-bar-fill"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Grid: Top Clients & Recent Activity */}
      <div className="dash-clients-grid">
        {/* Top Clients by Revenue */}
        <div className="glass-card">
          <div className="chart-title">Top Clients by Monthly Revenue</div>
          <div
            style={{
              maxHeight: "350px",
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {topClients.length === 0 ? (
              <div
                className="text-muted"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "150px",
                }}
              >
                No clients recorded
              </div>
            ) : (
              topClients.map((c, i) => {
                const nameStr = String(c.name || "").trim();
                const businessStr = String(c.business || "").trim();
                const displayName = nameStr || businessStr || "Unnamed Client";
                const avatarChar = (
                  nameStr ? nameStr[0] : businessStr ? businessStr[0] : "?"
                ).toUpperCase();

                const isGold = i === 0;

                return (
                  <div className="top-client" key={c.id}>
                    <div
                      className="client-avatar"
                      style={
                        isGold
                          ? {
                            background: "oklch(0.75 0.10 85 / 0.15)",
                            color: "var(--gold)",
                          }
                          : undefined
                      }
                    >
                      {(() => {
                        const cleanImg = String(c.image || "")
                          .trim()
                          .toLowerCase();
                        const hasValidImage =
                          cleanImg !== "" &&
                          cleanImg !== "—" &&
                          cleanImg !== "image url" &&
                          (cleanImg.startsWith("http") ||
                            cleanImg.startsWith("/"));
                        return hasValidImage ? (
                          <img src={c.image} alt={displayName} />
                        ) : (
                          avatarChar
                        );
                      })()}
                    </div>
                    <div className="client-meta">
                      <div className="client-name">{displayName}</div>
                      <div className="client-biz">
                        {businessStr || "—"} · {c.reels || 0} reels/mo
                      </div>
                    </div>
                    <div className="client-rev">
                      ₹{fmt(getClientRevenue(c))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Clients list */}
        <div className="glass-card">
          <div className="chart-title">Recent Clients</div>
          <div
            style={{
              maxHeight: "350px",
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {recentClients.length === 0 ? (
              <div
                className="text-muted"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "150px",
                }}
              >
                No recent clients
              </div>
            ) : (
              recentClients.map((c) => {
                const nameStr = String(c.name || "").trim();
                const businessStr = String(c.business || "").trim();
                const displayName = nameStr || businessStr || "Unnamed Client";
                return (
                  <div className="top-client" key={c.id}>
                    <div className="client-info-col">
                      <div className="client-name ml-4">{displayName}</div>
                      <div className="client-biz ml-4">
                        {c.instagram || "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="badge badge-gold">
                        ₹{fmt(getClientRevenue(c))}/mo
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Overview;
