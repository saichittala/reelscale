import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { checkRole } from "../rbac";

export const dynamic = "force-dynamic";

const DB_PATH = join(process.cwd(), "content", "blogs.json");

function getBlogs() {
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

function saveBlogs(blogs: any[]) {
  writeFileSync(DB_PATH, JSON.stringify(blogs, null, 2), "utf8");
}

export async function GET() {
  try {
    const blogs = getBlogs();
    return NextResponse.json(blogs);
  } catch (error) {
    console.error("Blogs GET error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;
    const blogs = getBlogs();

    switch (action) {
      case "add": {
        const newBlog = {
          id: Date.now().toString(),
          title: data.title || "Untitled Blog",
          slug: data.slug || "",
          description: data.description || "",
          category: data.category || "General",
          tags: Array.isArray(data.tags) ? data.tags : [],
          featuredImage: data.featuredImage || "",
          publishedDate: data.publishedDate || new Date().toISOString().split('T')[0],
          updatedDate: new Date().toISOString().split('T')[0],
          status: data.status || "Draft",
          content: data.content || "",
          author: data.author || "Sai Chittala",
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
          focusKeyword: data.focusKeyword || "",
          canonicalUrl: data.canonicalUrl || "",
          ogImage: data.ogImage || "",
          faq: Array.isArray(data.faq) ? data.faq : [],
        };
        blogs.unshift(newBlog);
        saveBlogs(blogs);
        return NextResponse.json({ success: true, blog: newBlog });
      }
      case "update": {
        const idx = blogs.findIndex((b: { id: string }) => b.id === data.id);
        if (idx === -1) {
          return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });
        }
        blogs[idx] = {
          ...blogs[idx],
          title: data.title !== undefined ? data.title : blogs[idx].title,
          slug: data.slug !== undefined ? data.slug : blogs[idx].slug,
          description: data.description !== undefined ? data.description : blogs[idx].description,
          category: data.category !== undefined ? data.category : blogs[idx].category,
          tags: Array.isArray(data.tags) ? data.tags : blogs[idx].tags,
          featuredImage: data.featuredImage !== undefined ? data.featuredImage : blogs[idx].featuredImage,
          publishedDate: data.publishedDate !== undefined ? data.publishedDate : blogs[idx].publishedDate,
          updatedDate: new Date().toISOString().split('T')[0],
          status: data.status !== undefined ? data.status : blogs[idx].status,
          content: data.content !== undefined ? data.content : blogs[idx].content,
          author: data.author !== undefined ? data.author : blogs[idx].author,
          metaTitle: data.metaTitle !== undefined ? data.metaTitle : blogs[idx].metaTitle,
          metaDescription: data.metaDescription !== undefined ? data.metaDescription : blogs[idx].metaDescription,
          focusKeyword: data.focusKeyword !== undefined ? data.focusKeyword : blogs[idx].focusKeyword,
          canonicalUrl: data.canonicalUrl !== undefined ? data.canonicalUrl : blogs[idx].canonicalUrl,
          ogImage: data.ogImage !== undefined ? data.ogImage : blogs[idx].ogImage,
          faq: Array.isArray(data.faq) ? data.faq : blogs[idx].faq,
        };
        saveBlogs(blogs);
        return NextResponse.json({ success: true, blog: blogs[idx] });
      }
      case "delete": {
        const filtered = blogs.filter((b: { id: string }) => b.id !== data.id);
        saveBlogs(filtered);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Blogs API error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
