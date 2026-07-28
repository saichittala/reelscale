import React from "react";

interface SortIconProps {
  active: boolean;
  dir: -1 | 1;
}

export function SortIcon({ active, dir }: SortIconProps) {
  if (!active) {
    return (
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.35, flexShrink: 0, marginLeft: "8px" }}
      >
        <path d="m7 10 5-5 5 5" />
        <path d="m7 14 5 5 5-5" />
      </svg>
    );
  }
  return dir === 1 ? (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--white)", flexShrink: 0, marginLeft: "8px" }}
    >
      <path d="m7 14 5-5 5 5" />
    </svg>
  ) : (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--white)", flexShrink: 0, marginLeft: "8px" }}
    >
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}
export default SortIcon;
