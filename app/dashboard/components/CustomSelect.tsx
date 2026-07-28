"use client";

import React, { useState, useRef, useEffect, useId, useCallback } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  className?: string;
  /** "sm" = compact inline table use, "md" = default form use */
  size?: "sm" | "md";
  disabled?: boolean;
  align?: "left" | "right";
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  id,
  className = "",
  size = "md",
  disabled = false,
  align = "left",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const uid = useId();

  const selectedLabel =
    options.find((o) => o.value.toLowerCase() === value?.toLowerCase())?.label ?? placeholder;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reset focused index when menu opens
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value.toLowerCase() === value?.toLowerCase());
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [open, value, options]);

  // Scroll focused item into view
  useEffect(() => {
    if (!open || focusedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[focusedIndex] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex, open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (open && focusedIndex >= 0) {
            onChange(options[focusedIndex].value);
            setOpen(false);
            setFocusedIndex(-1);
          } else {
            setOpen(true);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (!open) {
            setOpen(true);
          } else {
            setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Escape":
          setOpen(false);
          setFocusedIndex(-1);
          break;
        case "Tab":
          setOpen(false);
          break;
      }
    },
    [open, focusedIndex, options, onChange, disabled]
  );

  const isSm = size === "sm";

  return (
    <div
      ref={containerRef}
      className={`cs-root ${className}`}
      id={id ?? uid}
      data-open={open}
      data-disabled={disabled}
    >
      {/* Trigger button */}
      <button
        type="button"
        className={`cs-trigger ${isSm ? "cs-trigger-sm" : "cs-trigger-md"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
      >
        <span className="cs-value">{selectedLabel}</span>
        <svg
          className={`cs-chevron ${open ? "cs-chevron-open" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className={`cs-panel ${isSm ? "cs-panel-sm" : "cs-panel-md"} ${align === "right" ? "cs-panel-right" : ""}`}>
          <ul
            ref={listRef}
            role="listbox"
            className="cs-list"
            aria-label="Options"
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value.toLowerCase() === value?.toLowerCase();
              const isFocused = idx === focusedIndex;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`cs-option ${isSelected ? "cs-option-selected" : ""} ${isFocused ? "cs-option-focused" : ""}`}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opt.value);
                    setOpen(false);
                    setFocusedIndex(-1);
                  }}
                >
                  <span className="cs-option-label">{opt.label}</span>
                  {isSelected && (
                    <svg
                      className="cs-check"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
