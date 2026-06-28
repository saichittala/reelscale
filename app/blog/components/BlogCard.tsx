import Link from "next/link";
import { BlogPost, getReadingTime } from "../../lib/blog";

interface BlogCardProps {
  post: BlogPost;
  readText?: string;
}

export default function BlogCard({ post, readText = "Read Guide" }: BlogCardProps) {
  const readTime = getReadingTime(post.content);

  return (
    <Link href={`/blog/${post.slug}`} className="blog-card" style={{ textDecoration: "none" }}>
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
            {readText} 
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
