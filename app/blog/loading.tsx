import React from "react";
import BlogLayout from "./BlogLayout";

export default function BlogLoading() {
  return (
    <BlogLayout>
      <div className="blog-container">
        {/* Listing Hero Skeleton */}
        <section className="blog-listing-hero" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="skeleton-title skeleton" style={{ height: "40px", marginBottom: "16px", borderRadius: "8px" }}></div>
          <div className="skeleton-subtitle skeleton" style={{ height: "20px", width: "50%", margin: "0 auto", borderRadius: "6px" }}></div>
        </section>

        {/* Categories Bar Skeleton */}
        <div className="blog-categories-bar" style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "48px" }}>
          <div className="skeleton-btn skeleton" style={{ width: "60px" }}></div>
          <div className="skeleton-btn skeleton" style={{ width: "90px" }}></div>
          <div className="skeleton-btn skeleton" style={{ width: "80px" }}></div>
          <div className="skeleton-btn skeleton" style={{ width: "100px" }}></div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="blog-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="blog-card" style={{ pointerEvents: "none" }}>
              <div className="skeleton-card-img skeleton"></div>
              <div className="blog-card-content">
                <div className="blog-card-meta" style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                  <div className="skeleton-card-line skeleton" style={{ width: "30%", height: "12px", marginBottom: 0 }}></div>
                  <div className="skeleton-card-line skeleton" style={{ width: "40%", height: "12px", marginBottom: 0 }}></div>
                </div>

                <div className="skeleton-card-line skeleton" style={{ height: "20px", width: "90%", marginBottom: "16px" }}></div>
                <div className="skeleton-card-line skeleton" style={{ height: "14px", width: "100%", marginBottom: "8px" }}></div>
                <div className="skeleton-card-line skeleton" style={{ height: "14px", width: "95%", marginBottom: "8px" }}></div>
                <div className="skeleton-card-line skeleton" style={{ height: "14px", width: "60%", marginBottom: "20px" }}></div>

                <div className="blog-card-footer" style={{ borderTop: "1px solid var(--white-03)", paddingTop: "16px", display: "flex", justifyContent: "space-between" }}>
                  <div className="skeleton-card-line skeleton" style={{ width: "25%", height: "12px", marginBottom: 0 }}></div>
                  <div className="skeleton-card-line skeleton" style={{ width: "25%", height: "12px", marginBottom: 0 }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BlogLayout>
  );
}
