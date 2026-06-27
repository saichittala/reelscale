import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedBlogs, getReadingTime } from "../../../lib/blog";
import BlogLayout from "../../BlogLayout";

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
          <div style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--gold)", fontWeight: 600, marginBottom: "8px" }}>
            Category Archive
          </div>
          <h1>{currentCategoryName}</h1>
          <p>
            Browse all our strategic guides, case studies, and insights focused on {currentCategoryName.toLowerCase()}.
          </p>
        </section>

        {/* Categories navigation bar */}
        {allCategories.length > 0 && (
          <div className="blog-categories-bar">
            <Link href="/blog" className="blog-category-btn">
              All
            </Link>
            {allCategories.map((cat) => (
              <Link 
                key={cat} 
                href={`/blog/category/${cat.toLowerCase()}`} 
                className={`blog-category-btn ${cat.toLowerCase() === category.toLowerCase() ? "active" : ""}`}
              >
                {cat}
              </Link>
            ))}
          </div>
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
          <div className="blog-grid">
            {filteredBlogs.map((post) => {
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

                    <h2 className="blog-card-title">{post.title}</h2>
                    <p className="blog-card-desc">{post.description}</p>

                    <div className="blog-card-footer">
                      <span>{readTime}</span>
                      <span className="blog-read-more">
                        Read Guide 
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
        )}

      </div>
    </BlogLayout>
  );
}
