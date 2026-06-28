"use client";

import { useState } from "react";
import { BlogFAQ } from "../../lib/blog";

interface FAQSectionProps {
  faq: BlogFAQ[];
}

export default function FAQSection({ faq }: FAQSectionProps) {
  if (!faq || faq.length === 0) return null;

  return (
    <section className="blog-faq-section" style={{ marginTop: "60px" }}>
      <h3 className="blog-faq-title" style={{ fontSize: "var(--text-xl)", fontWeight: "var(--fw-semibold)", color: "var(--white)", marginBottom: "16px" }}>Frequently asked questions</h3>
      <div className="faq-list" style={{ marginTop: "24px" }}>
        {faq.map((item, index) => (
          <FAQItem key={index} item={item} />
        ))}
      </div>
    </section>
  );
}

function FAQItem({ item }: { item: BlogFAQ }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-item ${isOpen ? "active" : ""}`}>
      <button 
        className="faq-question" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{item.question}</span>
        <svg 
          className="faq-chevron" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div 
        className="faq-answer" 
        style={{ 
          maxHeight: isOpen ? "1000px" : "0px",
          transition: "max-height 0.3s cubic-bezier(0.22, 1, 0.36, 1)"
        }}
      >
        <div className="faq-answer-content">
          <p>{item.answer}</p>
        </div>
      </div>
    </div>
  );
}
