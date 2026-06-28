import Link from "next/link";

interface CategoryBarProps {
  categories: string[];
  activeCategory?: string;
}

export default function CategoryBar({ categories, activeCategory }: CategoryBarProps) {
  const activeLower = activeCategory?.toLowerCase();

  return (
    <div className="blog-categories-bar">
      <Link 
        href="/blog" 
        className={`blog-category-btn ${!activeLower || activeLower === "all" ? "active" : ""}`}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link 
          key={cat} 
          href={`/blog/category/${cat.toLowerCase()}`} 
          className={`blog-category-btn ${activeLower === cat.toLowerCase() ? "active" : ""}`}
        >
          {cat}
        </Link>
      ))}
    </div>
  );
}
