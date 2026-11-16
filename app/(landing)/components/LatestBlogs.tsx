import Link from "next/link";
import { getPublishedBlogsAsync } from "../../lib/blog";
import BlogGrid from "../../blog/components/BlogGrid";

export default async function LatestBlogs() {
  const published = await getPublishedBlogsAsync();
  const latestBlogs = published.slice(0, 3);

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

        {/* Live Blog Grid with Real-time Sanity Sync */}
        <div className="reveal">
          <BlogGrid posts={latestBlogs} limit={3} />
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
