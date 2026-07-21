import Link from "next/link";

interface CategorySidebarProps {
  categories: string[];
  activeCategory?: string;
}

export default function CategorySidebar({ categories, activeCategory }: CategorySidebarProps) {
  const activeLower = activeCategory?.toLowerCase() || "all";

  return (
    <aside className="blog-sidebar-nav">
      <div className="blog-sidebar-title">Categories</div>
      <ul className="blog-sidebar-list">
        <li>
          <Link 
            href="/blog" 
            className={`blog-sidebar-link ${activeLower === "all" ? "active" : ""}`}
          >
            <span className="blog-sidebar-indicator"></span>
            All Posts
          </Link>
        </li>
        {categories.map((cat) => {
          const catLower = cat.toLowerCase();
          const isActive = activeLower === catLower;
          return (
            <li key={cat}>
              <Link 
                href={`/blog/category/${catLower}`} 
                className={`blog-sidebar-link ${isActive ? "active" : ""}`}
              >
                <span className="blog-sidebar-indicator"></span>
                {cat}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
