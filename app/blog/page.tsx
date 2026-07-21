import type { Metadata } from "next";
import { getPublishedBlogs } from "../lib/blog";
import BlogLayout from "./BlogLayout";
import BlogGrid from "./components/BlogGrid";
import CategorySidebar from "./components/CategorySidebar";

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
          <h1>ReelScale <em>Insights</em></h1>
          <p>
            Actionable strategies, production breakdowns, and copywriting deep-dives to grow your organic brand footprint.
          </p>
        </section>

        {/* Wrangle Index Layout: Sidebar + Grid */}
        <div className="blog-index-layout">
          {categories.length > 0 && (
            <CategorySidebar categories={categories} activeCategory="all" />
          )}

          <main className="blog-index-main">
            {publishedBlogs.length === 0 ? (
              <div className="blog-no-posts">
                <p className="blog-no-posts-title">No published articles found.</p>
                <p className="blog-no-posts-subtitle">Check back soon for new blog posts!</p>
              </div>
            ) : (
              <BlogGrid posts={publishedBlogs} />
            )}
          </main>
        </div>

      </div>
    </BlogLayout>
  );
}
