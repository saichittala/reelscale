import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { BlogFAQ, BlogPost } from "./blog-types";
import { getReadingTime, slugify, generateTableOfContents, parseMarkdown, HeadingItem } from "./blog-utils";

export type { BlogFAQ, BlogPost, HeadingItem };
export { getReadingTime, slugify, generateTableOfContents, parseMarkdown };

const DB_PATH = join(process.cwd(), "content", "blogs.json");
let cachedBlogs: BlogPost[] | null = null;

export function getBlogsFromDB(): BlogPost[] {
  if (cachedBlogs) {
    return cachedBlogs;
  }
  if (!existsSync(DB_PATH)) {
    return [];
  }
  try {
    const content = readFileSync(DB_PATH, "utf8");
    cachedBlogs = JSON.parse(content || "[]");
    return cachedBlogs || [];
  } catch (e) {
    console.error("Error reading blogs database:", e);
    return [];
  }
}

export function getPublishedBlogs(): BlogPost[] {
  return getBlogsFromDB().filter((b) => b.status === "Published");
}

export async function getPublishedBlogsAsync(): Promise<BlogPost[]> {
  try {
    const { client } = await import("../sanity/client");
    const { POSTS_QUERY } = await import("../sanity/queries");
    const { blocksToMarkdown } = await import("../sanity/blog-sync");
    const sanityPosts = await client.fetch(POSTS_QUERY);
    if (Array.isArray(sanityPosts) && sanityPosts.length > 0) {
      const localBlogs = getBlogsFromDB();
      const localMap = new Map(localBlogs.map((b) => [b.slug, b]));

      return sanityPosts.map((sp: any) => {
        const local = localMap.get(sp.slug);
        const sanityContent = Array.isArray(sp.body) ? blocksToMarkdown(sp.body) : (typeof sp.body === "string" ? sp.body : "");

        return {
          id: sp._id,
          title: sp.title || local?.title || "",
          slug: sp.slug,
          description: sp.description || local?.description || "",
          category: sp.category || local?.category || "Marketing",
          tags: sp.tags || local?.tags || [],
          featuredImage: sp.featuredImageUrl || sp.featuredImage?.asset?.url || (typeof sp.featuredImage === "string" ? sp.featuredImage : "") || local?.featuredImage || "",
          publishedDate: sp.publishedDate || local?.publishedDate || "",
          updatedDate: sp.updatedDate || sp.publishedDate || local?.updatedDate || "",
          status: sp.status || "Published",
          content: sanityContent || local?.content || "",
          author: sp.author || local?.author || "ReelScale Team",
          metaTitle: sp.metaTitle || local?.metaTitle || sp.title,
          metaDescription: sp.metaDescription || local?.metaDescription || sp.description || "",
          focusKeyword: sp.focusKeyword || local?.focusKeyword || "",
          canonicalUrl: sp.canonicalUrl || local?.canonicalUrl || "",
          ogImage: sp.ogImageUrl || sp.ogImage?.asset?.url || (typeof sp.ogImage === "string" ? sp.ogImage : "") || local?.ogImage || "",
          faq: Array.isArray(sp.faq) && sp.faq.length > 0 ? sp.faq : (local?.faq || []),
        };
      });
    }
  } catch {
    // Fallback smoothly to local database if Sanity dataset is empty or offline
  }
  return getPublishedBlogs();
}

export function getRelatedPosts(currentPost: BlogPost, count = 3): BlogPost[] {
  const allPosts = getPublishedBlogs();
  return allPosts
    .filter((p) => p.slug !== currentPost.slug)
    .map((post) => {
      let score = 0;
      if (post.category === currentPost.category) score += 3;
      const commonTags = post.tags.filter((t) => currentPost.tags.includes(t));
      score += commonTags.length * 2;
      return { post, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.post);
}
