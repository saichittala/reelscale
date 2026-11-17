import React, { useEffect, useRef } from "react";
import { Client } from "../types";
import { fmt, fmtFull } from "../utils/format";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { loadChartJS } from "../utils/loader";
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

export function Overview({
  clients,
  allClients = [],
  selectedMonth = "all",
  availableMonths = [],
  isLoading,
}: OverviewProps) {
  const chartInstanceRef = useRef<any>(null);

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
              borderRadius: 6,
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
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
          <div className="stat-label">Annual Recurring Revenue (ARR)</div>
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
          <div className="stat-label">Monthly Reels</div>
          <div className="stat-value gold">{totalReels.toLocaleString()}</div>
          <div className="stat-sub dn">Reels targeted / month</div>
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
          <div className="chart-title">Monthly Revenue Per Client</div>
          <div className="chart-sub mb-16">
            Sorted by monthly revenue · {clients.length}{" "}
            {clients.length === 1 ? "client" : "clients"}
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
            ) : (
              <canvas id="rev-chart"></canvas>
            )}
          </div>
        </div>

        <div className="glass-card">
          <div className="chart-title">Client Monthly Revenue Breakdown</div>
          <div className="chart-sub mb-16">Share of total MRR by account</div>
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
          <div className="chart-sub mb-16">
            Highest revenue generating accounts
          </div>
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
          <div className="chart-sub mb-16">Latest accounts onboarded</div>
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
