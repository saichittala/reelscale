import { BlogPost } from "../../lib/blog";
import BlogCard from "./BlogCard";

interface BlogGridProps {
  posts: BlogPost[];
  readText?: string;
}

export default function BlogGrid({ posts, readText }: BlogGridProps) {
  return (
    <div className="blog-grid">
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} readText={readText} />
      ))}
    </div>
  );
}
