"use client";

import { useState, useRef, useEffect } from "react";
import { BlogFAQ } from "../../lib/blog";

interface FAQSectionProps {
  faq: BlogFAQ[];
}

export default function FAQSection({ faq }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faq || faq.length === 0) return null;

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="blog-faq-section">
      <h3 className="blog-faq-title">Frequently asked questions</h3>
      <div className="faq-list blog-faq-list">
        {faq.map((item, index) => (
          <FAQItem
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>
    </section>
  );
}

function FAQItem({
  item,
  isOpen,
  onToggle,
}: {
  item: BlogFAQ;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const answerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string>("0px");

  useEffect(() => {
    if (isOpen && answerRef.current) {
      setHeight(`${answerRef.current.scrollHeight}px`);
    } else {
      setHeight("0px");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (isOpen && answerRef.current) {
        setHeight(`${answerRef.current.scrollHeight}px`);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  return (
    <div className={`faq-item ${isOpen ? "active" : ""}`}>
      <button
        className="faq-question"
        onClick={onToggle}
        aria-expanded={isOpen}
        type="button"
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
        style={{ maxHeight: height }}
      >
        <div className="faq-answer-content" ref={answerRef}>
          <p>{item.answer}</p>
        </div>
      </div>
    </div>
  );
}
