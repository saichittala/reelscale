"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const morphTime = 1.2;
const cooldownTime = 0.4;

export interface MorphingTextProps {
  className?: string;
  style?: React.CSSProperties;
  texts?: string[];
  text?: string;
}

export const SvgFilters: React.FC = () => (
  <svg
    id="morphing-filters"
    className="fixed pointer-events-none"
    style={{ position: "fixed", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
    aria-hidden="true"
  >
    <defs>
      <filter id="threshold">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 255 -140"
        />
      </filter>
    </defs>
  </svg>
);

export const MorphingText: React.FC<MorphingTextProps> = ({
  texts,
  text,
  className,
  style,
}) => {
  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);
  const prevTextRef = useRef<string | undefined>(text);

  const setStyles = useCallback((fraction: number, t1: string, t2: string) => {
    const [c1, c2] = [text1Ref.current, text2Ref.current];
    if (!c1 || !c2) return;

    c2.style.filter = `blur(${Math.min(8 / Math.max(fraction, 0.001) - 8, 100)}px)`;
    c2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

    const inverted = 1 - fraction;
    c1.style.filter = `blur(${Math.min(8 / Math.max(inverted, 0.001) - 8, 100)}px)`;
    c1.style.opacity = `${Math.pow(inverted, 0.4) * 100}%`;

    c1.textContent = t1;
    c2.textContent = t2;
  }, []);

  // Mode 1: Reactive change when `text` changes
  useEffect(() => {
    if (text === undefined) return;
    if (prevTextRef.current === undefined) {
      prevTextRef.current = text;
      if (text1Ref.current) text1Ref.current.textContent = text;
      return;
    }
    if (prevTextRef.current === text) return;

    const fromText = prevTextRef.current;
    const toText = text;
    prevTextRef.current = text;

    let animId: number;
    let startTime: number | null = null;
    const duration = 550; // ms

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const fraction = Math.min(elapsed / duration, 1);

      setStyles(fraction, fromText, toText);

      if (fraction < 1) {
        animId = requestAnimationFrame(step);
      } else {
        const [c1, c2] = [text1Ref.current, text2Ref.current];
        if (c1 && c2) {
          c1.textContent = toText;
          c1.style.filter = "none";
          c1.style.opacity = "100%";
          c2.textContent = "";
          c2.style.filter = "none";
          c2.style.opacity = "0%";
        }
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [text, setStyles]);

  // Mode 2: Auto-cycling array of `texts`
  useEffect(() => {
    if (text !== undefined || !texts || texts.length <= 1) return;

    let animId: number;
    let textIndex = 0;
    let morph = 0;
    let cooldown = cooldownTime;
    let lastTime = new Date();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = new Date();
      const dt = (now.getTime() - lastTime.getTime()) / 1000;
      lastTime = now;

      cooldown -= dt;
      if (cooldown <= 0) {
        morph -= cooldown;
        cooldown = 0;
        let fraction = morph / morphTime;
        if (fraction > 1) {
          cooldown = cooldownTime;
          fraction = 1;
        }
        setStyles(fraction, texts[textIndex % texts.length]!, texts[(textIndex + 1) % texts.length]!);
        if (fraction === 1) textIndex++;
      } else {
        morph = 0;
        const [c1, c2] = [text1Ref.current, text2Ref.current];
        if (c1 && c2) {
          c2.style.filter = "none";
          c2.style.opacity = "100%";
          c1.style.filter = "none";
          c1.style.opacity = "0%";
        }
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [text, texts, setStyles]);

  const initialText = text ?? (texts && texts[0]) ?? "";

  return (
    <span
      className={cn(
        "morphing-text-container relative inline-block align-baseline",
        className
      )}
      style={{
        filter: "url(#threshold) blur(0.5px)",
        WebkitFilter: "url(#threshold) blur(0.5px)",
        ...style,
      }}
    >
      <span
        ref={text1Ref}
        className="inline-block"
      >
        {initialText}
      </span>
      <span
        ref={text2Ref}
        aria-hidden="true"
        className="absolute inset-0 m-auto inline-block pointer-events-none"
        style={{ opacity: 0 }}
      />
      <SvgFilters />
    </span>
  );
};
