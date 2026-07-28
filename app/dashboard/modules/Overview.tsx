import React from "react";
import { Client } from "../types";
import { fmt, fmtFull } from "../utils/format";
import { SkeletonLoader } from "../components/SkeletonLoader";

interface OverviewProps {
  clients: Client[];
  isLoading: boolean;
}

export function Overview({ clients, isLoading }: OverviewProps) {
  if (isLoading) {
    return <SkeletonLoader type="dashboard" />;
  }

  // Calculate statistics
  const totalClients = clients.length;
  const totalReels = clients.reduce((sum, c) => sum + (c.reels || 0), 0);
  const totalRevenue = clients.reduce(
    (sum, c) => sum + (c.reels || 0) * (c.ppr || 0),
    0
  );

  const getClientRevenue = (c: Client) => (c.reels || 0) * (c.ppr || 0);

  // Sorting for top clients
  const topClients = [...clients]
    .sort((a, b) => getClientRevenue(b) - getClientRevenue(a))
    .slice(0, 8);

  // Recent clients (up to 9, reversed order of arrival)
  const recentClients = [...clients].slice(-9).reverse();

  return (
    <>
      {/* Metrics Row */}
      <div className="stat-grid">
        <div className="stat-card red">
          <div className="stat-label">Total Clients</div>
          <div className="stat-value">{totalClients}</div>
          <div className="stat-sub dn">Active accounts</div>
          <div className="stat-icon">
            <img src="/assets/icons/nav-clients.svg" alt="Clients Icon" />
          </div>
        </div>

        <div className="stat-card gold">
          <div className="stat-label">Total Reels</div>
          <div className="stat-value gold">{totalReels.toLocaleString()}</div>
          <div className="stat-sub dn">Reels created</div>
          <div className="stat-icon">
            <img src="/assets/icons/reels.svg" alt="Reels Icon" />
          </div>
        </div>

        <div className="stat-card white">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value green">{fmtFull(totalRevenue)}</div>
          <div className="stat-sub dn">{fmt(totalRevenue)}</div>
          <div className="stat-icon">
            <img src="/assets/icons/revenue.svg" alt="Revenue Icon" />
          </div>
        </div>
      </div>

      {/* Grid: Top Clients & Recent Activity */}
      <div className="dash-clients-grid">
        {/* Top Clients by Revenue */}
        <div className="glass-card">
          <div className="glass-card-label">Top Clients by Revenue</div>
          {topClients.map((c, i) => {
            const displayName =
              c.name && c.name.trim() ? c.name : c.business || "Unnamed Client";
            const avatarChar = (
              c.name && c.name.trim()
                ? c.name.trim()[0]
                : c.business && c.business.trim()
                ? c.business.trim()[0]
                : "?"
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
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={displayName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    avatarChar
                  )}
                </div>
                <div className="client-meta">
                  <div className="client-name">{displayName}</div>
                  <div className="client-biz">
                    {c.business || "—"} · {c.reels || 0} reels
                  </div>
                </div>
                <div className="client-rev">₹{fmt(getClientRevenue(c))}</div>
              </div>
            );
          })}
        </div>

        {/* Recent Clients list */}
        <div className="glass-card">
          <div className="glass-card-label">Recent Clients</div>
          {recentClients.map((c) => {
            const displayName =
              c.name && c.name.trim() ? c.name : c.business || "Unnamed Client";
            return (
              <div className="top-client" key={c.id}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                  }}
                >
                  <div className="client-name" style={{ marginLeft: "4px" }}>
                    {displayName}
                  </div>
                  <div className="client-biz" style={{ marginLeft: "4px" }}>
                    {c.instagram || "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="badge badge-gold">
                    ₹{fmt(getClientRevenue(c))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
export default Overview;
