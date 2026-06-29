import React from "react";
import BlogLayout from "./BlogLayout";

export default function BlogLoading() {
  return (
    <BlogLayout>
      <div className="blog-container">
        {/* Listing Hero Skeleton */}
        <section className="blog-listing-hero">
          <div className="skeleton-title skeleton skeleton-title-listing"></div>
          <div className="skeleton-subtitle skeleton skeleton-subtitle-listing"></div>
        </section>

        {/* Categories Bar Skeleton */}
        <div className="blog-categories-bar">
          <div className="skeleton-btn skeleton skeleton-btn-w60"></div>
          <div className="skeleton-btn skeleton skeleton-btn-w90"></div>
          <div className="skeleton-btn skeleton skeleton-btn-w80"></div>
          <div className="skeleton-btn skeleton skeleton-btn-w100"></div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="blog-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="blog-card blog-card-loading">
              <div className="skeleton-card-img skeleton"></div>
              <div className="blog-card-content">
                <div className="blog-card-meta">
                  <div className="skeleton-card-line skeleton skeleton-card-meta-line1"></div>
                  <div className="skeleton-card-line skeleton skeleton-card-meta-line2"></div>
                </div>

                <div className="skeleton-card-line skeleton skeleton-card-title-line"></div>
                <div className="skeleton-card-line skeleton skeleton-card-body-line1"></div>
                <div className="skeleton-card-line skeleton skeleton-card-body-line2"></div>
                <div className="skeleton-card-line skeleton skeleton-card-body-line3"></div>

                <div className="blog-card-footer">
                  <div className="skeleton-card-line skeleton skeleton-card-footer-line"></div>
                  <div className="skeleton-card-line skeleton skeleton-card-footer-line"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BlogLayout>
  );
}
