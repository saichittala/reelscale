import React from "react";

interface SkeletonLoaderProps {
  type: "dashboard" | "clients" | "analytics" | "users" | "sales" | "blogs";
}

export function SkeletonLoader({ type }: SkeletonLoaderProps) {
  if (type === "dashboard") {
    return (
      <>
        <div className="skeleton-stat-grid">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div className="skeleton-stat-card" key={i}>
                <div className="skeleton-line skeleton"></div>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "40%" } as any}
                ></div>
              </div>
            ))}
        </div>
        <div className="skeleton-grid-2">
          <div className="skeleton-glass-card">
            <div className="skeleton-line skeleton"></div>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  className="skeleton-block skeleton skeleton-h-var"
                  style={{ "--h": "40px" } as any}
                  key={i}
                ></div>
              ))}
          </div>
          <div className="skeleton-glass-card">
            <div className="skeleton-line skeleton"></div>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  className="skeleton-block skeleton skeleton-h-var"
                  style={{ "--h": "40px" } as any}
                  key={i}
                ></div>
              ))}
          </div>
        </div>
      </>
    );
  }

  if (type === "clients") {
    return (
      <>
        <div className="skeleton-controls">
          <div
            className="skeleton-line skeleton skeleton-w-var skeleton-h-var"
            style={{ "--h": "38px", "--w": "260px" } as any}
          ></div>
          <div
            className="skeleton-line skeleton skeleton-w-var skeleton-h-var"
            style={{ "--h": "38px", "--w": "100px" } as any}
          ></div>
          <div
            className="skeleton-line skeleton skeleton-w-var skeleton-h-var"
            style={{ "--h": "38px", "--w": "100px" } as any}
          ></div>
        </div>
        <div className="skeleton-table">
          <div className="skeleton-table-header">
            <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "25%" } as any}></div>
            <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "15%" } as any}></div>
            <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "15%" } as any}></div>
            <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "8%" } as any}></div>
            <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "12%" } as any}></div>
            <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "15%" } as any}></div>
            <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "10%" } as any}></div>
          </div>
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div className="skeleton-table-row" key={i}>
                <div className="skeleton-avatar skeleton"></div>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "20%" } as any}
                ></div>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "15%" } as any}
                ></div>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "15%" } as any}
                ></div>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "8%" } as any}
                ></div>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "12%" } as any}
                ></div>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "15%" } as any}
                ></div>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "10%" } as any}
                ></div>
              </div>
            ))}
        </div>
      </>
    );
  }

  if (type === "analytics") {
    return (
      <>
        <div className="skeleton-stat-grid">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div className="skeleton-stat-card" key={i}>
                <div className="skeleton-line skeleton"></div>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "40%" } as any}
                ></div>
              </div>
            ))}
        </div>
        <div className="skeleton-grid-2">
          <div className="skeleton-glass-card">
            <div className="skeleton-line skeleton"></div>
            <div className="skeleton-chart-area skeleton"></div>
          </div>
          <div className="skeleton-glass-card">
            <div className="skeleton-line skeleton"></div>
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  className="skeleton-block skeleton skeleton-h-var mt-12"
                  style={{ "--h": "40px" } as any}
                  key={i}
                ></div>
              ))}
          </div>
        </div>
      </>
    );
  }

  if (type === "users") {
    return (
      <div className="skeleton-table">
        <div className="skeleton-table-header">
          <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "10%" } as any}></div>
          <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "20%" } as any}></div>
          <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "25%" } as any}></div>
          <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "20%" } as any}></div>
          <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "15%" } as any}></div>
          <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "10%" } as any}></div>
        </div>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div className="skeleton-table-row" key={i}>
              <div
                className="skeleton-line skeleton skeleton-w-var"
                style={{ "--w": "10%" } as any}
              ></div>
              <div
                className="skeleton-line skeleton skeleton-w-var"
                style={{ "--w": "20%" } as any}
              ></div>
              <div
                className="skeleton-line skeleton skeleton-w-var"
                style={{ "--w": "25%" } as any}
              ></div>
              <div
                className="skeleton-line skeleton skeleton-w-var"
                style={{ "--w": "20%" } as any}
              ></div>
              <div
                className="skeleton-line skeleton skeleton-w-var"
                style={{ "--w": "15%" } as any}
              ></div>
              <div
                className="skeleton-line skeleton skeleton-w-var"
                style={{ "--w": "10%" } as any}
              ></div>
            </div>
          ))}
      </div>
    );
  }

  if (type === "sales" || type === "blogs") {
    return (
      <>
        <div className="skeleton-controls mb-24">
          <div
            className="skeleton-line skeleton skeleton-w-var skeleton-h-var"
            style={{ "--h": "38px", "--w": "200px" } as any}
          ></div>
          <div
            className="skeleton-line skeleton skeleton-w-var skeleton-h-var"
            style={{ "--h": "38px", "--w": "200px" } as any}
          ></div>
        </div>
        <div className="skeleton-table">
          <div className="skeleton-table-header">
            <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "25%" } as any}></div>
            <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "20%" } as any}></div>
            <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "25%" } as any}></div>
            <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "15%" } as any}></div>
            <div className="skeleton-line skeleton skeleton-w-var" style={{ "--w": "15%" } as any}></div>
          </div>
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div className="skeleton-table-row" key={i}>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "25%" } as any}
                ></div>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "20%" } as any}
                ></div>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "25%" } as any}
                ></div>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "15%" } as any}
                ></div>
                <div
                  className="skeleton-line skeleton skeleton-w-var"
                  style={{ "--w": "15%" } as any}
                ></div>
              </div>
            ))}
        </div>
      </>
    );
  }

  return null;
}
