"use client";

import React, { forwardRef } from "react";
import {
  HoverBorderGradient,
  type HoverBorderGradientProps,
} from "./hover-border-gradient";

export interface RainbowButtonProps extends HoverBorderGradientProps {
  variant?: "default" | "outline";
}

export const RainbowButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, RainbowButtonProps>(
  function RainbowButton({ variant, className, ...props }, ref) {
    return (
      <HoverBorderGradient
        ref={ref}
        className={className}
        {...props}
      />
    );
  }
);

RainbowButton.displayName = "RainbowButton";

export default RainbowButton;
