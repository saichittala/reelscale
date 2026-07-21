import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedBlogs } from "../../../lib/blog";
import BlogLayout from "../../BlogLayout";
import BlogGrid from "../../components/BlogGrid";
import CategorySidebar from "../../components/CategorySidebar";

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
    title: `${capitalized} Blogs | ReelScale`,
    description: `Browse blog posts relating to ${capitalized} from the Team ReelScale editors.`,
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
          <h1>Category: <em>{currentCategoryName}</em></h1>
          <p>
            Browse all our blog posts and articles focused on {currentCategoryName.toLowerCase()}.
          </p>
        </section>

        {/* Wrangle Index Layout: Sidebar + Grid */}
        <div className="blog-index-layout">
          {allCategories.length > 0 && (
            <CategorySidebar categories={allCategories} activeCategory={category} />
          )}

          <main className="blog-index-main">
            {filteredBlogs.length === 0 ? (
              <div className="blog-no-posts">
                <p className="blog-no-posts-title">No published articles found in this category.</p>
                <Link href="/blog" className="blog-return-link">
                  Return to blog index
                </Link>
              </div>
            ) : (
              <BlogGrid posts={filteredBlogs} />
            )}
          </main>
        </div>

      </div>
    </BlogLayout>
  );
}
