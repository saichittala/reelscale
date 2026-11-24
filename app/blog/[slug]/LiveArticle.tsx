"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BlogPost } from "../../lib/blog-types";
import {
  getReadingTime,
  parseMarkdown,
  generateTableOfContents,
} from "../../lib/blog-utils";
import { client } from "../../sanity/client";
import { POST_BY_SLUG_QUERY } from "../../sanity/queries";
import { blocksToMarkdown } from "../../sanity/blog-sync";
import FAQSection from "../components/FAQSection";
import TableOfContents from "../components/TableOfContents";
import ShareButtons, { HeaderShareButton } from "./ShareButtons";
import { Button, Input } from "@/components/ui";

interface LiveArticleProps {
  initialPost: BlogPost;
}

export default function LiveArticle({ initialPost }: LiveArticleProps) {
  const [post, setPost] = useState<BlogPost>(initialPost);

  useEffect(() => {
    let isMounted = true;

    async function revalidatePost() {
      try {
        const sp = await client.fetch(
          POST_BY_SLUG_QUERY,
          { slug: initialPost.slug },
          { cache: "no-store" }
        );

        if (sp && sp.title && isMounted) {
          const sanityContent = Array.isArray(sp.body)
            ? blocksToMarkdown(sp.body)
            : typeof sp.body === "string"
            ? sp.body
            : initialPost.content;

          setPost((prev: BlogPost) => ({
            ...prev,
            title: sp.title || prev.title,
            description: sp.description || prev.description,
            category: sp.category || prev.category,
            tags: sp.tags || prev.tags,
            featuredImage:
              sp.featuredImageUrl ||
              sp.featuredImage?.asset?.url ||
              (typeof sp.featuredImage === "string" ? sp.featuredImage : "") ||
              prev.featuredImage,
            publishedDate: sp.publishedDate || prev.publishedDate,
            updatedDate: sp.updatedDate || prev.updatedDate,
            content: sanityContent,
            author: sp.author || prev.author,
            faq: Array.isArray(sp.faq) ? sp.faq : prev.faq,
          }));
        }
      } catch (err) {
        // Fallback silently to initial server-rendered post
      }
    }

    revalidatePost();

    return () => {
      isMounted = false;
    };
  }, [initialPost.slug]);

  const htmlContent = parseMarkdown(post.content, post.title);
  const headings = generateTableOfContents(post.content, post.title);
  const readTime = getReadingTime(post.content);

  const sharePostData = {
    title: post.title,
    slug: post.slug,
    description: post.description,
    featuredImage: post.featuredImage,
    category: post.category,
    author: post.author || "ReelScale Team",
    readTime,
  };

  return (
    <>
      {/* Breadcrumbs */}
      <div className="blog-breadcrumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/blog">Blog</Link>
        <span>/</span>
        <Link href={`/blog/category/${post.category.toLowerCase()}`}>
          {post.category}
        </Link>
        <span>/</span>
        <span className="blog-breadcrumb-active-item">{post.title}</span>
      </div>

      {/* Title and Hero info */}
      <div className="blog-post-header">
        <h1>{post.title}</h1>
        <div className="blog-post-meta">
          <div className="blog-post-author-img">
            {(post.author || "ReelScale Team")[0]}
          </div>
          <div>
            <div className="blog-post-author-name">
              {post.author || "ReelScale Team"}
            </div>
            <div className="blog-post-publish-date">
              Published on {post.publishedDate} · {readTime}
            </div>
          </div>
          <div className="blog-post-meta-actions">
            <span className="blog-category-btn active blog-post-category-badge">
              {post.category}
            </span>
            <HeaderShareButton post={sharePostData} />
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featuredImage && (
        <img
          src={post.featuredImage}
          alt={post.title}
          className="blog-post-featured-img"
        />
      )}

      {/* Main layout split */}
      <div className="blog-detail-layout">
        {/* Main content Area */}
        <div className="blog-detail-main">
          {/* Parsed body content */}
          <div
            className="blog-body"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Accordion FAQs */}
          <FAQSection faq={post.faq} />

          {/* Social Share Buttons */}
          <ShareButtons
            title={post.title}
            slug={post.slug}
            post={sharePostData}
          />

          {/* Conversion CTA Box */}
          <div className="blog-cta-box">
            <h3 className="blog-cta-title">
              Need scroll-stopping cinematic reels?
            </h3>
            <p className="blog-cta-desc">
              Partner with ReelScale Co. to build a premium, high-retention video pipeline that turns viewers into clients organically.
            </p>
            <div className="blog-cta-buttons">
              <a
                href="https://wa.me/919966239433?text=Hey%2C%20I%20saw%20your%20blog%20post%20and%20I%27m%20interested%20in%20scaling%20our%20reel%20production."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary blog-cta-btn-link"
              >
                WhatsApp enquiry
              </a>
              <Link href="/pricing" className="btn-secondary blog-cta-btn-link">
                View packages
              </Link>
            </div>
          </div>
        </div>

        {/* Sticky Sidebar */}
        <aside className="blog-sidebar-sticky">
          {/* Table of Contents */}
          <TableOfContents headings={headings} />

          {/* Newsletter form */}
          <div className="newsletter-card">
            <div className="newsletter-title">Subscribe to scale</div>
            <p className="newsletter-desc">
              Get monthly deep-dives on editing hooks, retention tactics, and social algorithms.
            </p>
            <div className="newsletter-form" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Input
                type="email"
                placeholder="name@email.com"
                className="blog-newsletter-input"
              />
              <Button variant="primary" className="blog-newsletter-btn w-full">
                Join newsletter
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
