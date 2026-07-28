import React, { useState, useEffect, useRef } from "react";
import { Blog, FAQ } from "../types";
import { CustomSelect } from "../components/CustomSelect";

interface CreateBlogProps {
  editingBlog: Blog | null;
  blogCategories: string[];
  onSaveBlog: (blogData: Blog) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export function CreateBlog({
  editingBlog,
  blogCategories,
  onSaveBlog,
  showToast,
}: CreateBlogProps) {
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Draft");
  const [publishedDate, setPublishedDate] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [altText, setAltText] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [faq, setFaq] = useState<FAQ[]>([]);

  // Sync initial state if editing
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (editingBlog) {
      setTitle(editingBlog.title || "");
      setSlug(editingBlog.slug || "");
      setDescription(editingBlog.description || "");
      setCategory(editingBlog.category || blogCategories[0] || "General");
      setContent(editingBlog.content || "");
      setStatus(editingBlog.status || "Draft");
      setPublishedDate(editingBlog.publishedDate || today);
      setFeaturedImage(editingBlog.featuredImage || "");
      setFocusKeyword(editingBlog.focusKeyword || "");
      setMetaTitle(editingBlog.metaTitle || "");
      setMetaDescription(editingBlog.metaDescription || "");
      setFaq(editingBlog.faq || []);
      setAltText(editingBlog.featuredImage ? "Configured" : "");
    } else {
      setTitle("");
      setSlug("");
      setDescription("");
      setCategory(blogCategories[0] || "General");
      setContent("");
      setStatus("Draft");
      setPublishedDate(today);
      setFeaturedImage("");
      setFocusKeyword("");
      setMetaTitle("");
      setMetaDescription("");
      setFaq([]);
      setAltText("");
    }
  }, [editingBlog, blogCategories]);

  // Auto slug generation from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingBlog || !editingBlog.slug) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
      setSlug(generated);
    }
  };

  // Keyboard shortcut listener for Cmd + S or Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleSave = () => {
    if (!title.trim() || !slug.trim()) {
      showToast("Article Title and Slug are required", "error");
      return;
    }

    // Filter empty FAQ items
    const filteredFaq = faq.filter((f) => f.question.trim() && f.answer.trim());

    onSaveBlog({
      id: editingBlog?.id,
      title,
      slug,
      description,
      category,
      content,
      status,
      publishedDate,
      featuredImage,
      focusKeyword,
      metaTitle,
      metaDescription,
      faq: filteredFaq,
    });
  };

  // Markdown Editor Toolbars Help Insertions
  const insertAtCursor = (openTag: string, closeTag = "") => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = openTag + selected + closeTag;

    const newValue =
      text.substring(0, start) + replacement + text.substring(end);
    setContent(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + openTag.length,
        start + openTag.length + selected.length
      );
    }, 0);
  };

  // FAQ CRUD helpers
  const handleAddFaq = () => {
    setFaq((prev) => [...prev, { question: "", answer: "" }]);
  };

  const handleFaqChange = (index: number, key: keyof FAQ, value: string) => {
    setFaq((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleRemoveFaq = (index: number) => {
    setFaq((prev) => prev.filter((_, i) => i !== index));
  };

  // SEO Score Calculations
  const hasTitle = title.length > 5;
  const hasDesc = description.length > 10;
  const hasImg = !!featuredImage;
  const hasKeyword = !!focusKeyword;
  const hasSlug = slug.length > 3;
  const longContent = content.length > 150;
  const hasAltText = altText.length > 0;

  const scoreArray = [
    hasTitle,
    hasDesc,
    hasImg,
    hasKeyword,
    hasSlug,
    longContent,
    hasAltText,
  ];
  const passedCount = scoreArray.filter(Boolean).length;
  // Calculate SEO score up to 100%
  const seoScore = Math.min(Math.round((passedCount / 7) * 100), 100);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        gap: "24px",
        minHeight: "80vh",
      }}
    >
      {/* LEFT COLUMN: Main Editor Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Basic Details Card */}
        <div
          className="glass-card"
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div className="glass-card-label" style={{ marginBottom: "-4px" }}>
            Basic Details
          </div>

          <div className="form-group">
            <label className="form-label">Article Title</label>
            <input
              className="form-input"
              id="eb-title"
              placeholder="How to Craft a High-Retention Reels Strategy"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">URL Slug</label>
              <input
                className="form-input"
                id="eb-slug"
                placeholder="how-to-craft-high-retention-strategy"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <CustomSelect
                id="eb-category"
                value={category}
                onChange={(v) => setCategory(v)}
                options={blogCategories.map((c) => ({ value: c, label: c }))}
                size="md"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Short Description</label>
            <textarea
              className="form-input"
              id="eb-desc"
              rows={3}
              placeholder="Compose a short excerpt / description for cards..."
              style={{ resize: "none", padding: "12px" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Markdown Text Area card */}
        <div
          className="glass-card"
          style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div className="glass-card-label" style={{ marginBottom: 0 }}>
              Markdown Editor
            </div>

            {/* Quick Helper Formatting Bar */}
            <div
              className="df-g8"
              style={{
                background: "var(--white-03)",
                borderRadius: "var(--border-radius-3)",
                padding: "2px",
              }}
            >
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: "4px 8px", fontSize: "11px", fontWeight: 700 }}
                onClick={() => insertAtCursor("## ")}
              >
                H2
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: "4px 8px", fontSize: "11px", fontWeight: 700 }}
                onClick={() => insertAtCursor("### ")}
              >
                H3
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: "4px 8px", fontSize: "11px", fontWeight: 700 }}
                onClick={() => insertAtCursor("**", "**")}
              >
                B
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontStyle: "italic",
                }}
                onClick={() => insertAtCursor("> ")}
              >
                Quote
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => insertAtCursor("- ")}
              >
                List
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: "4px 8px", fontSize: "11px", color: "var(--gold)" }}
                onClick={() =>
                  insertAtCursor(
                    "[Book a Reel Shoot](https://wa.me/919966239433)"
                  )
                }
              >
                CTA
              </button>
            </div>
          </div>

          <textarea
            ref={contentRef}
            className="form-input"
            id="eb-content"
            style={{
              flexGrow: 1,
              minHeight: "400px",
              fontFamily: "monospace",
              fontSize: "13px",
              lineHeight: 1.6,
              padding: "16px",
              background: "var(--bg2)",
              borderColor: "var(--border)",
            }}
            placeholder="Compose your post using Markdown formatting..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "8px",
              fontSize: "11px",
              color: "var(--muted)",
            }}
          >
            <span>Save Shortcut: Cmd / Ctrl + S</span>
            <span id="editor-char-counter">{content.length} characters</span>
          </div>
        </div>

        {/* FAQs Dynamic Editor Panel */}
        <div className="glass-card">
          <div className="glass-card-label">Frequently Asked Questions (FAQ)</div>

          <div
            id="eb-faq-container"
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {faq.map((f, idx) => (
              <div
                className="faq-edit-row"
                key={idx}
                style={{
                  background: "var(--white-03)",
                  padding: "12px",
                  borderRadius: "var(--border-radius-3)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--gold)",
                    }}
                  >
                    FAQ Item #{idx + 1}
                  </div>
                  <button
                    className="btn btn-ghost eb-faq-delete"
                    type="button"
                    style={{
                      padding: "2px 8px",
                      color: "var(--red)",
                      fontSize: "11px",
                    }}
                    onClick={() => handleRemoveFaq(idx)}
                  >
                    Remove
                  </button>
                </div>
                <input
                  className="form-input faq-q-input"
                  placeholder="Question Title"
                  value={f.question}
                  onChange={(e) =>
                    handleFaqChange(idx, "question", e.target.value)
                  }
                />
                <textarea
                  className="form-input faq-a-input"
                  rows={2}
                  placeholder="Answer text..."
                  style={{ resize: "none" }}
                  value={f.answer}
                  onChange={(e) =>
                    handleFaqChange(idx, "answer", e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <button
            className="btn btn-ghost"
            style={{
              marginTop: "16px",
              width: "100%",
              border: "1px dashed var(--border)",
              fontSize: "13px",
            }}
            onClick={handleAddFaq}
          >
            + Add FAQ Item
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Metadata & SEO controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Publish settings */}
        <div
          className="glass-card"
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div className="glass-card-label">Publish Settings</div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <CustomSelect
              id="eb-status"
              value={status}
              onChange={(v) => setStatus(v)}
              options={[
                { value: "Draft", label: "Draft" },
                { value: "Published", label: "Published" },
              ]}
              size="md"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Publish Date</label>
            <input
              type="date"
              className="form-input"
              id="eb-pubdate"
              value={publishedDate}
              onChange={(e) => setPublishedDate(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary"
            id="save-blog-btn"
            style={{ width: "100%", padding: "12px", marginTop: "8px" }}
            onClick={handleSave}
          >
            Save & Apply Updates
          </button>
        </div>

        {/* Featured Image */}
        <div
          className="glass-card"
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div className="glass-card-label">Featured Image</div>

          <div
            style={{
              width: "100%",
              height: "140px",
              borderRadius: "var(--border-radius-3)",
              border: "1px solid var(--border)",
              overflow: "hidden",
              background: "var(--white-03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {featuredImage ? (
              <img
                id="eb-img-preview"
                src={featuredImage}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div id="eb-img-empty" style={{ color: "var(--muted)", fontSize: "11px" }}>
                No Image Selected
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              className="form-input"
              id="eb-img-url"
              placeholder="https://images.unsplash.com/..."
              value={featuredImage}
              onChange={(e) => {
                setFeaturedImage(e.target.value);
                if (e.target.value && !altText) {
                  setAltText("Configured");
                } else if (!e.target.value) {
                  setAltText("");
                }
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Image Alt Text (SEO)</label>
            <input
              className="form-input"
              id="eb-img-alt"
              placeholder="Cinematic reel filming gears setup"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
          </div>
        </div>

        {/* SEO Panel */}
        <div
          className="glass-card"
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <div className="glass-card-label" style={{ marginBottom: 0 }}>
              SEO Optimization
            </div>
            <span
              className={`badge ${seoScore > 70 ? "badge-green" : "badge-red"}`}
              style={{ fontSize: "11px" }}
            >
              Score: {seoScore}%
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Focus Keyword</label>
            <input
              className="form-input"
              id="eb-keyword"
              placeholder="reel growth strategy"
              value={focusKeyword}
              onChange={(e) => setFocusKeyword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Meta Title</label>
            <input
              className="form-input"
              id="eb-meta-title"
              placeholder="Optional meta title tag override..."
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Meta Description</label>
            <textarea
              className="form-input"
              id="eb-meta-desc"
              rows={2}
              placeholder="Optional meta description override..."
              style={{ resize: "none" }}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </div>

          {/* SEO Optimization Checklist */}
          <div
            style={{
              marginTop: "8px",
              borderTop: "1px solid var(--border)",
              paddingTop: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "11px",
              color: "var(--muted)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: hasTitle ? "var(--green)" : "var(--red)",
                }}
              >
                {hasTitle ? "✓" : "✗"}
              </span>{" "}
              Title length and structure
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: hasDesc ? "var(--green)" : "var(--red)",
                }}
              >
                {hasDesc ? "✓" : "✗"}
              </span>{" "}
              Short description excerpt
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: hasImg ? "var(--green)" : "var(--red)",
                }}
              >
                {hasImg ? "✓" : "✗"}
              </span>{" "}
              Featured Image attached
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: hasKeyword ? "var(--green)" : "var(--red)",
                }}
              >
                {hasKeyword ? "✓" : "✗"}
              </span>{" "}
              Focus keyword config
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: hasSlug ? "var(--green)" : "var(--red)",
                }}
              >
                {hasSlug ? "✓" : "✗"}
              </span>{" "}
              Clean URL slug format
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: longContent ? "var(--green)" : "var(--red)",
                }}
              >
                {longContent ? "✓" : "✗"}
              </span>{" "}
              Content article length
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default CreateBlog;
