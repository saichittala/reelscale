import Link from "next/link";
import type { BlogPost } from "../../lib/blog-types";
import { getReadingTime } from "../../lib/blog-utils";

interface BlogCardProps {
  post: BlogPost;
  readText?: string;
}

export default function BlogCard({ post }: BlogCardProps) {
  const readTime = getReadingTime(post.content);

  return (
    <Link href={`/blog/${post.slug}`} className="blog-card">
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
          <span>{post.publishedDate}</span>
          <span>•</span>
          <span>{readTime}</span>
        </div>

        <h3 className="blog-card-title">{post.title}</h3>
      </div>
    </Link>
  );
}
