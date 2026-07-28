import React from "react";

interface SortIconProps {
  active: boolean;
  dir: -1 | 1;
}

export function SortIcon({ active, dir }: SortIconProps) {
  if (!active) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sort-icon"
      >
        <path d="m7 10 5-5 5 5" />
        <path d="m7 14 5 5 5-5" />
      </svg>
    );
  }
  return dir === 1 ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="sort-icon sort-icon-active"
    >
      <path d="m7 14 5-5 5 5" />
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="sort-icon sort-icon-active"
    >
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}
export default SortIcon;
