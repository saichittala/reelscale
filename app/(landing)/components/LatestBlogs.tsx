import Link from "next/link";
import { getPublishedBlogs, getReadingTime } from "../../lib/blog";

export default function LatestBlogs() {
  const latestBlogs = getPublishedBlogs().slice(0, 3);

  if (latestBlogs.length === 0) {
    return null;
  }

  return (
    <section id="blog" className="section-padding" style={{ borderTop: "1px solid var(--border)", position: "relative" }}>
      <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <div className="section-eyebrow" style={{ display: "inline-block", textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--red)", fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}>
            Guides & Breakdowns
          </div>
          <h2 style={{ fontSize: "36px", fontWeight: 800, color: "var(--white)", letterSpacing: "-1px" }}>
            Latest From Our Blog
          </h2>
        </div>

        {/* Blog Grid */}
        <div className="blog-grid">
          {latestBlogs.map((post) => {
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

                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-desc">{post.description}</p>

                  <div className="blog-card-footer">
                    <span>{readTime}</span>
                    <span className="blog-read-more">
                      Read Article 
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

        {/* View All Button */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link href="/blog" className="btn btn-ghost" style={{ display: "inline-flex", padding: "12px 28px", border: "1px solid var(--border)", borderRadius: "8px", textDecoration: "none", color: "var(--white)", fontWeight: 600, transition: "border-color 0.2s" }}>
            View All Guides & Breakdowns
          </Link>
        </div>

      </div>
    </section>
  );
}
