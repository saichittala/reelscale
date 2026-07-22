"use client";

import React, { useState } from "react";
import ShareModal, { ShareModalPost } from "../components/ShareModal";

interface ShareProps {
  title: string;
  slug: string;
  post?: ShareModalPost;
}

export function HeaderShareButton({ post }: { post: ShareModalPost }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        className="blog-header-share-btn"
        onClick={() => setIsModalOpen(true)}
        aria-label="Share article"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
          <polyline points="16 6 12 2 8 6"></polyline>
          <line x1="12" y1="2" x2="12" y2="15"></line>
        </svg>
        <span className="blog-header-share-text">Share</span>
      </button>

      <ShareModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        post={post} 
      />
    </>
  );
}

export default function ShareButtons({ title, slug, post }: ShareProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const postData: ShareModalPost = post || {
    title,
    slug,
  };

  const handleTwitter = () => {
    if (typeof window !== "undefined") {
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(title)}`,
        "_blank"
      );
    }
  };

  const handleLinkedIn = () => {
    if (typeof window !== "undefined") {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
        "_blank"
      );
    }
  };

  const handleCopy = async () => {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <>
      <div className="blog-share-panel">
        <span className="blog-share-label">Share Article:</span>
        <button className="share-btn" onClick={handleTwitter}>
          Twitter
        </button>
        <button className="share-btn" onClick={handleLinkedIn}>
          LinkedIn
        </button>
        <button className="share-btn" onClick={handleCopy}>
          Copy Link
        </button>
        <button 
          className="share-btn share-btn-primary" 
          onClick={() => setIsModalOpen(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
          All Share Options
        </button>
      </div>

      <ShareModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        post={postData} 
      />
    </>
  );
}
