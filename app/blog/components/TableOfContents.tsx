"use client";

import { useEffect, useState } from "react";
import { HeadingItem } from "../../lib/blog";

interface TableOfContentsProps {
  headings: HeadingItem[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const headingElements = headings
        .map((h) => document.getElementById(h.id))
        .filter(Boolean) as HTMLElement[];
      
      const scrollPos = window.scrollY + 140;

      // Find the current heading that is above the scroll threshold
      let currentActive = "";
      for (const el of headingElements) {
        if (el.offsetTop <= scrollPos) {
          currentActive = el.id;
        }
      }
      
      // Fallback to first heading if none are active but we have scrolled past it
      if (!currentActive && headingElements.length > 0) {
        currentActive = headingElements[0].id;
      }

      setActiveId(currentActive);
    };

    window.addEventListener("scroll", handleScroll);
    // Call once initially to set the active heading
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className="blog-toc-card">
      <div className="blog-toc-title">On this page</div>
      <ul className="blog-toc-list">
        {headings.map((h, i) => (
          <li 
            key={i} 
            className={`blog-toc-item level-${h.level} ${activeId === h.id ? "active" : ""}`}
          >
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
