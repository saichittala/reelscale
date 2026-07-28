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
                  className="skeleton-line skeleton"
                  style={{ width: "40%" }}
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
                  className="skeleton-block skeleton"
                  style={{ height: "40px" }}
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
                  className="skeleton-block skeleton"
                  style={{ height: "40px" }}
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
            className="skeleton-line skeleton"
            style={{ height: "38px", width: "260px" }}
          ></div>
          <div
            className="skeleton-line skeleton"
            style={{ height: "38px", width: "100px" }}
          ></div>
          <div
            className="skeleton-line skeleton"
            style={{ height: "38px", width: "100px" }}
          ></div>
        </div>
        <div className="skeleton-table">
          <div className="skeleton-table-header">
            <div className="skeleton-line skeleton" style={{ width: "25%" }}></div>
            <div className="skeleton-line skeleton" style={{ width: "15%" }}></div>
            <div className="skeleton-line skeleton" style={{ width: "15%" }}></div>
            <div className="skeleton-line skeleton" style={{ width: "8%" }}></div>
            <div className="skeleton-line skeleton" style={{ width: "12%" }}></div>
            <div className="skeleton-line skeleton" style={{ width: "15%" }}></div>
            <div className="skeleton-line skeleton" style={{ width: "10%" }}></div>
          </div>
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div className="skeleton-table-row" key={i}>
                <div className="skeleton-avatar skeleton"></div>
                <div
                  className="skeleton-line skeleton"
                  style={{ width: "20%" }}
                ></div>
                <div
                  className="skeleton-line skeleton"
                  style={{ width: "15%" }}
                ></div>
                <div
                  className="skeleton-line skeleton"
                  style={{ width: "15%" }}
                ></div>
                <div
                  className="skeleton-line skeleton"
                  style={{ width: "8%" }}
                ></div>
                <div
                  className="skeleton-line skeleton"
                  style={{ width: "12%" }}
                ></div>
                <div
                  className="skeleton-line skeleton"
                  style={{ width: "15%" }}
                ></div>
                <div
                  className="skeleton-line skeleton"
                  style={{ width: "10%" }}
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
                  className="skeleton-line skeleton"
                  style={{ width: "40%" }}
                ></div>
              </div>
            ))}
        </div>
        <div className="skeleton-grid-2">
          <div className="skeleton-glass-card">
            <div className="skeleton-line skeleton"></div>
            <div
              className="skeleton-chart-area skeleton"
              style={{ marginTop: "16px", flex: 1 }}
            ></div>
          </div>
          <div className="skeleton-glass-card">
            <div className="skeleton-line skeleton"></div>
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  className="skeleton-block skeleton"
                  style={{ height: "40px", marginTop: "12px" }}
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
          <div className="skeleton-line skeleton" style={{ width: "10%" }}></div>
          <div className="skeleton-line skeleton" style={{ width: "20%" }}></div>
          <div className="skeleton-line skeleton" style={{ width: "25%" }}></div>
          <div className="skeleton-line skeleton" style={{ width: "20%" }}></div>
          <div className="skeleton-line skeleton" style={{ width: "15%" }}></div>
          <div className="skeleton-line skeleton" style={{ width: "10%" }}></div>
        </div>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div className="skeleton-table-row" key={i}>
              <div
                className="skeleton-line skeleton"
                style={{ width: "10%" }}
              ></div>
              <div
                className="skeleton-line skeleton"
                style={{ width: "20%" }}
              ></div>
              <div
                className="skeleton-line skeleton"
                style={{ width: "25%" }}
              ></div>
              <div
                className="skeleton-line skeleton"
                style={{ width: "20%" }}
              ></div>
              <div
                className="skeleton-line skeleton"
                style={{ width: "15%" }}
              ></div>
              <div
                className="skeleton-line skeleton"
                style={{ width: "10%" }}
              ></div>
            </div>
          ))}
      </div>
    );
  }

  if (type === "sales" || type === "blogs") {
    return (
      <>
        <div className="skeleton-controls" style={{ marginBottom: "24px" }}>
          <div
            className="skeleton-line skeleton"
            style={{ height: "38px", width: "200px" }}
          ></div>
          <div
            className="skeleton-line skeleton"
            style={{ height: "38px", width: "200px" }}
          ></div>
        </div>
        <div className="skeleton-table">
          <div className="skeleton-table-header">
            <div className="skeleton-line skeleton" style={{ width: "25%" }}></div>
            <div className="skeleton-line skeleton" style={{ width: "20%" }}></div>
            <div className="skeleton-line skeleton" style={{ width: "25%" }}></div>
            <div className="skeleton-line skeleton" style={{ width: "15%" }}></div>
            <div className="skeleton-line skeleton" style={{ width: "15%" }}></div>
          </div>
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div className="skeleton-table-row" key={i}>
                <div
                  className="skeleton-line skeleton"
                  style={{ width: "25%" }}
                ></div>
                <div
                  className="skeleton-line skeleton"
                  style={{ width: "20%" }}
                ></div>
                <div
                  className="skeleton-line skeleton"
                  style={{ width: "25%" }}
                ></div>
                <div
                  className="skeleton-line skeleton"
                  style={{ width: "15%" }}
                ></div>
                <div
                  className="skeleton-line skeleton"
                  style={{ width: "15%" }}
                ></div>
              </div>
            ))}
        </div>
      </>
    );
  }

  return null;
}
