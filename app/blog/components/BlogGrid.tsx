"use client";

import { useEffect, useState } from "react";
import type { BlogPost } from "../../lib/blog-types";
import BlogCard from "./BlogCard";
import { client } from "../../sanity/client";
import { POSTS_QUERY } from "../../sanity/queries";
import { blocksToMarkdown } from "../../sanity/blog-sync";

interface BlogGridProps {
  posts: BlogPost[];
  readText?: string;
  category?: string;
}

export default function BlogGrid({
  posts: initialPosts,
  readText,
  category,
}: BlogGridProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);

  useEffect(() => {
    let isMounted = true;

    async function revalidateFromSanity() {
      try {
        const sanityPosts = await client.fetch(POSTS_QUERY);
        if (Array.isArray(sanityPosts) && sanityPosts.length > 0 && isMounted) {
          const mapped: BlogPost[] = sanityPosts.map((sp: any) => ({
            id: sp._id,
            title: sp.title || "",
            slug: sp.slug,
            description: sp.description || "",
            category: sp.category || "Marketing",
            tags: sp.tags || [],
            featuredImage:
              sp.featuredImageUrl ||
              sp.featuredImage?.asset?.url ||
              (typeof sp.featuredImage === "string" ? sp.featuredImage : "") ||
              "",
            publishedDate: sp.publishedDate || "",
            updatedDate: sp.updatedDate || sp.publishedDate || "",
            status: sp.status || "Published",
            content: Array.isArray(sp.body)
              ? blocksToMarkdown(sp.body)
              : typeof sp.body === "string"
              ? sp.body
              : "",
            author: sp.author || "ReelScale Team",
            metaTitle: sp.metaTitle || sp.title || "",
            metaDescription: sp.metaDescription || sp.description || "",
            focusKeyword: sp.focusKeyword || "",
            canonicalUrl: sp.canonicalUrl || "",
            ogImage:
              sp.ogImageUrl ||
              sp.ogImage?.asset?.url ||
              (typeof sp.ogImage === "string" ? sp.ogImage : "") ||
              "",
            faq: Array.isArray(sp.faq) ? sp.faq : [],
          }));

          const filtered =
            category && category !== "all"
              ? mapped.filter(
                  (p) => p.category.toLowerCase() === category.toLowerCase()
                )
              : mapped;

          if (filtered.length > 0) {
            setPosts(filtered);
          }
        }
      } catch (err) {
        // Fallback silently to initial SSR / static posts
      }
    }

    revalidateFromSanity();

    return () => {
      isMounted = false;
    };
  }, [category]);

  return (
    <div className="blog-grid">
      {posts.map((post) => (
        <BlogCard key={post.id || post.slug} post={post} readText={readText} />
      ))}
    </div>
  );
}
