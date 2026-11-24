import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { checkRole } from "../rbac";
import { client } from "../../sanity/client";
import {
  sanityDocToBlog,
  syncBlogToSanity,
  deleteBlogFromSanity,
} from "../../sanity/blog-sync";
import { Blog } from "../../dashboard/types";
import { redisGet, redisSet, redisInvalidatePattern } from "../../lib/redis";
import { validateArticleContent } from "../../lib/editorial/validation-pipeline";

export const dynamic = "force-dynamic";

const DB_PATH = join(process.cwd(), "content", "blogs.json");
const SANITY_BLOGS_CACHE_KEY = "sanity:blogs:list";
const BLOGS_CACHE_TTL = 3600; // 1 hour cache

function getLocalBlogs(): Blog[] {
  if (!existsSync(DB_PATH)) {
    return [];
  }
  try {
    const content = readFileSync(DB_PATH, "utf8");
    return JSON.parse(content || "[]");
  } catch (e) {
    console.error("Error reading blogs database:", e);
    return [];
  }
}

function saveLocalBlogs(blogs: Blog[]) {
  try {
    writeFileSync(DB_PATH, JSON.stringify(blogs, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving local blogs cache:", e);
  }
}

export async function GET() {
  try {
    // 0. Fast-path: Check Redis cache first
    const cachedBlogs = await redisGet<Blog[]>(SANITY_BLOGS_CACHE_KEY);
    if (Array.isArray(cachedBlogs) && cachedBlogs.length > 0) {
      return NextResponse.json(cachedBlogs);
    }

    // 1. Fetch directly from Sanity (both Published and Drafts so dashboard can manage both)
    const sanityQuery = `*[_type == "post"] | order(publishedDate desc, updatedDate desc, _updatedAt desc, _createdAt desc) {
      _id,
      title,
      slug,
      description,
      category,
      tags,
      featuredImage,
      "featuredImageUrl": featuredImage.asset->url,
      publishedDate,
      updatedDate,
      status,
      author,
      body,
      faq,
      metaTitle,
      metaDescription,
      focusKeyword,
      canonicalUrl,
      ogImage,
      "ogImageUrl": ogImage.asset->url
    }`;

    const sanityPosts = await client.fetch(sanityQuery);

    if (Array.isArray(sanityPosts) && sanityPosts.length > 0) {
      const blogs: Blog[] = sanityPosts.map(sanityDocToBlog);

      // Async cache in Redis with TTL
      redisSet(SANITY_BLOGS_CACHE_KEY, blogs, BLOGS_CACHE_TTL).catch(() => {});

      // Async update local backup cache
      try {
        saveLocalBlogs(blogs);
      } catch {
        // Non-blocking
      }

      return NextResponse.json(blogs);
    }
  } catch (error) {
    console.warn("Sanity GET failed, falling back to local database:", error);
  }

  // Fallback to local blogs.json
  const localBlogs = getLocalBlogs();
  return NextResponse.json(localBlogs);
}

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;
    const localBlogs = getLocalBlogs();

    // Invalidate Sanity blogs cache on mutations
    await redisInvalidatePattern("sanity:blogs:*");

    switch (action) {
      case "validate": {
        const validation = await validateArticleContent({
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          content: data.content || "",
          category: data.category || "General",
          focusKeyword: data.focusKeyword || "",
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
          canonicalUrl: data.canonicalUrl || "",
          featuredImage: data.featuredImage || "",
          altText: data.altText || data.title || "",
          faq: Array.isArray(data.faq) ? data.faq : [],
        });
        return NextResponse.json({ success: true, validation });
      }

      case "add": {
        const title = (data.title || "").trim();
        if (!title) {
          return NextResponse.json({ success: false, message: "Blog title is required" }, { status: 400 });
        }

        const slug = (data.slug || title)
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, "")
          .replace(/--+/g, "-")
          .replace(/^-+/, "")
          .replace(/-+$/, "");

        if (!slug) {
          return NextResponse.json({ success: false, message: "Valid blog slug is required" }, { status: 400 });
        }

        if (data.status === "Published" && (!data.content || data.content.trim().length < 50)) {
          return NextResponse.json(
            { success: false, message: "Cannot publish: blog content must contain at least 50 words" },
            { status: 400 }
          );
        }

        const today = new Date().toISOString().split("T")[0];
        const newBlog: Blog = {
          id: data.id || slug || Date.now().toString(),
          title,
          slug,
          description: data.description || "",
          category: data.category || "General",
          tags: Array.isArray(data.tags) ? data.tags : [],
          featuredImage: data.featuredImage || "",
          publishedDate: data.publishedDate || today,
          updatedDate: today,
          status: data.status || "Draft",
          content: data.content || "",
          metaTitle: data.metaTitle || title,
          metaDescription: data.metaDescription || data.description || "",
          focusKeyword: data.focusKeyword || "",
          canonicalUrl: data.canonicalUrl || `https://reelscale.in/blog/${slug}`,
          ogImage: data.ogImage || data.featuredImage || "",
          faq: Array.isArray(data.faq) ? data.faq : [],
        };

        // 1. Run full 15-point editorial validation
        let validation = null;
        try {
          validation = await validateArticleContent({
            title: newBlog.title,
            slug: newBlog.slug,
            description: newBlog.description,
            content: newBlog.content,
            category: newBlog.category,
            focusKeyword: newBlog.focusKeyword,
            metaTitle: newBlog.metaTitle,
            metaDescription: newBlog.metaDescription,
            canonicalUrl: newBlog.canonicalUrl,
            featuredImage: newBlog.featuredImage,
            altText: data.altText || newBlog.title,
            faq: newBlog.faq,
          });
        } catch (valErr) {
          console.warn("Validation execution notice:", valErr);
        }

        // 2. Sync to Sanity
        let syncedBlog = newBlog;
        try {
          syncedBlog = await syncBlogToSanity(newBlog);
        } catch (sanityErr) {
          console.error("Sanity sync error on add:", sanityErr);
        }

        // 3. Update local backup cache - ALWAYS prepend recently added blog to the very top
        const filteredLocal = localBlogs.filter((b) => b.id !== syncedBlog.id && b.slug !== syncedBlog.slug);
        filteredLocal.unshift(syncedBlog);
        saveLocalBlogs(filteredLocal);

        return NextResponse.json({ success: true, blog: syncedBlog, validation });
      }

      case "update": {
        const title = (data.title !== undefined ? data.title : "").trim();
        if (data.title !== undefined && !title) {
          return NextResponse.json({ success: false, message: "Blog title cannot be empty" }, { status: 400 });
        }

        const idx = localBlogs.findIndex(
          (b) => b.id === data.id || b.slug === data.slug
        );

        const today = new Date().toISOString().split("T")[0];
        const updatedBlog: Blog = {
          ...(idx !== -1 ? localBlogs[idx] : {}),
          id: data.id || (idx !== -1 ? localBlogs[idx].id : Date.now().toString()),
          title: data.title !== undefined ? data.title : localBlogs[idx]?.title || "",
          slug: data.slug !== undefined ? data.slug : localBlogs[idx]?.slug || "",
          description: data.description !== undefined ? data.description : localBlogs[idx]?.description || "",
          category: data.category !== undefined ? data.category : localBlogs[idx]?.category || "General",
          tags: Array.isArray(data.tags) ? data.tags : localBlogs[idx]?.tags || [],
          featuredImage: data.featuredImage !== undefined ? data.featuredImage : localBlogs[idx]?.featuredImage || "",
          publishedDate: data.publishedDate !== undefined ? data.publishedDate : localBlogs[idx]?.publishedDate || today,
          updatedDate: today,
          status: data.status !== undefined ? data.status : localBlogs[idx]?.status || "Draft",
          content: data.content !== undefined ? data.content : localBlogs[idx]?.content || "",
          metaTitle: data.metaTitle !== undefined ? data.metaTitle : localBlogs[idx]?.metaTitle || "",
          metaDescription: data.metaDescription !== undefined ? data.metaDescription : localBlogs[idx]?.metaDescription || "",
          focusKeyword: data.focusKeyword !== undefined ? data.focusKeyword : localBlogs[idx]?.focusKeyword || "",
          canonicalUrl: data.canonicalUrl !== undefined ? data.canonicalUrl : localBlogs[idx]?.canonicalUrl || "",
          ogImage: data.ogImage !== undefined ? data.ogImage : localBlogs[idx]?.ogImage || "",
          faq: Array.isArray(data.faq) ? data.faq : localBlogs[idx]?.faq || [],
        };

        if (updatedBlog.status === "Published" && (!updatedBlog.content || updatedBlog.content.trim().length < 50)) {
          return NextResponse.json(
            { success: false, message: "Cannot publish: blog content must contain at least 50 words" },
            { status: 400 }
          );
        }

        // 1. Run full 15-point editorial validation
        let validation = null;
        try {
          validation = await validateArticleContent({
            title: updatedBlog.title,
            slug: updatedBlog.slug,
            description: updatedBlog.description,
            content: updatedBlog.content,
            category: updatedBlog.category,
            focusKeyword: updatedBlog.focusKeyword,
            metaTitle: updatedBlog.metaTitle,
            metaDescription: updatedBlog.metaDescription,
            canonicalUrl: updatedBlog.canonicalUrl,
            featuredImage: updatedBlog.featuredImage,
            altText: data.altText || updatedBlog.title,
            faq: updatedBlog.faq,
          });
        } catch (valErr) {
          console.warn("Validation execution notice:", valErr);
        }

        // 2. Sync to Sanity
        let syncedBlog = updatedBlog;
        try {
          syncedBlog = await syncBlogToSanity(updatedBlog);
        } catch (sanityErr) {
          console.error("Sanity sync error on update:", sanityErr);
        }

        // 3. Update local cache - ALWAYS prepend recently updated/published blog to the top
        const filteredLocal = localBlogs.filter((b) => b.id !== syncedBlog.id && b.slug !== syncedBlog.slug);
        filteredLocal.unshift(syncedBlog);
        saveLocalBlogs(filteredLocal);

        return NextResponse.json({ success: true, blog: syncedBlog, validation });
      }

      case "delete": {
        const idToDelete = data.id;

        // 1. Delete from Sanity
        try {
          await deleteBlogFromSanity(idToDelete);
        } catch (sanityErr) {
          console.error("Sanity delete error:", sanityErr);
        }

        // 2. Remove from local cache
        const filtered = localBlogs.filter(
          (b) => b.id !== idToDelete && b.slug !== idToDelete
        );
        saveLocalBlogs(filtered);

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Blogs API error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
