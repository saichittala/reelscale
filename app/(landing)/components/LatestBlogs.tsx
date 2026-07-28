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
      <div className="container landing-blogs-container">

        {/* Section Header */}
        <div className="landing-blogs-header reveal">
          <div className="section-eyebrow">
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
        <div className="landing-blogs-footer reveal">
          <Link href="/blog" className="btn-secondary">
            View all blogs
          </Link>
        </div>

      </div>
    </section>
  );
}
