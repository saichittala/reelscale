import React, { useState, useEffect, useRef } from "react";
import { Blog, FAQ } from "../types";
import { CustomSelect } from "../components/CustomSelect";
import { Button, Input, Textarea } from "@/components/ui";

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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    showToast("Uploading image to Sanity...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const userStr = typeof window !== "undefined" ? localStorage.getItem("reelscale_user") : null;
      const headers: Record<string, string> = {};
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.role) headers["x-user-role"] = user.role;
          if (user?.email) headers["x-user-email"] = user.email;
        } catch {}
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setFeaturedImage(data.url);
        if (!altText) setAltText(file.name.replace(/\.[^/.]+$/, ""));
        showToast("Image uploaded to Sanity successfully!", "success");
      } else {
        showToast(data.message || "Failed to upload image", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Image upload failed", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
    <div className="editor-grid">
      {/* LEFT COLUMN: Main Editor Area */}
      <div className="editor-main-panel">
        {/* Basic Details Card */}
        <div className="glass-card editor-main-panel">
          <div className="glass-card-label mb-neg4">
            Basic Details
          </div>

          <div className="form-group mb-16">
            <Input
              label="Article Title"
              id="eb-title"
              placeholder="How to Craft a High-Retention Reels Strategy"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>

          <div className="form-row mb-16">
            <div className="form-group flex-1">
              <Input
                label="URL Slug"
                id="eb-slug"
                placeholder="how-to-craft-high-retention-strategy"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="form-group flex-1">
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
            <Textarea
              label="Short Description"
              id="eb-desc"
              rows={3}
              placeholder="Compose a short excerpt / description for cards..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Markdown Text Area card */}
        <div className="glass-card flex-grow-1 flex-column">
          <div className="chart-header">
            <div className="glass-card-label mb-0">
              Markdown Editor
            </div>

            {/* Quick Helper Formatting Bar */}
            <div className="df-g8 editor-toolbar-helper">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => insertAtCursor("## ")}
              >
                H2
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => insertAtCursor("### ")}
              >
                H3
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => insertAtCursor("**", "**")}
              >
                B
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="italic"
                type="button"
                onClick={() => insertAtCursor("> ")}
              >
                Quote
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => insertAtCursor("- ")}
              >
                List
              </Button>
              <Button
                variant="gold"
                size="sm"
                type="button"
                onClick={() =>
                  insertAtCursor(
                    "[Book a Reel Shoot](https://wa.me/919966239433)"
                  )
                }
              >
                CTA
              </Button>
            </div>
          </div>

          <textarea
            ref={contentRef}
            className="form-input editor-textarea"
            id="eb-content"
            placeholder="Compose your post using Markdown formatting..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="editor-char-counter-row">
            <span>Save Shortcut: Cmd / Ctrl + S</span>
            <span id="editor-char-counter">{content.length} characters</span>
          </div>
        </div>

        {/* FAQs Dynamic Editor Panel */}
        <div className="glass-card">
          <div className="glass-card-label">Frequently Asked Questions (FAQ)</div>

          <div id="eb-faq-container" className="df-g12 flex-column">
            {faq.map((f, idx) => (
              <div className="faq-edit-row faq-editor-row" key={idx}>
                <div className="faq-row-header">
                  <div className="faq-item-label">
                    FAQ Item #{idx + 1}
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    className="eb-faq-delete faq-delete-btn"
                    type="button"
                    onClick={() => handleRemoveFaq(idx)}
                  >
                    Remove
                  </Button>
                </div>
                <Input
                  className="faq-q-input mb-8"
                  placeholder="Question Title"
                  value={f.question}
                  onChange={(e) =>
                    handleFaqChange(idx, "question", e.target.value)
                  }
                />
                <Textarea
                  className="faq-a-input"
                  rows={2}
                  placeholder="Answer text..."
                  value={f.answer}
                  onChange={(e) =>
                    handleFaqChange(idx, "answer", e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            className="add-faq-btn mt-12"
            onClick={handleAddFaq}
          >
            + Add FAQ Item
          </Button>
        </div>
      </div>

      {/* RIGHT COLUMN: Metadata & SEO controls */}
      <div className="editor-sidebar-panel">
        {/* Publish settings */}
        <div className="glass-card editor-main-panel">
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

          <div className="form-group mb-16">
            <Input
              label="Publish Date"
              type="date"
              id="eb-pubdate"
              value={publishedDate}
              onChange={(e) => setPublishedDate(e.target.value)}
            />
          </div>

          <Button
            variant="primary"
            className="w-full mt-8"
            id="save-blog-btn"
            onClick={handleSave}
          >
            Save & Apply Updates
          </Button>
        </div>

        {/* Featured Image */}
        <div className="glass-card sidebar-card-body">
          <div className="glass-card-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Featured Image</span>
            <span style={{ fontSize: "11px", color: "var(--color-primary, #6366f1)" }}>Sanity Synced</span>
          </div>

          <div className="editor-image-frame">
            {featuredImage ? (
              <img
                id="eb-img-preview"
                src={featuredImage}
                alt=""
                className="aspect-video-img"
              />
            ) : (
              <div id="eb-img-empty" className="td-muted-small">
                No Image Selected
              </div>
            )}
          </div>

          {/* Direct File Upload to Sanity */}
          <div className="form-group mb-12">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <Button
              variant="secondary"
              className="w-full"
              disabled={isUploading}
              loading={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <span>{isUploading ? "Uploading..." : "📁 Upload from Device"}</span>
            </Button>
          </div>

          <div className="form-group mb-12">
            <Input
              label="Or Image URL (Unsplash / Pexels / CDN)"
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
            <Input
              label="Image Alt Text (SEO)"
              id="eb-img-alt"
              placeholder="Cinematic reel filming gears setup"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
          </div>
        </div>

        {/* SEO Panel */}
        <div className="glass-card sidebar-card-body">
          <div className="chart-header">
            <div className="glass-card-label mb-0">
              SEO Optimization
            </div>
            <span
              className={`badge ${seoScore > 70 ? "badge-green" : "badge-red"} text-xxs`}
            >
              Score: {seoScore}%
            </span>
          </div>

          <div className="form-group mb-12">
            <Input
              label="Focus Keyword"
              id="eb-keyword"
              placeholder="reel growth strategy"
              value={focusKeyword}
              onChange={(e) => setFocusKeyword(e.target.value)}
            />
          </div>

          <div className="form-group mb-12">
            <Input
              label="Meta Title"
              id="eb-meta-title"
              placeholder="Optional meta title tag override..."
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
          </div>

          <div className="form-group mb-12">
            <Textarea
              label="Meta Description"
              id="eb-meta-desc"
              rows={2}
              placeholder="Optional meta description override..."
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </div>

          {/* SEO Optimization Checklist */}
          <div className="seo-checklist-container">
            <div className="seo-check-item">
              <span className={hasTitle ? "text-green" : "text-red"}>
                {hasTitle ? "✓" : "✗"}
              </span>{" "}
              Title length and structure
            </div>
            <div className="seo-check-item">
              <span className={hasDesc ? "text-green" : "text-red"}>
                {hasDesc ? "✓" : "✗"}
              </span>{" "}
              Short description excerpt
            </div>
            <div className="seo-check-item">
              <span className={hasImg ? "text-green" : "text-red"}>
                {hasImg ? "✓" : "✗"}
              </span>{" "}
              Featured Image attached
            </div>
            <div className="seo-check-item">
              <span className={hasKeyword ? "text-green" : "text-red"}>
                {hasKeyword ? "✓" : "✗"}
              </span>{" "}
              Focus keyword config
            </div>
            <div className="seo-check-item">
              <span className={hasSlug ? "text-green" : "text-red"}>
                {hasSlug ? "✓" : "✗"}
              </span>{" "}
              Clean URL slug format
            </div>
            <div className="seo-check-item">
              <span className={longContent ? "text-green" : "text-red"}>
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
