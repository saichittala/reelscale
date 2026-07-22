"use client";

import React, { useEffect, useState } from "react";

export interface ShareModalPost {
  title: string;
  slug: string;
  description?: string;
  featuredImage?: string;
  category?: string;
  author?: string;
  readTime?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: ShareModalPost;
}

export default function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== "undefined" 
    ? window.location.href 
    : `https://reelscale.in/blog/${post.slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleWhatsApp = () => {
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title} - ${currentUrl}`)}`,
      "_blank"
    );
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(post.title)}`,
      "_blank"
    );
  };

  const handleLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
      "_blank"
    );
  };

  return (
    <div className="share-modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-modal-header">
          <h2 className="share-modal-title">Share this article</h2>
          <button 
            className="share-modal-close-btn" 
            onClick={onClose}
            aria-label="Close share dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Article Preview Card */}
        <div className="share-modal-preview-card">
          <div className="share-modal-preview-img-wrap">
            {post.featuredImage ? (
              <img 
                src={post.featuredImage} 
                alt={post.title} 
                className="share-modal-preview-img"
              />
            ) : (
              <div className="share-modal-preview-img-placeholder">
                ReelScale
              </div>
            )}
          </div>
          <div className="share-modal-preview-info">
            <h4 className="share-modal-preview-title">{post.title}</h4>
            <div className="share-modal-preview-meta">
              <span>{post.category || "Article"}</span>
              {post.readTime && <span> • {post.readTime}</span>}
              {post.author && <span> • By {post.author}</span>}
            </div>
          </div>
        </div>

        {/* 4 Main Share Options Grid */}
        <div className="share-modal-grid">
          
          {/* 1. Copy Link */}
          <button 
            className={`share-option-btn ${copiedLink ? "copied" : ""}`}
            onClick={handleCopyLink}
          >
            <span className="share-option-icon">
              {copiedLink ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              )}
            </span>
            <span className="share-option-label">
              {copiedLink ? "Link Copied!" : "Copy Link"}
            </span>
          </button>

          {/* 2. WhatsApp */}
          <button className="share-option-btn" onClick={handleWhatsApp}>
            <span className="share-option-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.276.442-1.002 3.662 3.753-.984.416.247z"/>
              </svg>
            </span>
            <span className="share-option-label">WhatsApp</span>
          </button>

          {/* 3. Twitter / X */}
          <button className="share-option-btn" onClick={handleTwitter}>
            <span className="share-option-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </span>
            <span className="share-option-label">Twitter / X</span>
          </button>

          {/* 4. LinkedIn */}
          <button className="share-option-btn" onClick={handleLinkedIn}>
            <span className="share-option-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </span>
            <span className="share-option-label">LinkedIn</span>
          </button>

        </div>
      </div>
    </div>
  );
}
