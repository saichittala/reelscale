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
  limit?: number;
  skipLiveSync?: boolean;
}

export default function BlogGrid({
  posts: initialPosts,
  readText,
  category,
  limit,
  skipLiveSync,
}: BlogGridProps) {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    return limit ? initialPosts.slice(0, limit) : initialPosts;
  });

  useEffect(() => {
    if (skipLiveSync) return;
    let isMounted = true;

    async function revalidateFromSanity() {
      try {
        const sanityPosts = await client.fetch(
          POSTS_QUERY,
          {},
          { cache: "no-store" }
        );

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

          const finalList = limit ? filtered.slice(0, limit) : filtered;

          if (finalList.length > 0 && isMounted) {
            setPosts(finalList);
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
  }, [category, limit]);

  return (
    <div className="blog-grid">
      {posts.map((post) => (
        <BlogCard key={post.id || post.slug} post={post} readText={readText} />
      ))}
    </div>
  );
}
