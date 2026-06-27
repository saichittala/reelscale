import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedBlogs, getReadingTime } from "../lib/blog";
import BlogLayout from "./BlogLayout";

export const metadata: Metadata = {
  title: "Insights & Articles | ReelScale",
  description: "Learn how premium short-form cinematic video production can explode your brand and scale conversion rate.",
  alternates: {
    canonical: "https://reelscale.in/blog",
  },
};

export default function BlogIndexPage() {
  const publishedBlogs = getPublishedBlogs();
  const categories = Array.from(new Set(publishedBlogs.map((b) => b.category)));

  return (
    <BlogLayout>
      <div className="blog-container">
        
        {/* Listing Hero */}
        <section className="blog-listing-hero">
          <h1>ReelScale Insights</h1>
          <p>
            Actionable strategies, production breakdowns, and copywriting deep-dives to grow your organic brand footprint.
          </p>
        </section>

        {/* Categories navigation bar */}
        {categories.length > 0 && (
          <div className="blog-categories-bar">
            <Link href="/blog" className="blog-category-btn active">
              All
            </Link>
            {categories.map((cat) => (
              <Link 
                key={cat} 
                href={`/blog/category/${cat.toLowerCase()}`} 
                className="blog-category-btn"
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        {/* Cards Grid */}
        {publishedBlogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--muted)" }}>
            <p style={{ fontSize: "18px", marginBottom: "16px" }}>No published articles found.</p>
            <p style={{ fontSize: "14px" }}>Check back soon for new guides and breakdowns!</p>
          </div>
        ) : (
          <div className="blog-grid">
            {publishedBlogs.map((post) => {
              const readTime = getReadingTime(post.content);
              return (
                <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card">
                  <div className="blog-card-img-wrap">
                    <img 
                      src={post.featuredImage || "/assets/logo.png"} 
                      alt={post.title} 
                      className="blog-card-img"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="blog-card-content">
                    <div className="blog-card-meta">
                      <span className="blog-card-category">{post.category}</span>
                      <span>•</span>
                      <span>{post.publishedDate}</span>
                    </div>

                    <h2 className="blog-card-title">{post.title}</h2>
                    <p className="blog-card-desc">{post.description}</p>

                    <div className="blog-card-footer">
                      <span>{readTime}</span>
                      <span className="blog-read-more">
                        Read Guide 
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </BlogLayout>
  );
}
