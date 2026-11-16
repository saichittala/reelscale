"use client";

import React, { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import styles from "./textarea.module.css";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, description, error, id, className, ...props }, ref) {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    const hintId = description ? `${controlId}-description` : undefined;
    const errorId = error ? `${controlId}-error` : undefined;
    const describedBy =
      [props["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") ||
      undefined;

    return (
      <div className={styles.field}>
        {label ? (
          <label className={styles.label} htmlFor={controlId}>
            {label}
          </label>
        ) : null}
        <textarea
          {...props}
          id={controlId}
          ref={ref}
          className={[styles.textarea, className].filter(Boolean).join(" ")}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={describedBy}
        />
        {description ? (
          <span id={hintId} className={styles.description}>
            {description}
          </span>
        ) : null}
        {error ? (
          <span id={errorId} className={styles.error} role="alert">
            {error}
          </span>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
