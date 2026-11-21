"use client";

import { Fragment, useEffect, useRef, useState, useMemo } from "react";
import type { CSSProperties, FocusEvent, ReactNode } from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown, Check } from "lucide-react";
import { motionTokens } from "../lib/motion-tokens";
import styles from "./dropdown-menu.module.css";

export interface DropdownItem {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  destructive?: boolean;
  separatorBefore?: boolean;
}

export interface DropdownMenuProps {
  label: string;
  items: DropdownItem[];
  icon?: ReactNode;
  align?: "start" | "end" | "center";
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
}

type Highlight = { top: number; height: number; danger: boolean; glide: boolean };

export function DropdownMenu({
  label,
  items,
  icon,
  align = "end",
  size = "sm",
  fullWidth = false,
  className = "",
  disabled = false,
}: DropdownMenuProps) {
  const reduced = useReducedMotion();
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const pointer = useRef(false);
  const clearTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(clearTimer.current), []);

  function onMenuFocus(event: FocusEvent<HTMLDivElement>) {
    const item =
      event.target instanceof HTMLElement
        ? event.target.closest<HTMLElement>('[role="menuitem"]')
        : null;
    window.clearTimeout(clearTimer.current);
    if (!item) {
      clearTimer.current = window.setTimeout(
        () => setHighlight(null),
        pointer.current ? 70 : 0
      );
      return;
    }
    const next = {
      top: item.offsetTop,
      height: item.offsetHeight,
      danger: item.dataset.tone === "danger",
    };
    const glide = pointer.current;
    setHighlight((current) => ({ ...next, glide: glide && current !== null }));
  }

  const triggerClasses = [
    styles.trigger,
    size === "md" ? styles.triggerMd : styles.triggerSm,
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DropdownPrimitive.Root
      onOpenChange={(open) => {
        if (open) {
          window.clearTimeout(clearTimer.current);
          setHighlight(null);
        }
      }}
    >
      <DropdownPrimitive.Trigger className={triggerClasses} type="button" disabled={disabled}>
        {icon && (
          <span className={styles.triggerIcon} aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={styles.label}>
          <span className={styles.labelText}>{label}</span>
        </span>
        <ChevronDown className={styles.chevron} size={14} strokeWidth={2} aria-hidden="true" />
      </DropdownPrimitive.Trigger>

      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          className={[styles.menu, fullWidth ? styles.matchTrigger : ""].filter(Boolean).join(" ")}
          sideOffset={6}
          align={align}
          collisionPadding={12}
          loop
          onFocus={onMenuFocus}
          onPointerMoveCapture={() => {
            pointer.current = true;
          }}
          onKeyDownCapture={() => {
            pointer.current = false;
          }}
        >
          <motion.span
            className={styles.highlight}
            data-tone={highlight?.danger ? "danger" : undefined}
            aria-hidden="true"
            initial={false}
            animate={
              highlight
                ? { y: highlight.top, height: highlight.height, opacity: 1 }
                : { opacity: 0 }
            }
            transition={{
              default:
                highlight?.glide && !reduced
                  ? motionTokens.spring.morph
                  : { duration: 0 },
              opacity: { duration: reduced ? 0 : motionTokens.duration.instant },
            }}
          />
          {items.map((item, index) => (
            <Fragment key={item.label}>
              {item.separatorBefore && <DropdownPrimitive.Separator className={styles.separator} />}
              <DropdownPrimitive.Item
                className={[styles.item, item.destructive ? styles.destructive : ""]
                  .filter(Boolean)
                  .join(" ")}
                data-tone={item.destructive ? "danger" : undefined}
                style={{ "--i": index } as CSSProperties}
                disabled={item.disabled}
                onSelect={item.onSelect}
              >
                {item.icon && (
                  <span className={styles.icon} aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className={styles.itemText}>{item.label}</span>
              </DropdownPrimitive.Item>
            </Fragment>
          ))}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}

// ============================================================
// SELECT / COMMON DROPDOWN (For dashboard forms & tables)
// ============================================================

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  id?: string;
  className?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  align?: "start" | "end" | "center" | "left" | "right";
  fullWidth?: boolean;
  icon?: ReactNode;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  id,
  className = "",
  size = "md",
  disabled = false,
  align = "start",
  fullWidth = false,
  icon,
}: SelectProps) {
  const reduced = useReducedMotion();
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const pointer = useRef(false);
  const clearTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(clearTimer.current), []);

  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) =>
      typeof opt === "string" ? { value: opt, label: opt } : opt
    );
  }, [options]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find(
      (o) => String(o.value).toLowerCase() === String(value ?? "").toLowerCase()
    );
  }, [normalizedOptions, value]);

  const currentLabel = selectedOption?.label ?? (value ? String(value) : placeholder);

  function onMenuFocus(event: FocusEvent<HTMLDivElement>) {
    const item =
      event.target instanceof HTMLElement
        ? event.target.closest<HTMLElement>('[role="menuitem"]')
        : null;
    window.clearTimeout(clearTimer.current);
    if (!item) {
      clearTimer.current = window.setTimeout(
        () => setHighlight(null),
        pointer.current ? 70 : 0
      );
      return;
    }
    const next = {
      top: item.offsetTop,
      height: item.offsetHeight,
      danger: false,
    };
    const glide = pointer.current;
    setHighlight((current) => ({ ...next, glide: glide && current !== null }));
  }

  // Map legacy align strings
  const radixAlign: "start" | "end" | "center" =
    align === "right" ? "end" : align === "left" ? "start" : align;

  const triggerClasses = [
    styles.trigger,
    size === "md" ? styles.triggerMd : styles.triggerSm,
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DropdownPrimitive.Root
      onOpenChange={(open) => {
        if (open) {
          window.clearTimeout(clearTimer.current);
          setHighlight(null);
        }
      }}
    >
      <DropdownPrimitive.Trigger
        id={id}
        className={triggerClasses}
        type="button"
        disabled={disabled}
      >
        {icon && (
          <span className={styles.triggerIcon} aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={styles.label}>
          <span className={styles.labelText}>{currentLabel}</span>
        </span>
        <ChevronDown className={styles.chevron} size={14} strokeWidth={2} aria-hidden="true" />
      </DropdownPrimitive.Trigger>

      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          className={[styles.menu, fullWidth ? styles.matchTrigger : ""].filter(Boolean).join(" ")}
          sideOffset={6}
          align={radixAlign}
          collisionPadding={12}
          loop
          onFocus={onMenuFocus}
          onPointerMoveCapture={() => {
            pointer.current = true;
          }}
          onKeyDownCapture={() => {
            pointer.current = false;
          }}
        >
          <motion.span
            className={styles.highlight}
            aria-hidden="true"
            initial={false}
            animate={
              highlight
                ? { y: highlight.top, height: highlight.height, opacity: 1 }
                : { opacity: 0 }
            }
            transition={{
              default:
                highlight?.glide && !reduced
                  ? motionTokens.spring.morph
                  : { duration: 0 },
              opacity: { duration: reduced ? 0 : motionTokens.duration.instant },
            }}
          />
          {normalizedOptions.map((opt, index) => {
            const isSelected =
              String(opt.value).toLowerCase() === String(value ?? "").toLowerCase();
            return (
              <DropdownPrimitive.Item
                key={opt.value}
                className={[styles.item, isSelected ? styles.selectedItem : ""]
                  .filter(Boolean)
                  .join(" ")}
                style={{ "--i": index } as CSSProperties}
                disabled={opt.disabled}
                onSelect={() => onChange(opt.value)}
              >
                {opt.icon && (
                  <span className={styles.icon} aria-hidden="true">
                    {opt.icon}
                  </span>
                )}
                <span className={styles.itemText}>{opt.label}</span>
                {isSelected && (
                  <span className={styles.checkIcon} aria-hidden="true">
                    <Check size={14} strokeWidth={2.5} />
                  </span>
                )}
              </DropdownPrimitive.Item>
            );
          })}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}

export default DropdownMenu;
