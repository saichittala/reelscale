"use client";

import React, { forwardRef } from "react";
import Link from "next/link";
import {
  Button as ArcButton,
  type ButtonProps as ArcButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "@/components/arc/button/button";
import { HoverBorderGradient } from "./hover-border-gradient";

export interface ButtonProps extends Omit<ArcButtonProps, "ref"> {
  href?: string;
  target?: string;
  rel?: string;
  download?: boolean | string;
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button({ href, target, rel, download, variant = "primary", ...props }, ref) {
    // Aceternity Hover Border Gradient for all AI buttons
    if (variant === "ai") {
      return (
        <HoverBorderGradient
          ref={ref as any}
          href={href}
          target={target}
          rel={rel}
          download={download}
          size={props.size}
          pill={props.pill ?? true}
          loading={props.loading}
          disabled={props.disabled}
          onClick={props.onClick as any}
          className={props.className}
          style={props.style}
          title={props.title}
          type={props.type as any}
          {...(props as any)}
        >
          {props.children}
        </HoverBorderGradient>
      );
    }

    if (href) {
      const isExternal = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
      
      // If href is passed, render a link wrapped with same visual button styling
      const buttonContent = (
        <ArcButton
          variant={variant}
          {...(props as ArcButtonProps)}
          ref={ref as React.Ref<HTMLButtonElement>}
          type={undefined}
        />
      );

      if (isExternal) {
        return (
          <a
            href={href}
            target={target || "_blank"}
            rel={rel || "noopener noreferrer"}
            download={download}
            style={{ display: "inline-contents", textDecoration: "none" }}
          >
            {buttonContent}
          </a>
        );
      }

      return (
        <Link
          href={href}
          target={target}
          rel={rel}
          download={download}
          style={{ display: "inline-contents", textDecoration: "none" }}
        >
          {buttonContent}
        </Link>
      );
    }

    return (
      <ArcButton
        variant={variant}
        {...(props as ArcButtonProps)}
        ref={ref as React.Ref<HTMLButtonElement>}
      />
    );
  }
);

Button.displayName = "Button";

export type { ButtonVariant, ButtonSize };
export default Button;
