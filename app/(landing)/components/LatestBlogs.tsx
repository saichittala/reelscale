import Link from "next/link";
import { getPublishedBlogs, getReadingTime } from "../../lib/blog";

export default function LatestBlogs() {
  const latestBlogs = getPublishedBlogs().slice(0, 3);

  if (latestBlogs.length === 0) {
    return null;
  }

  return (
    <section id="latest-blogs-section">
      <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "50px" }} className="reveal">
          <div className="section-eyebrow" style={{ textTransform: "uppercase" }}>
            Guides & breakdowns
          </div>
          <h2 className="section-title">
            Latest from our blog
          </h2>
        </div>

        {/* Blog Grid */}
        <div className="blog-grid reveal">
          {latestBlogs.map((post) => {
            const readTime = getReadingTime(post.content);
            return (
              <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card" style={{ textDecoration: "none" }}>
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
                      Read article
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
        <div style={{ textAlign: "center", marginTop: "40px" }} className="reveal">
          <Link href="/blog" className="btn-secondary" style={{ textDecoration: "none" }}>
            View all guides & breakdowns
          </Link>
        </div>

      </div>
    </section>
  );
}
