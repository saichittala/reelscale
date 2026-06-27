"use client";

import { useEffect, useState } from "react";

export default function BlogInteractions() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState("");

  useEffect(() => {
    // 1. Reading Progress Bar
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.pageYOffset / totalHeight) * 100;
        setScrollProgress(progress);
      }

      // 2. Active Heading in TOC
      const headings = Array.from(document.querySelectorAll(".blog-body h2, .blog-body h3"));
      const scrollPos = window.scrollY + 140;

      for (let i = 0; i < headings.length; i++) {
        const el = headings[i] as HTMLElement;
        if (el.offsetTop <= scrollPos) {
          setActiveHeading(el.id);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    // 3. FAQ Toggles
    const questions = document.querySelectorAll(".blog-faq-q");
    questions.forEach((q) => {
      const toggle = () => {
        const item = q.parentElement;
        const answer = item?.querySelector(".blog-faq-a") as HTMLElement;
        const chevron = q.querySelector(".faq-chevron") as HTMLElement;
        
        if (answer) {
          if (answer.style.display === "none" || !answer.style.display) {
            answer.style.display = "block";
            if (chevron) chevron.style.transform = "rotate(180deg)";
          } else {
            answer.style.display = "none";
            if (chevron) chevron.style.transform = "rotate(0deg)";
          }
        }
      };
      q.addEventListener("click", toggle);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Update active status in CSS for TOC items
  useEffect(() => {
    const tocItems = document.querySelectorAll(".blog-toc-item");
    tocItems.forEach((item) => {
      const link = item.querySelector("a");
      if (link) {
        const href = link.getAttribute("href")?.substring(1);
        if (href === activeHeading) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      }
    });
  }, [activeHeading]);

  return (
    <>
      <div 
        className="reading-progress-bar" 
        style={{ width: `${scrollProgress}%` }} 
      />
    </>
  );
}
