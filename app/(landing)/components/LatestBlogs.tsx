import Link from "next/link";
import { getPublishedBlogs } from "../../lib/blog";
import BlogGrid from "../../blog/components/BlogGrid";

export default function LatestBlogs({ posts }: { posts?: any[] }) {
  const latestBlogs =
    Array.isArray(posts) && posts.length > 0
      ? posts.slice(0, 3)
      : getPublishedBlogs().slice(0, 3);

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

        {/* Blog Grid using single-query data with no redundant client API calls */}
        <div className="reveal">
          <BlogGrid posts={latestBlogs} limit={3} skipLiveSync={true} />
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
