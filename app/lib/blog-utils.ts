export function getReadingTime(text: string): string {
  if (!text) return "1 min read";
  const wordsPerMinute = 200;
  const noOfWords = text.split(/\s+/).length;
  const minutes = Math.ceil(noOfWords / wordsPerMinute);
  return `${minutes} min read`;
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

/**
 * Strips any leading H1/H2 heading that duplicates or mirrors the article title,
 * and normalizes any remaining # H1 headings to ## H2 because the layout
 * component already renders the article title as the solitary page H1.
 */
export function stripDuplicateTitleHeading(markdown: string, title?: string): string {
  if (!markdown) return "";
  let clean = markdown.trim();

  const lines = clean.split("\n");
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (/^#{1,3}\s+/.test(firstLine)) {
      const headingText = firstLine
        .replace(/^#{1,3}\s+/, "")
        .replace(/[*_`]/g, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      let shouldStrip = false;
      if (title) {
        const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (
          headingText === normTitle ||
          normTitle.includes(headingText) ||
          headingText.includes(normTitle) ||
          (normTitle.length > 15 && headingText.startsWith(normTitle.slice(0, 15))) ||
          (headingText.length > 15 && normTitle.startsWith(headingText.slice(0, 15)))
        ) {
          shouldStrip = true;
        }
      } else if (firstLine.startsWith("# ")) {
        // If no title provided but markdown begins with an H1 (#), strip leading H1
        shouldStrip = true;
      }

      if (shouldStrip) {
        lines.shift();
        while (lines.length > 0 && lines[0].trim() === "") {
          lines.shift();
        }
        clean = lines.join("\n");
      }
    }
  }

  // Demote any remaining # H1 headings to ## H2 for semantic SEO (single H1 per page)
  clean = clean.replace(/^#\s+(.+)$/gm, "## $1");
  return clean;
}

export interface HeadingItem {
  text: string;
  id: string;
  level: number;
}

export function generateTableOfContents(markdown: string, title?: string): HeadingItem[] {
  const cleanMarkdown = stripDuplicateTitleHeading(markdown, title);
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: HeadingItem[] = [];
  const usedIds: Record<string, number> = {};
  let match;

  while ((match = headingRegex.exec(cleanMarkdown)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[#*`_\[\]]/g, "").trim();

    // Omit generic callout titles like "Key Takeaway" or "Key Takeaways" from TOC sidebar
    if (/^key takeaway(s)?$/i.test(text)) {
      continue;
    }

    let id = slugify(text);
    if (!id) continue;

    if (usedIds[id]) {
      usedIds[id]++;
      id = `${id}-${usedIds[id]}`;
    } else {
      usedIds[id] = 1;
    }

    headings.push({ text, id, level });
  }

  return headings;
}

export function parseMarkdown(markdown: string, title?: string): string {
  if (!markdown) return "";

  let html = stripDuplicateTitleHeading(markdown, title);

  // Escape HTML entities to prevent raw HTML injections
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 1. Blockquotes
  html = html.replace(/^\s*>\s+(.+)$/gm, "<blockquote>$1</blockquote>");

  // 2. Headings with unique IDs
  const usedHeadingIds: Record<string, number> = {};
  html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, textContent) => {
    const level = hashes.length;
    const cleanText = textContent.replace(/[#*`_\[\]]/g, "").trim();
    let id = slugify(cleanText);

    if (usedHeadingIds[id]) {
      usedHeadingIds[id]++;
      id = `${id}-${usedHeadingIds[id]}`;
    } else {
      usedHeadingIds[id] = 1;
    }

    return `<h${level} id="${id}">${cleanText}</h${level}>`;
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
    if (!trimmed) return "";
    if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<li") || trimmed.startsWith("<blockquote") || trimmed.startsWith("<pre") || trimmed.startsWith("<div") || trimmed.startsWith("</")) {
      return line;
    }
    return `<p>${line}</p>`;
  });
  html = parsedLines.filter(Boolean).join("\n");

  return html;
}
