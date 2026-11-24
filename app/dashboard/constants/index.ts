/**
 * Centralised Dashboard Constants & Configuration
 * Single source of truth for plans, storage keys, API routes, and options.
 */

// ─── LOCAL STORAGE KEYS ───
export const STORAGE_KEYS = {
  AUTH: "reelscale_auth",
  USER: "reelscale_user",
  CURRENT_PAGE: "reelscale_current_page",
  CLIENTS_CACHE: "clients_cache",
  USERS_CACHE: "users_cache",
  SALES_CACHE: "sales_cache",
  DELIVERIES_CACHE: "reelscale_deliveries_cache",
  CLIENT_DATES: "reelscale_client_dates",
  CLIENT_STATUSES: "reelscale_client_statuses",
  SIDEBAR_COLLAPSED: "sidebarCollapsed",
  THEME: "theme",
  LAST_ACTIVITY: "reelscale_last_activity",
  SESSION_EXPIRED: "reelscale_session_expired",
} as const;

// ─── API ROUTES ───
export const API_ROUTES = {
  USERS: "/api/users",
  AUTH: "/api/auth",
  CLIENTS: "/api/clients",
  SALES: "/api/sales",
  DELIVERIES: "/api/deliveries",
  BLOGS: "/api/blogs",
  SYSTEM_STATUS: "/api/system-status",
  UPLOAD: "/api/upload",
  AI_IMAGES: "/api/ai/images",
  AI_GENERATE: "/api/ai/generate",
  AI_JOBS: "/api/ai/jobs",
  AI_TOPICS: "/api/ai/topics",
  AI_BUFFER: "/api/ai/buffer",
  REVALIDATE: "/api/revalidate",
} as const;

// ─── STANDARD PRICING PLANS ───
export interface PlanConfig {
  price: number;
  reels: number;
  label?: string;
}

export const STANDARD_PLANS: Record<string, PlanConfig> = {
  "Presence (Growth)": { price: 14999, reels: 4, label: "Presence (Growth)" },
  "Growth (Growth)": { price: 24999, reels: 6, label: "Growth (Growth)" },
  "Scale (Growth)": { price: 34999, reels: 10, label: "Scale (Growth)" },
  "Starter (Prod)": { price: 11499, reels: 5, label: "Starter (Prod)" },
  "Standard (Prod)": { price: 19999, reels: 10, label: "Standard (Prod)" },
  "Growth (Prod)": { price: 24999, reels: 15, label: "Growth (Prod)" },
};

// ─── STATUS OPTIONS ───
export const CLIENT_STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Paused", label: "Paused" },
  { value: "Churned", label: "Churned" },
] as const;

export const PLAN_OPTIONS = [
  { value: "Custom", label: "Custom Plan" },
  ...Object.keys(STANDARD_PLANS).map((p) => ({ value: p, label: p })),
] as const;

export const USER_ROLES = {
  ADMIN: "admin",
  SALES: "sales",
  BLOGGER: "blogger",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
