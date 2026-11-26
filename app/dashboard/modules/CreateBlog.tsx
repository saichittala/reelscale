import React, { useState, useEffect, useRef } from "react";
import { Blog, FAQ, EditorialValidationReport } from "../types";
import { CustomSelect } from "../components/CustomSelect";
import { Button, Input, Textarea, DropdownMenu, type DropdownItem } from "@/components/ui";
import { IconDotsHorizontal } from "../components/Icons";
import { STORAGE_KEYS, API_ROUTES } from "../constants";
import { customFetch, apiValidateBlog } from "../services/api";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Bold,
  Heading2,
  Heading3,
  Quote,
  List,
  ExternalLink,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface CreateBlogProps {
  editingBlog: Blog | null;
  blogCategories: string[];
  onSaveBlog: (blogData: Blog) => void;
  onBlogPublished?: (blog: Blog, validation?: EditorialValidationReport) => void;
  onShowValidation?: (blog: Blog, report: EditorialValidationReport) => void;
  showToast: (msg: string, type?: "success" | "error" | "loading") => void;
  onBack?: () => void;
  onHeaderChange?: (left: React.ReactNode, right: React.ReactNode) => void;
}

export function CreateBlog({
  editingBlog,
  blogCategories,
  onSaveBlog,
  onBlogPublished,
  onShowValidation,
  showToast,
  onBack,
  onHeaderChange,
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
  const [isAiSearchingImage, setIsAiSearchingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAiGenerateAndPublish = async () => {
    setIsGeneratingAi(true);
    showToast("Generating 1,500+ word article with AI & publishing directly to production...", "success");

    try {
      const res = await customFetch(API_ROUTES.AI_GENERATE, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim() || undefined,
          category: category || "Video Production",
          primary_keyword: focusKeyword.trim() || undefined,
          publish_directly: true,
        }),
      });

      const json = await res.json();
      if (json.success && json.blog) {
        const b = json.blog;
        setTitle(b.title || "");
        setSlug(b.slug || "");
        setDescription(b.description || "");
        setCategory(b.category || category);
        setContent(b.content || "");
        setStatus("Published");
        setPublishedDate(b.publishedDate || new Date().toISOString().split("T")[0]);
        if (b.featuredImage) {
          setFeaturedImage(b.featuredImage);
          setAltText(b.title || "Featured Image");
        }
        if (b.focusKeyword) setFocusKeyword(b.focusKeyword);
        if (b.metaTitle) setMetaTitle(b.metaTitle);
        if (b.metaDescription) setMetaDescription(b.metaDescription);
        if (Array.isArray(b.faq)) setFaq(b.faq);

        onBlogPublished?.(b, json.validation);
        if (json.validation) {
          onShowValidation?.(b, json.validation);
        }

        showToast(`Blog "${b.title}" generated, validated, and published directly to production!`, "success");
      } else {
        showToast(json.message || "Failed to generate blog with AI", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error generating blog with AI", "error");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAiSearchImage = async () => {
    if (!title.trim()) {
      showToast("Please enter an article title first so AI can match an image", "error");
      return;
    }

    setIsAiSearchingImage(true);
    showToast("Searching random high-resolution image from Unsplash...", "success");

    try {
      const res = await customFetch(API_ROUTES.AI_IMAGES, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          category: category || "Production",
          keyword: focusKeyword || title.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.image) {
        setFeaturedImage(data.image.imageUrl);
        setAltText(data.image.altText || `${title.trim()} - ReelScale`);
        const providerName = data.image.provider
          ? data.image.provider.charAt(0).toUpperCase() + data.image.provider.slice(1)
          : "Unsplash";
        showToast(`Matched photo from ${providerName} (${data.image.photographerName})!`, "success");
      } else {
        showToast(data.message || "Failed to find matching image", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error searching image", "error");
    } finally {
      setIsAiSearchingImage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    showToast("Uploading image to Sanity...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const userStr = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.USER) : null;
      const headers: Record<string, string> = {};
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.role) headers["x-user-role"] = user.role;
          if (user?.email) headers["x-user-email"] = user.email;
        } catch { }
      }

      const res = await fetch(API_ROUTES.UPLOAD, {
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

  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async () => {
    if (!title.trim() || !slug.trim()) {
      showToast("Please enter an article title and slug to run validation", "error");
      return;
    }
    setIsValidating(true);
    showToast("Running 15-point editorial & SEO validation...", "loading");
    try {
      const rep = await apiValidateBlog({
        title,
        slug,
        description,
        category,
        content,
        featuredImage,
        focusKeyword,
        metaTitle,
        metaDescription,
        canonicalUrl: `https://reelscale.in/blog/${slug}`,
        altText,
        faq: faq.filter((f) => f.question.trim() && f.answer.trim()),
      });
      if (rep) {
        showToast(`Validation complete: Score ${rep.overallScore}/100 (${rep.status.toUpperCase()})`, "success");
        onShowValidation?.(
          {
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
            faq,
          },
          rep
        );
      } else {
        showToast("Could not complete validation", "error");
      }
    } catch {
      showToast("Validation check failed", "error");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      showToast("Article Title and Slug are required", "error");
      return;
    }

    if (status === "Published") {
      const words = content.trim().split(/\s+/).filter(Boolean).length;
      if (words < 50) {
        showToast("Cannot publish: Article content must contain at least 50 words.", "error");
        return;
      }
      if (!description.trim()) {
        showToast("Short description / meta excerpt is required for published articles.", "error");
        return;
      }
    }

    const filteredFaq = faq.filter((f) => f.question.trim() && f.answer.trim());

    setIsSaving(true);
    try {
      await onSaveBlog({
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
    } finally {
      setIsSaving(false);
    }
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

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setContent(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, start + openTag.length + selected.length);
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
  const longContent = content.length > 1000;
  const hasAltText = altText.length > 0;

  const scoreArray = [hasTitle, hasDesc, hasImg, hasKeyword, hasSlug, longContent, hasAltText];
  const passedCount = scoreArray.filter(Boolean).length;
  const seoScore = Math.min(Math.round((passedCount / 7) * 100), 100);

  // Synchronize Topbar Left and Right
  const onHeaderChangeRef = useRef(onHeaderChange);
  useEffect(() => {
    onHeaderChangeRef.current = onHeaderChange;
  });

  const leftHeaderContent = (
    <div className="topbar-back-wrap">
      {onBack && (
        <Button
          variant="secondary"
          size="icon"
          type="button"
          className="topbar-back-btn"
          onClick={onBack}
          title="Back to blogs"
        >
          <ArrowLeft size={16} />
        </Button>
      )}
      <div className="page-title">{editingBlog ? "Edit Article" : "Create Article"}</div>
    </div>
  );

  const rightHeaderContent = (
    <div className="topbar-create-blog-actions">
      <div className="topbar-status-select-wrap">
        <CustomSelect
          id="tb-status"
          value={status}
          onChange={(v) => setStatus(v)}
          options={[
            { value: "Draft", label: "Draft" },
            { value: "Published", label: "Published" },
          ]}
          size="md"
          fullWidth={true}
        />
      </div>

      <div className="topbar-date-wrap" title="Publish Date">
        <Calendar size={16} className="topbar-date-icon" />
        <input
          type="date"
          id="tb-pubdate"
          className="topbar-date-input"
          value={publishedDate}
          onChange={(e) => setPublishedDate(e.target.value)}
        />
      </div>

      {/* Desktop Actions (> 960px) */}
      <div className="header-actions-desktop df-g8 al-c">
        <Button
          variant="ai"
          id="ai-generate-publish-btn"
          type="button"
          disabled={isGeneratingAi || isSaving}
          loading={isGeneratingAi}
          onClick={handleAiGenerateAndPublish}
          title="Generate article with AI and publish directly to production"
        >
          <Sparkles size={16} />
          <span>{isGeneratingAi ? "Generating & Publishing..." : "AI Generate & Publish"}</span>
        </Button>

        <Button
          variant="secondary"
          id="validate-blog-btn"
          type="button"
          disabled={isValidating || isSaving || isGeneratingAi}
          loading={isValidating}
          onClick={handleValidate}
          title="Run 15-point editorial and SEO quality validation"
        >
          <ShieldCheck size={16} />
          <span>{isValidating ? "Validating..." : "Validate"}</span>
        </Button>

        <Button
          variant="primary"
          id="save-blog-btn"
          type="button"
          disabled={isSaving || isGeneratingAi || isValidating}
          loading={isSaving}
          onClick={handleSave}
        >
          <Check size={16} />
          <span>Save & Apply Changes</span>
        </Button>
      </div>

      {/* Compact Actions (<= 960px): Primary Save + Secondary Three-Dot Menu */}
      <div className="header-actions-compact df-g8 al-c">
        <Button
          variant="primary"
          id="save-blog-btn-compact"
          type="button"
          disabled={isSaving || isGeneratingAi || isValidating}
          loading={isSaving}
          onClick={handleSave}
        >
          <Check size={16} />
          <span>Save</span>
        </Button>

        <DropdownMenu
          items={[
            {
              label: isGeneratingAi ? "Generating & Publishing..." : "AI Generate & Publish",
              icon: <Sparkles size={16} className="text-[var(--red)]" />,
              disabled: isGeneratingAi || isSaving,
              onSelect: handleAiGenerateAndPublish,
            },
            {
              label: isValidating ? "Validating..." : "Validate SEO & Quality",
              icon: <ShieldCheck size={16} className="text-[var(--green)]" />,
              disabled: isValidating || isSaving || isGeneratingAi,
              onSelect: handleValidate,
            },
          ]}
          align="end"
          trigger={
            <Button
              variant="secondary"
              size="icon"
              pill
              className="btn-secondary header-more-btn"
              title="More actions"
              aria-label="More actions"
            >
              <IconDotsHorizontal size={18} />
            </Button>
          }
        />
      </div>
    </div>
  );

  useEffect(() => {
    onHeaderChangeRef.current?.(leftHeaderContent, rightHeaderContent);
  }, [
    status,
    publishedDate,
    title,
    slug,
    description,
    category,
    content,
    featuredImage,
    focusKeyword,
    metaTitle,
    metaDescription,
    faq,
    isSaving,
    isGeneratingAi,
    isValidating,
    editingBlog,
  ]);

  useEffect(() => {
    return () => {
      onHeaderChangeRef.current?.(null, null);
    };
  }, []);

  return (
    <div className="editor-grid">
      {/* LEFT COLUMN: Main Editor Area */}
      <div className="editor-main-panel">
        {/* Quick AI Generator Banner with Green -> Violet -> Blue Branding */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(59, 130, 246, 0.12) 100%)",
            border: "1px solid rgba(139, 92, 246, 0.35)",
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(139, 92, 246, 0.3) 100%)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles size={20} style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--white)" }}>
                Generate Article with AI & Publish Directly to Production
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                Automatically writes 1,500+ words, sources featured cover photo, sets FAQs, and publishes live to production.
              </div>
            </div>
          </div>
          <Button
            variant="ai"
            type="button"
            onClick={handleAiGenerateAndPublish}
            disabled={isGeneratingAi || isSaving}
            loading={isGeneratingAi}
          >
            <Sparkles size={15} />
            <span>{isGeneratingAi ? "Generating & Publishing..." : "Generate & Publish Live"}</span>
          </Button>
        </div>

        {/* Basic Details Card */}
        <div className="glass-card">
          <div className="glass-card-label mb-12">Basic Details</div>

          <div className="editor-form-stack">
            <Input
              label="Article Title"
              id="eb-title"
              placeholder="e.g. 10-Minute Video Reels for Jubilee Hills Cafes: The Complete Guide"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />

            <div className="form-row-12">
              <div className="flex-1">
                <Input
                  label="URL Slug"
                  id="eb-slug"
                  placeholder="10-minute-video-reels-jubilee-hills-cafes"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="form-label">Category</label>
                <CustomSelect
                  id="eb-category"
                  value={category}
                  onChange={(v) => setCategory(v)}
                  options={blogCategories.map((c) => ({ value: c, label: c }))}
                  size="md"
                  fullWidth={true}
                />
              </div>
            </div>

            <Textarea
              label="Short Description / Meta Excerpt"
              id="eb-desc"
              rows={3}
              placeholder="Compose a compelling excerpt for search engines and social cards..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Markdown Text Area card */}
        <div className="glass-card">
          <div className="editor-card-header">
            <div className="glass-card-label mb-0">Markdown Editor</div>

            {/* Quick Helper Formatting Bar */}
            <div className="editor-toolbar-pill">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="editor-toolbar-btn"
                onClick={() => insertAtCursor("## ")}
                title="Heading 2"
              >
                <Heading2 size={14} />
                <span>H2</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="editor-toolbar-btn"
                onClick={() => insertAtCursor("### ")}
                title="Heading 3"
              >
                <Heading3 size={14} />
                <span>H3</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="editor-toolbar-btn editor-toolbar-btn-bold"
                onClick={() => insertAtCursor("**", "**")}
                title="Bold"
              >
                <Bold size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="editor-toolbar-btn"
                onClick={() => insertAtCursor("> ")}
                title="Quote"
              >
                <Quote size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="editor-toolbar-btn"
                onClick={() => insertAtCursor("- ")}
                title="Bullet List"
              >
                <List size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="editor-toolbar-btn editor-toolbar-btn-gold"
                onClick={() => insertAtCursor("[Book an On-Location Shoot](https://wa.me/919966239433)")}
                title="Call to Action link"
              >
                <ExternalLink size={14} />
                <span>CTA</span>
              </Button>
            </div>
          </div>

          <textarea
            ref={contentRef}
            className="form-input editor-textarea"
            id="eb-content"
            placeholder="Write your article in Markdown or click 'Generate Full Article' above..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="editor-char-counter-row flex items-center justify-between text-xs text-zinc-500 pt-2">
            <span>Shortcut: Cmd / Ctrl + S to save</span>
            <span>
              Word Count: <strong className="text-zinc-200">{content.trim().split(/\s+/).filter(Boolean).length}</strong>{" "}
              (Target: ~1,200–1,800 words)
            </span>
          </div>
        </div>

        {/* FAQs Dynamic Editor Panel */}
        <div className="glass-card">
          <div className="glass-card-label mb-4">Frequently Asked Questions (FAQ)</div>

          <div id="eb-faq-container" className="faq-list-stack space-y-3">
            {faq.map((f, idx) => (
              <div className="faq-editor-row p-4 rounded-[18px] bg-[var(--white-02)] border border-[var(--border)] space-y-3" key={idx}>
                <div className="faq-row-header flex justify-between items-center">
                  <span className="text-xs font-semibold text-[var(--muted)]">FAQ Item #{idx + 1}</span>
                  <Button
                    variant="danger"
                    size="sm"
                    className="faq-delete-btn h-7 text-xs"
                    type="button"
                    onClick={() => handleRemoveFaq(idx)}
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </Button>
                </div>
                <Input
                  placeholder="Question Title (e.g. How fast does ReelScale deliver videos?)"
                  value={f.question}
                  onChange={(e) => handleFaqChange(idx, "question", e.target.value)}
                  className="bg-[var(--white-02)] border-[var(--border)] text-xs rounded-[18px]"
                />
                <Textarea
                  rows={2}
                  placeholder="Answer text..."
                  value={f.answer}
                  onChange={(e) => handleFaqChange(idx, "answer", e.target.value)}
                  className="bg-[var(--white-02)] border-[var(--border)] text-xs rounded-[18px]"
                />
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            type="button"
            className="add-faq-btn mt-3"
            onClick={handleAddFaq}
          >
            <Plus size={16} />
            <span>Add FAQ Item Manually</span>
          </Button>
        </div>
      </div>

      {/* RIGHT COLUMN: Metadata & SEO controls */}
      <div className="editor-sidebar-panel">
        {/* Featured Image */}
        <div className="glass-card sidebar-card-body">
          <div className="editor-card-header">
            <div className="glass-card-label mb-0">Featured Image</div>
            <span className="badge badge-green">
              <CheckCircle2 size={12} />
              <span>Sanity Synced</span>
            </span>
          </div>

          <div className="editor-image-frame aspect-video rounded-[18px] overflow-hidden bg-[var(--white-02)] border border-[var(--border)] flex items-center justify-center my-3">
            {featuredImage ? (
              <img
                id="eb-img-preview"
                src={featuredImage}
                alt={altText || "Featured preview"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div id="eb-img-empty" className="editor-empty-placeholder text-center text-zinc-500">
                <ImageIcon size={26} className="mx-auto mb-1 opacity-50" />
                <span className="text-xs text-[var(--muted)]">No Image Selected</span>
              </div>
            )}
          </div>

          {/* Direct File Upload to Sanity */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden-file-input hidden"
            onChange={handleFileUpload}
          />
          <div className="editor-image-actions" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%" }}>
            <Button
              variant="gold"
              className="flex-1"
              disabled={isAiSearchingImage || isUploading}
              loading={isAiSearchingImage}
              type="button"
              onClick={handleAiSearchImage}
              title="Search and attach random matching stock image from Unsplash/Pexels based on blog title"
            >
              <Sparkles size={16} />
              <span>{isAiSearchingImage ? "Searching..." : "AI Image Search"}</span>
            </Button>

            <Button
              variant="secondary"
              className="flex-1"
              disabled={isUploading || isAiSearchingImage}
              loading={isUploading}
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              <span>{isUploading ? "Uploading..." : "Upload File"}</span>
            </Button>
          </div>

          <Input
            label="Or Image URL (Pexels / Unsplash / CDN)"
            id="eb-img-url"
            placeholder="https://images.pexels.com/..."
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

          <Input
            label="Image Alt Text (SEO)"
            id="eb-img-alt"
            placeholder="e.g. Professional mobile videographer in Hyderabad cafe"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
          />
        </div>

        {/* SEO Panel */}
        <div className="glass-card sidebar-card-body">
          <div className="editor-card-header">
            <div className="glass-card-label mb-0">SEO Optimization</div>
            <span className={`badge ${seoScore > 70 ? "badge-green" : "badge-red"} text-xxs`}>
              Score: {seoScore}%
            </span>
          </div>

          <Input
            label="Focus Keyword"
            id="eb-keyword"
            placeholder="e.g. cafe reels hyderabad"
            value={focusKeyword}
            onChange={(e) => setFocusKeyword(e.target.value)}
          />

          <Input
            label="Meta Title"
            id="eb-meta-title"
            placeholder="50-60 characters title tag..."
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />

          <Textarea
            label="Meta Description"
            id="eb-meta-desc"
            rows={2}
            placeholder="130-160 characters search description..."
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />

          {/* SEO Optimization Checklist */}
          <div className="seo-checklist-container space-y-2 pt-3 border-t border-[var(--border)]">
            <div className="seo-check-item flex items-center gap-2 text-xs">
              {hasTitle ? <Check size={14} className="text-[var(--green)]" /> : <X size={14} className="text-[var(--red)]" />}
              <span className={hasTitle ? "text-zinc-200" : "text-[var(--muted)]"}>Title length & structure</span>
            </div>
            <div className="seo-check-item flex items-center gap-2 text-xs">
              {hasDesc ? <Check size={14} className="text-[var(--green)]" /> : <X size={14} className="text-[var(--red)]" />}
              <span className={hasDesc ? "text-zinc-200" : "text-[var(--muted)]"}>Meta description configured</span>
            </div>
            <div className="seo-check-item flex items-center gap-2 text-xs">
              {hasImg ? <Check size={14} className="text-[var(--green)]" /> : <X size={14} className="text-[var(--red)]" />}
              <span className={hasImg ? "text-zinc-200" : "text-[var(--muted)]"}>Featured stock image attached</span>
            </div>
            <div className="seo-check-item flex items-center gap-2 text-xs">
              {hasKeyword ? <Check size={14} className="text-[var(--green)]" /> : <X size={14} className="text-[var(--red)]" />}
              <span className={hasKeyword ? "text-zinc-200" : "text-[var(--muted)]"}>Primary focus keyword</span>
            </div>
            <div className="seo-check-item flex items-center gap-2 text-xs">
              {longContent ? <Check size={14} className="text-[var(--green)]" /> : <X size={14} className="text-[var(--red)]" />}
              <span className={longContent ? "text-zinc-200" : "text-[var(--muted)]"}>Content depth (&gt;1,000 words)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateBlog;
