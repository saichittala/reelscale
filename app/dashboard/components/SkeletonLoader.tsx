
interface SkeletonLoaderProps {
  type: "dashboard" | "clients" | "analytics" | "users" | "sales" | "blogs" | "ai-settings" | "ai-blog-settings" | "ai-writing";
}

export function SkeletonLoader({ type }: SkeletonLoaderProps) {
  if (type === "dashboard" || type === "analytics") {
    return (
      <>
        <div className="skeleton-stat-grid">
          {Array(6)
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
        <div className="skeleton-grid-2">
          <div className="skeleton-glass-card">
            <div className="skeleton-line skeleton"></div>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  className="skeleton-block skeleton skeleton-h-var mt-12"
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

  if (type === "ai-settings" || type === "ai-blog-settings") {
    return (
      <div className="ai-view-container ai-settings-container">
        {/* Master Header Card Skeleton */}
        <div className="glass-card ai-header-card">
          <div className="ai-header-content">
            <div className="ai-title-group">
              <div
                className="skeleton"
                style={{ width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 }}
              />
              <div
                className="skeleton skeleton-line skeleton-w-var skeleton-h-var"
                style={{ "--w": "220px", "--h": "20px" } as any}
              />
              <div
                className="skeleton skeleton-w-var skeleton-h-var"
                style={{ "--w": "65px", "--h": "22px", borderRadius: "99px" } as any}
              />
              <div
                className="skeleton skeleton-w-var skeleton-h-var"
                style={{ "--w": "115px", "--h": "32px", borderRadius: "8px" } as any}
              />
            </div>
            <div className="df-g8 al-c">
              <div
                className="skeleton skeleton-w-var skeleton-h-var"
                style={{ "--w": "340px", "--h": "38px", borderRadius: "99px" } as any}
              />
            </div>
          </div>
        </div>

        {/* Tab Content Skeleton (gap 16px via .ai-view-container) */}
        <div className="ai-view-container">
          {/* Card 1: Cadence */}
          <div className="glass-card ai-settings-card-compact">
            <div className="ai-cadence-header">
              <div>
                <div
                  className="skeleton skeleton-line skeleton-w-var skeleton-h-var"
                  style={{ "--w": "170px", "--h": "18px" } as any}
                />
              </div>
              <div>
                <div
                  className="skeleton skeleton-w-var skeleton-h-var"
                  style={{ "--w": "380px", "--h": "36px", borderRadius: "99px" } as any}
                />
              </div>
            </div>

            <div className="ai-timing-grid">
              <div>
                <div
                  className="skeleton skeleton-line skeleton-w-var skeleton-h-var mb-8"
                  style={{ "--w": "180px", "--h": "13px" } as any}
                />
                <div
                  className="skeleton skeleton-w-var skeleton-h-var"
                  style={{ "--w": "100%", "--h": "36px", borderRadius: "8px" } as any}
                />
              </div>
              <div>
                <div
                  className="skeleton skeleton-line skeleton-w-var skeleton-h-var mb-8"
                  style={{ "--w": "150px", "--h": "13px" } as any}
                />
                <div
                  className="skeleton skeleton-w-var skeleton-h-var"
                  style={{ "--w": "100%", "--h": "38px", borderRadius: "8px" } as any}
                />
                <div
                  className="skeleton skeleton-line skeleton-w-var skeleton-h-var mt-4"
                  style={{ "--w": "210px", "--h": "10px" } as any}
                />
              </div>
              <div>
                <div
                  className="skeleton skeleton-line skeleton-w-var skeleton-h-var mb-8"
                  style={{ "--w": "150px", "--h": "13px" } as any}
                />
                <div
                  className="skeleton skeleton-w-var skeleton-h-var"
                  style={{ "--w": "100%", "--h": "38px", borderRadius: "8px" } as any}
                />
                <div
                  className="skeleton skeleton-line skeleton-w-var skeleton-h-var mt-4"
                  style={{ "--w": "190px", "--h": "10px" } as any}
                />
              </div>
            </div>
          </div>

          {/* Card 2: AI Engine & Publishing Rule (2 Side-by-Side Cards, gap 16px via .ai-cards-grid) */}
          <div className="ai-cards-grid">
            {/* Primary Model */}
            <div className="glass-card ai-sub-card">
              <div className="ai-sub-card-header">
                <div
                  className="skeleton skeleton-w-var skeleton-h-var"
                  style={{ "--w": "16px", "--h": "16px", borderRadius: "4px" } as any}
                />
                <div
                  className="skeleton skeleton-line skeleton-w-var skeleton-h-var"
                  style={{ "--w": "140px", "--h": "15px" } as any}
                />
              </div>
              <div
                className="skeleton skeleton-w-var skeleton-h-var mb-10"
                style={{ "--w": "100%", "--h": "40px", borderRadius: "8px" } as any}
              />
              <div
                className="skeleton skeleton-line skeleton-w-var skeleton-h-var mb-4"
                style={{ "--w": "95%", "--h": "11px" } as any}
              />
              <div
                className="skeleton skeleton-line skeleton-w-var skeleton-h-var"
                style={{ "--w": "70%", "--h": "11px" } as any}
              />
            </div>

            {/* Auto-Publish */}
            <div className="glass-card ai-sub-card">
              <div className="ai-publish-toggle-row">
                <div className="df-g8 al-c">
                  <div
                    className="skeleton skeleton-w-var skeleton-h-var"
                    style={{ "--w": "16px", "--h": "16px", borderRadius: "4px" } as any}
                  />
                  <div
                    className="skeleton skeleton-line skeleton-w-var skeleton-h-var"
                    style={{ "--w": "180px", "--h": "15px" } as any}
                  />
                </div>
                <div
                  className="skeleton skeleton-w-var skeleton-h-var"
                  style={{ "--w": "20px", "--h": "20px", borderRadius: "4px" } as any}
                />
              </div>
              <div
                className="skeleton skeleton-line skeleton-w-var skeleton-h-var mb-6"
                style={{ "--w": "85%", "--h": "12px" } as any}
              />
              <div
                className="skeleton skeleton-line skeleton-w-var skeleton-h-var"
                style={{ "--w": "92%", "--h": "11px" } as any}
              />
            </div>
          </div>

          {/* Card 3: Output Projections */}
          <div className="glass-card ai-settings-card-compact">
            <div className="ai-projections-summary-header">
              <div>
                <div
                  className="skeleton skeleton-line skeleton-w-var skeleton-h-var"
                  style={{ "--w": "200px", "--h": "15px" } as any}
                />
                <div
                  className="skeleton skeleton-line skeleton-w-var skeleton-h-var mt-4"
                  style={{ "--w": "280px", "--h": "11px" } as any}
                />
              </div>
              <div
                className="skeleton skeleton-w-var skeleton-h-var"
                style={{ "--w": "160px", "--h": "28px", borderRadius: "6px" } as any}
              />
            </div>

            <div className="ai-projections-strip">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="ai-projection-card">
                  <div
                    className="skeleton skeleton-line skeleton-w-var skeleton-h-var"
                    style={{ "--w": "70px", "--h": "11px" } as any}
                  />
                  <div
                    className="skeleton skeleton-line skeleton-w-var skeleton-h-var mt-8"
                    style={{ "--w": "85px", "--h": "22px" } as any}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "ai-writing") {
    return (
      <div className="ai-view-container">
        <div className="stat-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="stat-card">
              <div
                className="skeleton skeleton-line skeleton-w-var skeleton-h-var"
                style={{ "--w": "110px", "--h": "12px" } as any}
              />
              <div
                className="skeleton skeleton-line skeleton-w-var skeleton-h-var mt-8"
                style={{ "--w": "65px", "--h": "24px" } as any}
              />
            </div>
          ))}
        </div>
        <div className="glass-card ai-header-card">
          <div className="ai-header-content">
            <div
              className="skeleton skeleton-line skeleton-w-var skeleton-h-var"
              style={{ "--w": "240px", "--h": "24px" } as any}
            />
            <div
              className="skeleton skeleton-w-var skeleton-h-var"
              style={{ "--w": "360px", "--h": "38px", borderRadius: "99px" } as any}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
