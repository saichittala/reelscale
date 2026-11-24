"use client";

import React, { forwardRef } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import styles from "./rainbow-button.module.css";

export interface RainbowButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: "default" | "outline";
}

export const RainbowButton = forwardRef<HTMLButtonElement, RainbowButtonProps>(
  function RainbowButton({ variant = "outline", className, ...props }, ref) {
    return (
      <Button
        variant="ai"
        className={[
          variant === "outline" ? styles.outline : styles.default,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        ref={ref}
        {...props}
      />
    );
  }
);

RainbowButton.displayName = "RainbowButton";

export default RainbowButton;
