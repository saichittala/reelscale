import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedBlogs } from "../../../lib/blog";
import BlogLayout from "../../BlogLayout";
import BlogGrid from "../../components/BlogGrid";
import CategoryBar from "../../components/CategoryBar";

interface Props {
  params: Promise<{
    category: string;
  }>;
}

export async function generateStaticParams() {
  const publishedBlogs = getPublishedBlogs();
  const categories = Array.from(new Set(publishedBlogs.map((b) => b.category.toLowerCase())));
  return categories.map((cat) => ({
    category: cat,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const capitalized = category.charAt(0).toUpperCase() + category.slice(1);
  return {
    title: `${capitalized} Guides & Insights | ReelScale`,
    description: `Browse articles and guides relating to ${capitalized} from the Team ReelScale editors.`,
    alternates: {
      canonical: `https://reelscale.in/blog/category/${category}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const publishedBlogs = getPublishedBlogs();
  
  // Filter by category
  const filteredBlogs = publishedBlogs.filter(
    (b) => b.category.toLowerCase() === category.toLowerCase()
  );
  
  const allCategories = Array.from(new Set(publishedBlogs.map((b) => b.category)));
  const currentCategoryName = allCategories.find((c) => c.toLowerCase() === category.toLowerCase()) || category;

  return (
    <BlogLayout>
      <div className="blog-container">
        
        {/* Listing Hero */}
        <section className="blog-listing-hero">
          <div style={{ fontSize: "var(--text-sm)", color: "var(--gold)", fontWeight: "var(--fw-medium)", marginBottom: "8px" }}>
            category archive
          </div>
          <h1>{currentCategoryName}</h1>
          <p>
            Browse all our strategic guides, case studies, and insights focused on {currentCategoryName.toLowerCase()}.
          </p>
        </section>

        {/* Categories navigation bar */}
        {allCategories.length > 0 && (
          <CategoryBar categories={allCategories} activeCategory={category} />
        )}

        {/* Cards Grid */}
        {filteredBlogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--muted)" }}>
            <p style={{ fontSize: "18px", marginBottom: "16px" }}>No published articles found in this category.</p>
            <Link href="/blog" style={{ color: "var(--red)", textDecoration: "none", fontWeight: 600 }}>
              Return to blog index
            </Link>
          </div>
        ) : (
          <BlogGrid posts={filteredBlogs} />
        )}

      </div>
    </BlogLayout>
  );
}
