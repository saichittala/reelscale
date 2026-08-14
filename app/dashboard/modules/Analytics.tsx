import React, { useEffect, useRef } from "react";
import { Client } from "../types";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { fmt, fmtFull } from "../utils/format";
import { loadChartJS } from "../utils/loader";

interface AnalyticsProps {
  clients: Client[];
  isLoading: boolean;
}

export function Analytics({ clients, isLoading }: AnalyticsProps) {
  const chartInstanceRef = useRef<any>(null);

  const parseClientInstagram = (instagram: string, currentPpr: number) => {
    const cleanInsta = instagram || "";
    const match = cleanInsta.match(/^(.*?)(?:\s*\[(.*?)\])?$/);
    const metaStr = match && match[2] ? match[2] : "";
    const meta: Record<string, string> = {};
    if (metaStr) {
      metaStr.split(";").forEach((pair) => {
        const [k, v] = pair.split(":");
        if (k && v) meta[k.trim()] = v.trim();
      });
    }
    return {
      billingType: meta.billingType || "reel-to-reel",
      flatFee: meta.flatFee ? Number(meta.flatFee) : 0,
    };
  };

  const getClientRevenue = (c: Client) => {
    const meta = parseClientInstagram(c.instagram, c.ppr);
    if (meta.billingType === "subscription") {
      return meta.flatFee || Math.round((c.reels || 0) * (c.ppr || 0));
    }
    return (c.reels || 0) * (c.ppr || 0);
  };

  const totalClients = clients.length;
  const totalRevenue = clients.reduce((sum, c) => sum + getClientRevenue(c), 0);
  const avgRevenue = totalClients ? Math.round(totalRevenue / totalClients) : 0;

  const sortedClients = [...clients].sort(
    (a, b) => getClientRevenue(b) - getClientRevenue(a)
  );
  const topClient = sortedClients[0] || null;

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
              label: "Revenue (₹)",
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
              grid: { color: "rgba(255,255,255,0.04)" },
              ticks: { color: "rgba(255,255,255,0.45)", font: { size: 11 } },
            },
            y: {
              grid: { color: "rgba(255,255,255,0.04)" },
              ticks: {
                color: "rgba(255,255,255,0.45)",
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
    return <SkeletonLoader type="analytics" />;
  }

  return (
    <>
      {/* Metrics Row */}
      <div className="stat-grid">
        <div className="stat-card red">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value red">{fmt(totalRevenue)}</div>
          <div className="stat-sub">{fmtFull(totalRevenue)}</div>
        </div>

        <div className="stat-card gold">
          <div className="stat-label">Avg Revenue/Client</div>
          <div className="stat-value gold">
            ₹{avgRevenue ? fmt(avgRevenue) : 0}
          </div>
          <div className="stat-sub">Per client average</div>
        </div>

        <div className="stat-card white">
          <div className="stat-label">Top Client</div>
          <div className="stat-value analytics-card-stat">
            {topClient ? topClient.name || topClient.business || "—" : "—"}
          </div>
          <div className="stat-sub">
            {topClient ? fmtFull(getClientRevenue(topClient)) : ""}
          </div>
        </div>
      </div>

      {/* Grid: Charts & Share Breakdown */}
      <div className="revenue-grid">
        <div className="glass-card">
          <div className="chart-title">Revenue Per Client</div>
          <div className="chart-sub mb-16">
            Sorted by revenue · All clients
          </div>
          <div className="analytics-chart-container">
            <canvas id="rev-chart"></canvas>
          </div>
        </div>

        <div className="glass-card">
          <div className="chart-title mb-24">
            Client Revenue Breakdown
          </div>
          <div className="analytics-list-container">
            {sortedClients.map((c, i) => {
              const rev = getClientRevenue(c);
              const pct =
                totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0;
              const displayName =
                c.name && c.name.trim()
                  ? c.name
                  : c.business || "Unnamed Client";
              return (
                <div
                  className="rev-bar-wrap mb-20"
                  key={c.id}
                >
                  <div className="rev-bar-label">
                    <span className="text-medium-14">
                      {i + 1}. {displayName}{" "}
                      <span className="text-muted">
                        · {c.business || "—"}
                      </span>
                    </span>
                    <span className="text-semibold-white">
                      ₹{rev.toLocaleString("en-IN")}{" "}
                      <span className="text-muted">
                        ({pct}%)
                      </span>
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
            })}
          </div>
        </div>
      </div>
    </>
  );
}
export default Analytics;