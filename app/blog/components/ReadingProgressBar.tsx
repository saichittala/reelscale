"use client";

import { useEffect, useState } from "react";

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setProgress((window.scrollY / totalHeight) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className="reading-progress-bar" 
      style={{ 
        width: `${progress}%`,
        position: "fixed",
        top: 0,
        left: 0,
        height: "3px",
        backgroundColor: "var(--red)",
        zIndex: 9999,
        transition: "width 0.1s ease-out"
      }} 
    />
  );
}
