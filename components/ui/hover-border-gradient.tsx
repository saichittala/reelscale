"use client";

import React, { useState, useEffect, forwardRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import styles from "./hover-border-gradient.module.css";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

export type HoverBorderGradientSize = "sm" | "md" | "lg" | "icon";

export interface HoverBorderGradientProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
  as?: React.ElementType;
  containerClassName?: string;
  className?: string;
  duration?: number;
  clockwise?: boolean;
  size?: HoverBorderGradientSize;
  pill?: boolean;
  loading?: boolean;
  containerStyle?: React.CSSProperties;
  href?: string;
  target?: string;
  rel?: string;
  download?: boolean | string;
}

export const HoverBorderGradient = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  HoverBorderGradientProps
>(function HoverBorderGradient(
  {
    children,
    containerClassName,
    className,
    as: Tag = "button",
    duration = 1.2,
    clockwise = true,
    size = "md",
    pill = true,
    loading = false,
    disabled = false,
    containerStyle,
    style,
    onClick,
    href,
    target,
    rel,
    download,
    type = "button",
    ...props
  },
  ref
) {
  const [hovered, setHovered] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>("TOP");
  const reduceMotion = useReducedMotion() ?? false;

  const rotateDirection = (currentDirection: Direction): Direction => {
    const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
    const currentIndex = directions.indexOf(currentDirection);
    // Clockwise order: TOP (0) -> RIGHT (3) -> BOTTOM (2) -> LEFT (1) -> TOP (0)
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length;
    return directions[nextIndex];
  };

  // ReelScale AI Color Spectrum:
  // --color-1: #e11d48 (Rose/Red)
  // --color-2: #a855f7 (Vibrant Purple)
  // --color-3: #3b82f6 (Electric Blue)
  // --color-4: #06b6d4 (Cyan)
  // --color-5: #22c55e (Emerald Green)
  const movingMap: Record<Direction, string> = {
    TOP: "radial-gradient(28% 54% at 50% 0%, rgba(168, 85, 247, 1) 0%, rgba(59, 130, 246, 0.7) 45%, rgba(168, 85, 247, 0) 100%)",
    RIGHT: "radial-gradient(20% 48% at 100% 50%, rgba(59, 130, 246, 1) 0%, rgba(6, 182, 212, 0.7) 45%, rgba(59, 130, 246, 0) 100%)",
    BOTTOM: "radial-gradient(28% 54% at 50% 100%, rgba(6, 182, 212, 1) 0%, rgba(34, 197, 94, 0.7) 45%, rgba(6, 182, 212, 0) 100%)",
    LEFT: "radial-gradient(20% 48% at 0% 50%, rgba(225, 29, 72, 1) 0%, rgba(168, 85, 247, 0.7) 45%, rgba(225, 29, 72, 0) 100%)",
  };

  const highlight =
    "radial-gradient(85% 185% at 50% 50%, rgba(168, 85, 247, 0.95) 0%, rgba(59, 130, 246, 0.75) 35%, rgba(6, 182, 212, 0.5) 65%, rgba(225, 29, 72, 0) 100%)";

  useEffect(() => {
    if (!hovered && !reduceMotion && !disabled && !loading) {
      const interval = setInterval(() => {
        setDirection((prevState) => rotateDirection(prevState));
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [hovered, duration, clockwise, reduceMotion, disabled, loading]);

  const isFullWidth =
    style?.width === "100%" ||
    containerStyle?.width === "100%" ||
    (containerClassName && containerClassName.includes("w-full"));

  const containerClasses = cn(
    styles.container,
    styles[size],
    pill && styles.pill,
    isFullWidth && styles.fullWidth,
    containerClassName
  );

  const contentClasses = cn(styles.content, className);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    (onClick as any)?.(e);
  };

  const innerContent = (
    <>
      <div className={contentClasses} style={style}>
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        {children}
      </div>

      {/* Moving Aceternity animated gradient border */}
      <motion.div
        className={styles.gradientLayer}
        initial={{ background: movingMap[direction] }}
        animate={{
          background:
            hovered && !disabled && !loading
              ? [movingMap[direction], highlight]
              : movingMap[direction],
        }}
        transition={{
          ease: "linear",
          duration: reduceMotion ? 0 : duration ?? 1.2,
        }}
      />

      {/* Ambient soft glow halo on hover */}
      <div className={styles.ambientGlow} />

      {/* Center backdrop mask to reveal only the glowing 1.5px border */}
      <div className={styles.mask} />
    </>
  );

  // External / Next.js Link handling if href is provided
  if (href) {
    const isExternal =
      href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
    const linkProps = {
      className: containerClasses,
      style: { ...containerStyle, ...style },
      onMouseEnter: () => !disabled && !loading && setHovered(true),
      onMouseLeave: () => setHovered(false),
      onClick: handleClick,
      "aria-disabled": disabled || loading ? true : undefined,
      "data-loading": loading ? "true" : undefined,
    };

    if (isExternal) {
      return (
        <a
          href={href}
          target={target || "_blank"}
          rel={rel || "noopener noreferrer"}
          download={download}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...linkProps}
        >
          {innerContent}
        </a>
      );
    }

    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        download={download}
        ref={ref as React.Ref<HTMLAnchorElement>}
        {...linkProps}
      >
        {innerContent}
      </Link>
    );
  }

  const Component = Tag;

  return (
    <Component
      ref={ref}
      type={Tag === "button" ? type : undefined}
      disabled={disabled || loading}
      aria-busy={loading ? "true" : undefined}
      aria-disabled={disabled || loading ? "true" : undefined}
      data-loading={loading ? "true" : undefined}
      onMouseEnter={() => !disabled && !loading && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      className={containerClasses}
      style={{ ...containerStyle, ...(isFullWidth ? { width: "100%" } : {}) }}
      {...props}
    >
      {innerContent}
    </Component>
  );
});

HoverBorderGradient.displayName = "HoverBorderGradient";

export default HoverBorderGradient;
