import { useEffect, useRef, useState } from "react";
import { Client } from "../types";
import { fmt, fmtFull } from "../utils/format";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { loadChartJS } from "../utils/loader";
import { fetchDeliveries } from "../services/api";
import { IconCalendar } from "../components/Icons";
import {
  getPreviousMonthKey,
  isClientActiveInMonth,
} from "../utils/subscription";

interface OverviewProps {
  clients: Client[];
  allClients?: Client[];
  selectedMonth?: string;
  availableMonths?: { key: string; label: string }[];
  isLoading: boolean;
}

function MetricInfoTooltip({ content }: { content: string }) {
  if (!content) return null;
  return (
    <span
      className="stat-info-wrap"
      tabIndex={0}
      role="button"
      aria-label={content}
      onClick={(e) => e.stopPropagation()}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stat-info-icon"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      <span className="stat-tooltip-pop">{content}</span>
    </span>
  );
}

export function Overview({
  clients,
  allClients = [],
  selectedMonth = "all",
  availableMonths = [],
  isLoading,
}: OverviewProps) {
  const chartInstanceRef = useRef<any>(null);
  const [totalDeliveredInMonth, setTotalDeliveredInMonth] = useState<number>(0);

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

  // Chart initialization
  useEffect(() => {
    if (isLoading || clients.length === 0) return;

    let active = true;

    async function initChart() {
      const Chart = await loadChartJS();
      if (!Chart || !active) return;

      const canvas = document.getElementById(
        "rev-chart"
      ) as HTMLCanvasElement | null;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const chartData = [...clients].sort(
        (a, b) => getClientRevenue(b) - getClientRevenue(a)
      );

      chartInstanceRef.current = new Chart(canvas, {
        type: "bar",
        data: {
          labels: chartData.map((c) => {
            const displayName =
              c.name && c.name.trim() ? c.name : c.business || "Unnamed";
            return displayName.split(" ")[0];
          }),
          datasets: [
            {
              label: "Monthly Revenue (₹)",
              data: chartData.map((c) => getClientRevenue(c)),
              backgroundColor: chartData.map((_, i) =>
                i === 0
                  ? "oklch(0.75 0.10 85 / 0.7)"
                  : "oklch(52% 0.22 25 / 0.5)"
              ),
              borderColor: chartData.map((_, i) =>
                i === 0
                  ? "oklch(0.75 0.10 85)"
                  : "oklch(62.944% 0.25583 25.982)"
              ),
              borderWidth: 1.5,
              borderRadius: 18,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context: any) =>
                  "₹" + context.raw.toLocaleString("en-IN"),
              },
            },
          },
          scales: {
            x: {
              grid: { color: "rgba(128,128,128,0.1)" },
              ticks: { color: "rgba(128,128,128,0.75)", font: { size: 11 } },
            },
            y: {
              grid: { color: "rgba(128,128,128,0.1)" },
              ticks: {
                color: "rgba(128,128,128,0.75)",
                font: { size: 11 },
                callback: (v: any) => "₹" + v.toLocaleString("en-IN"),
              },
            },
          },
        },
      });
    }

    initChart();

    return () => {
      active = false;
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [clients, isLoading]);

  if (isLoading) {
    return <SkeletonLoader type="dashboard" />;
  }

  return (
    <>
      {/* Month Insights Banner when month filter is active */}
      {selectedMonth && selectedMonth !== "all" && (
        <div className="dashboard-month-banner">
          <div className="dashboard-month-banner-left">
            <span className="dashboard-month-banner-title">
              <IconCalendar size={14} className="text-muted" />
              {availableMonths.find((m) => m.key === selectedMonth)?.label || selectedMonth} Overview
            </span>
            <span className="dashboard-metric-sep">•</span>
            <span style={{ color: "var(--muted)" }}>
              Subscription retainers carried forward & active in this month
            </span>
          </div>
          <span className="dashboard-badge-success">
            {totalClients} Active {totalClients === 1 ? "Account" : "Accounts"}
          </span>
        </div>
      )}

      {/* Unified Metrics Row */}
      <div className="stat-grid">
        <div className="stat-card white">
          <div className="stat-label">Monthly Revenue (MRR)</div>
          <div className="stat-value green">
            <span>{fmtFull(monthlyRevenue)}</span>
            {selectedMonth && selectedMonth !== "all" && prevClients.length > 0 && (
              <MetricInfoTooltip
                content={`${revenueDiff >= 0 ? `+₹${Math.abs(revenueDiff).toLocaleString("en-IN")} (+${revenueGrowth}%)` : `-₹${Math.abs(revenueDiff).toLocaleString("en-IN")} (${revenueGrowth}%)`} MoM vs previous month`}
              />
            )}
          </div>
          <div className="stat-icon">
            <img src="/assets/icons/revenue.svg" alt="MRR Icon" />
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-label" title="Annual Recurring Revenue">ARR</div>
          <div className="stat-value green">
            <span>{fmtFull(annualRevenue)}</span>
          </div>
          <div className="stat-icon">
            <img src="/assets/icons/revenue.svg" alt="ARR Icon" />
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-label">Active Clients</div>
          <div className="stat-value">
            <span>{totalClients}</span>
            {selectedMonth && selectedMonth !== "all" && prevClients.length > 0 && (
              <MetricInfoTooltip
                content={`${clientDiff >= 0 ? `+${clientDiff} clients` : `${clientDiff} clients`} vs previous month`}
              />
            )}
          </div>
          <div className="stat-icon">
            <img src="/assets/icons/nav-clients.svg" alt="Clients Icon" />
          </div>
        </div>

        <div className="stat-card gold">
          <div className="stat-label">
            {selectedMonth && selectedMonth !== "all"
              ? "Monthly Reels Target"
              : "Monthly Reels Quota"}
          </div>
          <div className="stat-value gold" style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span>{totalDeliveredInMonth}</span>
            <span style={{ fontSize: "16px", color: "var(--muted)", fontWeight: 500 }}>
              / {totalReels} Del.
            </span>
            <MetricInfoTooltip
              content={
                totalDeliveredInMonth >= totalReels && totalReels > 0
                  ? `All ${totalReels} reels delivered this cycle (100%)`
                  : totalDeliveredInMonth > 0
                    ? `${totalDeliveredInMonth} delivered · ${Math.max(0, totalReels - totalDeliveredInMonth)} pending this cycle`
                    : selectedMonth && selectedMonth !== "all"
                      ? `Cycle reset for ${availableMonths.find((m) => m.key === selectedMonth)?.label || selectedMonth} (0/${totalReels})`
                      : `0/${totalReels} delivered this cycle (${totalReels} pending)`
              }
            />
          </div>
          <div className="stat-icon">
            <img src="/assets/icons/reels.svg" alt="Reels Icon" />
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-label">Avg Rev / Client</div>
          <div className="stat-value blue">
            <span>₹{avgMonthlyRevenue ? fmt(avgMonthlyRevenue) : "0"}</span>
          </div>
          <div className="stat-icon">
            <img src="/assets/icons/nav-analytics.svg" alt="Avg Icon" />
          </div>
        </div>

        <div className="stat-card white">
          <div className="stat-label">Avg Rate / Reel</div>
          <div className="stat-value gold">
            <span>₹{avgPricePerReel ? avgPricePerReel.toLocaleString("en-IN") : "0"}</span>
          </div>
          <div className="stat-icon">
            <img src="/assets/icons/reels.svg" alt="Rate Icon" />
          </div>
        </div>
      </div>

      {/* Analytics Visuals: Chart & Revenue Breakdown */}
      <div className="revenue-grid">
        <div className="glass-card">
          <div className="chart-title">Monthly Revenue Per Client</div>
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
            ) : (
              <canvas id="rev-chart"></canvas>
            )}
          </div>
        </div>

        <div className="glass-card">
          <div className="chart-title">Client Monthly Revenue Breakdown</div>
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
