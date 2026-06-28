import type { Metadata } from "next";
import { getPublishedBlogs } from "../lib/blog";
import BlogLayout from "./BlogLayout";
import BlogGrid from "./components/BlogGrid";
import CategoryBar from "./components/CategoryBar";

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
          <CategoryBar categories={categories} activeCategory="all" />
        )}

        {/* Cards Grid */}
        {publishedBlogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--muted)" }}>
            <p style={{ fontSize: "18px", marginBottom: "16px" }}>No published articles found.</p>
            <p style={{ fontSize: "14px" }}>Check back soon for new guides and breakdowns!</p>
          </div>
        ) : (
          <BlogGrid posts={publishedBlogs} />
        )}

      </div>
    </BlogLayout>
  );
}
