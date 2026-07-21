import Link from "next/link";
import { getPublishedBlogs } from "../../lib/blog";
import BlogCard from "../../blog/components/BlogCard";

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
            Blogs
          </div>
          <h2 className="section-title">
            Latest from our blog
          </h2>
        </div>

        {/* Blog Grid */}
        <div className="blog-grid reveal">
          {latestBlogs.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        {/* View All Button */}
        <div style={{ textAlign: "center", marginTop: "40px" }} className="reveal">
          <Link href="/blog" className="btn-secondary" style={{ textDecoration: "none" }}>
            View all blogs
          </Link>
        </div>

      </div>
    </section>
  );
}
