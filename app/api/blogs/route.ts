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

export const dynamic = "force-dynamic";

const DB_PATH = join(process.cwd(), "content", "blogs.json");

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
    // 1. Fetch directly from Sanity (both Published and Drafts so dashboard can manage both)
    const sanityQuery = `*[_type == "post"] | order(publishedDate desc, _createdAt desc) {
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

    switch (action) {
      case "add": {
        const title = data.title || "Untitled Blog";
        const slug = (data.slug || title)
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, "")
          .replace(/--+/g, "-")
          .replace(/^-+/, "")
          .replace(/-+$/, "");

        const newBlog: Blog = {
          id: data.id || slug || Date.now().toString(),
          title,
          slug,
          description: data.description || "",
          category: data.category || "General",
          tags: Array.isArray(data.tags) ? data.tags : [],
          featuredImage: data.featuredImage || "",
          publishedDate: data.publishedDate || new Date().toISOString().split("T")[0],
          updatedDate: new Date().toISOString().split("T")[0],
          status: data.status || "Draft",
          content: data.content || "",
          metaTitle: data.metaTitle || title,
          metaDescription: data.metaDescription || data.description || "",
          focusKeyword: data.focusKeyword || "",
          canonicalUrl: data.canonicalUrl || `https://reelscale.in/blog/${slug}`,
          ogImage: data.ogImage || data.featuredImage || "",
          faq: Array.isArray(data.faq) ? data.faq : [],
        };

        // 1. Sync to Sanity
        let syncedBlog = newBlog;
        try {
          syncedBlog = await syncBlogToSanity(newBlog);
        } catch (sanityErr) {
          console.error("Sanity sync error on add:", sanityErr);
        }

        // 2. Update local backup cache
        localBlogs.unshift(syncedBlog);
        saveLocalBlogs(localBlogs);

        return NextResponse.json({ success: true, blog: syncedBlog });
      }

      case "update": {
        const idx = localBlogs.findIndex(
          (b) => b.id === data.id || b.slug === data.slug
        );

        const updatedBlog: Blog = {
          ...(idx !== -1 ? localBlogs[idx] : {}),
          id: data.id || (idx !== -1 ? localBlogs[idx].id : Date.now().toString()),
          title: data.title !== undefined ? data.title : localBlogs[idx]?.title || "",
          slug: data.slug !== undefined ? data.slug : localBlogs[idx]?.slug || "",
          description: data.description !== undefined ? data.description : localBlogs[idx]?.description || "",
          category: data.category !== undefined ? data.category : localBlogs[idx]?.category || "General",
          tags: Array.isArray(data.tags) ? data.tags : localBlogs[idx]?.tags || [],
          featuredImage: data.featuredImage !== undefined ? data.featuredImage : localBlogs[idx]?.featuredImage || "",
          publishedDate: data.publishedDate !== undefined ? data.publishedDate : localBlogs[idx]?.publishedDate || new Date().toISOString().split("T")[0],
          updatedDate: new Date().toISOString().split("T")[0],
          status: data.status !== undefined ? data.status : localBlogs[idx]?.status || "Draft",
          content: data.content !== undefined ? data.content : localBlogs[idx]?.content || "",
          metaTitle: data.metaTitle !== undefined ? data.metaTitle : localBlogs[idx]?.metaTitle || "",
          metaDescription: data.metaDescription !== undefined ? data.metaDescription : localBlogs[idx]?.metaDescription || "",
          focusKeyword: data.focusKeyword !== undefined ? data.focusKeyword : localBlogs[idx]?.focusKeyword || "",
          canonicalUrl: data.canonicalUrl !== undefined ? data.canonicalUrl : localBlogs[idx]?.canonicalUrl || "",
          ogImage: data.ogImage !== undefined ? data.ogImage : localBlogs[idx]?.ogImage || "",
          faq: Array.isArray(data.faq) ? data.faq : localBlogs[idx]?.faq || [],
        };

        // 1. Sync to Sanity
        let syncedBlog = updatedBlog;
        try {
          syncedBlog = await syncBlogToSanity(updatedBlog);
        } catch (sanityErr) {
          console.error("Sanity sync error on update:", sanityErr);
        }

        // 2. Update local cache
        if (idx !== -1) {
          localBlogs[idx] = syncedBlog;
        } else {
          localBlogs.unshift(syncedBlog);
        }
        saveLocalBlogs(localBlogs);

        return NextResponse.json({ success: true, blog: syncedBlog });
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
