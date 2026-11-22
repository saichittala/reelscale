"use client";

import React, { forwardRef } from "react";
import {
  DatePicker as ArcDatePicker,
  type DatePickerProps as ArcDatePickerProps,
} from "@/components/arc/date-picker/date-picker";

export interface DatePickerProps
  extends Omit<ArcDatePickerProps, "value" | "onChange" | "label"> {
  label?: string;
  value?: string | Date | null;
  onChange?: (e: any) => void;
  onDateChange?: (date: Date | undefined) => void;
  name?: string;
  size?: "sm" | "md" | "lg";
}

function parseLocalDate(str?: string | Date | null): Date | undefined {
  if (!str) return undefined;
  if (str instanceof Date) return isNaN(str.getTime()) ? undefined : str;
  if (typeof str !== "string") return undefined;
  
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return new Date(year, month, day);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
}

function formatDateToIso(date?: Date): string {
  if (!date || isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  function DatePicker(
    {
      label = "",
      value,
      onChange,
      onDateChange,
      name,
      placeholder = "Pick a date",
      showToday = true,
      className,
      ...props
    },
    ref
  ) {
    const parsedDate = parseLocalDate(value);

    const handleDateChange = (newDate: Date | undefined) => {
      const isoStr = formatDateToIso(newDate);
      onDateChange?.(newDate);

      if (onChange) {
        // Dispatch synthetic event for seamless React form & state handler compatibility
        const syntheticEvent = {
          target: { value: isoStr, name },
          currentTarget: { value: isoStr, name },
          preventDefault: () => {},
          stopPropagation: () => {},
        };

        try {
          onChange(syntheticEvent);
        } catch {
          try {
            onChange(isoStr);
          } catch {
            onChange(newDate);
          }
        }
      }
    };

    return (
      <div
        ref={ref}
        className={className}
        style={{ width: "100%", position: "relative" }}
      >
        <ArcDatePicker
          label={label}
          value={parsedDate}
          onChange={handleDateChange}
          placeholder={placeholder}
          showToday={showToday}
          {...(props as any)}
        />
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export default DatePicker;
