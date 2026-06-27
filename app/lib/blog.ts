import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface BlogFAQ {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  featuredImage: string;
  publishedDate: string;
  updatedDate: string;
  status: "Draft" | "Published";
  content: string;
  author: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogImage: string;
  faq: BlogFAQ[];
}

const DB_PATH = join(process.cwd(), "content", "blogs.json");

export function getBlogsFromDB(): BlogPost[] {
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

export function getPublishedBlogs(): BlogPost[] {
  return getBlogsFromDB().filter((b) => b.status === "Published");
}

export function getReadingTime(text: string): string {
  const wordsPerMinute = 200;
  const noOfWords = text.split(/\s+/).length;
  const minutes = Math.ceil(noOfWords / wordsPerMinute);
  return `${minutes} min read`;
}

export function getRelatedPosts(currentPost: BlogPost, count = 3): BlogPost[] {
  const allPosts = getPublishedBlogs().filter((p) => p.id !== currentPost.id);
  
  // Score posts based on category match and tag overlap
  const scored = allPosts.map((post) => {
    let score = 0;
    if (post.category.toLowerCase() === currentPost.category.toLowerCase()) {
      score += 5;
    }
    const overlap = post.tags.filter((t) => currentPost.tags.includes(t)).length;
    score += overlap * 2;
    return { post, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.post);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
}

export interface HeadingItem {
  text: string;
  id: string;
  level: number;
}

export function generateTableOfContents(markdown: string): HeadingItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: HeadingItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[#*`_\[\]]/g, "").trim();
    const id = slugify(text);
    headings.push({ text, id, level });
  }

  return headings;
}

export function parseMarkdown(markdown: string): string {
  if (!markdown) return "";
  
  let html = markdown;

  // Escape HTML entities to prevent raw HTML injections
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 1. Blockquotes
  html = html.replace(/^\s*>\s+(.+)$/gm, "<blockquote>$1</blockquote>");

  // 2. Headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6 id="$1">$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 id="$1">$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 id="$1">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 id="$1">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 id="$1">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 id="$1">$1</h1>');

  // Slugify IDs inside headings
  html = html.replace(/<(h[1-6]) id="([^"]+)">/g, (match, tag, text) => {
    const cleanText = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    return `<${tag} id="${slugify(cleanText)}">`;
  });

  // 3. Bold, Italic, Underline
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<u>$1</u>");

  // 4. Code Blocks
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  html = html.replace(/`(.*?)`/g, "<code>$1</code>");

  // 5. Images with Alt text
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" loading="lazy" class="blog-body-img">');

  // 6. Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // 7. Unordered Lists
  html = html.replace(/^\s*[\-\*]\s+(.+)$/gm, "<li>$1</li>");
  // Wrap sequential <li> blocks with <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");
  // Clean up nested list tags
  html = html.replace(/<\/ul>\s*<ul>/g, "");

  // 8. Callouts / Alert Panels (Custom Extension: e.g. [INFO] or [TIP])
  html = html.replace(/\[INFO\]\s*(.+)$/gm, '<div class="blog-callout info">$1</div>');
  html = html.replace(/\[WARNING\]\s*(.+)$/gm, '<div class="blog-callout warning">$1</div>');

  // 9. Line breaks to paragraphs (excluding blocks that are already wrapped)
  const lines = html.split("\n");
  const parsedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "<br/>";
    if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<li") || trimmed.startsWith("<blockquote") || trimmed.startsWith("<pre") || trimmed.startsWith("<div") || trimmed.startsWith("</")) {
      return line;
    }
    return `<p>${line}</p>`;
  });
  html = parsedLines.join("\n");

  return html;
}
