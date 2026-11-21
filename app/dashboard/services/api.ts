import { User, Client, Lead, Blog, DeliveredReel } from "../types";
import { client } from "../../sanity/client";
import {
  syncBlogToSanity,
  deleteBlogFromSanity,
  sanityDocToBlog,
} from "../../sanity/blog-sync";

export const GAS_USERS_URL =
  "https://script.google.com/macros/s/AKfycbx4ZaU3l-XsieGxzfGg26XRSFb5TmxL3anOxrLHmpXcufsk3O8zMGWZkj-u0VWdPULG/exec";
export const GAS_CLIENTS_URL =
  "https://script.google.com/macros/s/AKfycbwjmC5mDKejUEDSuXsf_7IlhEznHR7vA9pvu1O16DOS8J2Nn6bXNEv_w3xaOuRFAXZS/exec";
export const GAS_SALES_URL =
  "https://script.google.com/macros/s/AKfycbyofRzBP8UpOX5Nt-l8C6Mj5rw5dHQH8YAt5sBPiltzyfndAiEKZh_4xyVhsV11lBb0/exec";
export const GAS_BLOGS_URL =
  process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_BLOGS_URL || "";

const useLocalAPI = process.env.NEXT_PUBLIC_STATIC_EXPORT !== "true";

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("reelscale_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

export async function customFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let targetUrl = url;
  const updatedOptions = { ...options };

  if (useLocalAPI) {
    if (url === GAS_USERS_URL) {
      if (options.body && typeof options.body === "string") {
        try {
          const bodyObj = JSON.parse(options.body);
          if (bodyObj.action === "login") {
            targetUrl = "/api/auth";
            updatedOptions.body = JSON.stringify({
              email: bodyObj.email,
              password: bodyObj.password,
            });
          } else {
            targetUrl = "/api/users";
          }
        } catch (e) {
          targetUrl = "/api/users";
        }
      } else {
        targetUrl = "/api/users";
      }
    } else if (url === GAS_CLIENTS_URL) {
      targetUrl = "/api/clients";
    } else if (url === GAS_SALES_URL) {
      targetUrl = "/api/sales";
    } else if (
      (GAS_BLOGS_URL && url === GAS_BLOGS_URL) ||
      url === "/api/blogs"
    ) {
      targetUrl = "/api/blogs";
    }
  }

  const user = getCurrentUser();

  if (useLocalAPI) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (user) {
      headers["x-user-role"] = user.role;
      headers["x-user-email"] = user.email;
    }
    updatedOptions.headers = headers;
  } else {
    if (options.body) {
      updatedOptions.headers = {
        "Content-Type": "text/plain",
      };
    } else {
      if (updatedOptions.headers) {
        delete (updatedOptions as any).headers;
      }
    }
  }

  return fetch(targetUrl, updatedOptions);
}

// ==============================
// USER API SERVICES
// ==============================
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const response = await customFetch(GAS_USERS_URL, {
      method: "POST",
      body: JSON.stringify({ action: "login", email, password }),
    });
    const data = await response.json();
    if (data.success) {
      if (typeof window !== "undefined") {
        localStorage.setItem("reelscale_auth", "1");
        localStorage.setItem("reelscale_user", JSON.stringify(data.user));
      }
      return { success: true, user: data.user };
    }
    return { success: false, message: data.message || "Invalid credentials" };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, message: error.message || "Failed to log in" };
  }
}

export async function fetchUsers(): Promise<User[]> {
  try {
    const response = await customFetch(GAS_USERS_URL);
    const data = await response.json();
    if (data.success) {
      return data.users || [];
    }
    return [];
  } catch (error) {
    console.error("Users Load Error:", error);
    return [];
  }
}

export async function apiAddUser(user: Omit<User, "id">): Promise<any> {
  const response = await customFetch(GAS_USERS_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "add",
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Add failed");
  }
  return result;
}

export async function apiUpdateUser(
  id: string | number,
  user: User
): Promise<void> {
  const response = await customFetch(GAS_USERS_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "update",
      id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Update failed");
  }
}

export async function apiDeleteUser(id: string | number): Promise<void> {
  const response = await customFetch(GAS_USERS_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      id,
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Delete failed");
  }
}

// ==============================
// CLIENT API SERVICES
// ==============================
export async function fetchClients(): Promise<Client[]> {
  const response = await customFetch(GAS_CLIENTS_URL);
  const data = await response.json();
  const list = data.clients || data || [];

  // Read local dates and statuses dictionary
  let localDates: Record<string, string> = {};
  let localStatuses: Record<string, string> = {};
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("reelscale_client_dates");
      if (stored) localDates = JSON.parse(stored);
      const storedStatus = localStorage.getItem("reelscale_client_statuses");
      if (storedStatus) localStatuses = JSON.parse(storedStatus);
    } catch (e) {
      console.warn("Error reading local client cache", e);
    }
  }

  const DEFAULT_CLIENT_DATES: Record<number | string, string> = {
    1: "2026-06-15",
    2: "2026-07-10",
    3: "2026-07-20",
    4: "2026-08-01",
    6: "2026-08-05",
    7: "2026-08-10",
    8: "2026-08-14"
  };

  if (Array.isArray(list)) {
    return list.map((row: any) => {
      const rowId = String(row.id);
      return {
        id: row.id,
        name: row.clientName || row.name || "",
        business: row.business || "",
        phone: row.phone || "",
        instagram: row.instagram || "",
        reels: Number(row.reels || 0),
        ppr: Number(row.pricePerReel || row.ppr || 0),
        image: row.image || "",
        billingModel: row.billingModel || "Subscription",
        plan: row.plan || "",
        baseRate: Number(row.baseRate || 0),
        bargain: Number(row.bargain || 0),
        revenue: Number(row.revenue || 0),
        date: row.date || row.createdDate || localDates[rowId] || DEFAULT_CLIENT_DATES[rowId] || "2026-08-14",
        status: row.status || localStatuses[rowId] || "Active",
        startDate: row.startDate || row.date || localDates[rowId] || DEFAULT_CLIENT_DATES[rowId] || "2026-08-14",
        endDate: row.endDate || "",
      };
    });
  }
  return [];
}

export async function apiAddClient(
  client: Omit<Client, "id">
): Promise<any> {
  const response = await customFetch(GAS_CLIENTS_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "add",
      clientName: client.name,
      name: client.name,
      business: client.business,
      phone: client.phone,
      instagram: client.instagram,
      reels: Number(client.reels),
      pricePerReel: Number(client.ppr),
      revenue: Number(client.revenue !== undefined ? client.revenue : (Number(client.reels || 0) * Number(client.ppr || 0))),
      image: client.image || "",
      billingModel: client.billingModel || "Subscription",
      plan: client.plan || "",
      baseRate: Number(client.baseRate || 0),
      bargain: Number(client.bargain || 0),
      date: client.date || "",
      status: client.status || "Active",
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Add client failed");
  }

  const newId = result.id || (result.client && result.client.id);
  if (newId && typeof window !== "undefined") {
    try {
      if (client.date) {
        const stored = localStorage.getItem("reelscale_client_dates");
        const localDates = stored ? JSON.parse(stored) : {};
        localDates[String(newId)] = client.date;
        localStorage.setItem("reelscale_client_dates", JSON.stringify(localDates));
      }
      if (client.status) {
        const storedS = localStorage.getItem("reelscale_client_statuses");
        const localStatuses = storedS ? JSON.parse(storedS) : {};
        localStatuses[String(newId)] = client.status;
        localStorage.setItem("reelscale_client_statuses", JSON.stringify(localStatuses));
      }
    } catch (e) {
      console.warn("Failed to save local mapping on add", e);
    }
  }
  return result;
}

export async function apiUpdateClient(
  id: string | number,
  client: Omit<Client, "id">
): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      if (client.date) {
        const stored = localStorage.getItem("reelscale_client_dates");
        const localDates = stored ? JSON.parse(stored) : {};
        localDates[String(id)] = client.date;
        localStorage.setItem("reelscale_client_dates", JSON.stringify(localDates));
      }
      if (client.status) {
        const storedS = localStorage.getItem("reelscale_client_statuses");
        const localStatuses = storedS ? JSON.parse(storedS) : {};
        localStatuses[String(id)] = client.status;
        localStorage.setItem("reelscale_client_statuses", JSON.stringify(localStatuses));
      }
    } catch (e) {
      console.warn("Failed to save local mapping on update", e);
    }
  }

  const response = await customFetch(GAS_CLIENTS_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "update",
      id,
      clientName: client.name,
      name: client.name,
      business: client.business,
      phone: client.phone,
      instagram: client.instagram,
      reels: Number(client.reels),
      pricePerReel: Number(client.ppr),
      revenue: Number(client.revenue !== undefined ? client.revenue : (Number(client.reels || 0) * Number(client.ppr || 0))),
      image: client.image || "",
      billingModel: client.billingModel || "Subscription",
      plan: client.plan || "",
      baseRate: Number(client.baseRate || 0),
      bargain: Number(client.bargain || 0),
      date: client.date || "",
      status: client.status || "Active",
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Update client failed");
  }
}

export async function apiDeleteClient(id: string | number): Promise<void> {
  const response = await customFetch(GAS_CLIENTS_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      id,
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Delete client failed");
  }
}

// ==============================
// SALES LEAD API SERVICES
// ==============================
export async function fetchLeads(): Promise<Lead[]> {
  const response = await customFetch(GAS_SALES_URL);
  const result = await response.json();
  return result.leads || [];
}

export async function apiAddLead(
  lead: Omit<Lead, "id" | "createdDate">
): Promise<any> {
  const response = await customFetch(GAS_SALES_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "add",
      category: lead.category,
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      phoneNumber: lead.phoneNumber,
      notes: lead.notes,
      contacted: lead.contacted,
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Add lead failed");
  }
  return result;
}

export async function apiUpdateLead(
  id: string | number,
  lead: Omit<Lead, "id" | "createdDate">
): Promise<void> {
  const response = await customFetch(GAS_SALES_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "update",
      id,
      category: lead.category,
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      phoneNumber: lead.phoneNumber,
      notes: lead.notes,
      contacted: lead.contacted,
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Update lead failed");
  }
}

export async function apiDeleteLead(id: string | number): Promise<void> {
  const response = await customFetch(GAS_SALES_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      id,
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Delete lead failed");
  }
}

// ==============================
// BLOG API SERVICES
// ==============================
export async function fetchBlogs(): Promise<Blog[]> {
  // 1. Fetch live directly from Sanity (works both on localhost and deployed static hosting)
  try {
    const sanityQuery = `*[_type == "post"] | order(publishedDate desc, _createdAt desc) {
      _id,
      title,
      slug,
      description,
      category,
      tags,
      featuredImage,
      "featuredImageUrl": featuredImage.asset->url,
      publishedDate,
      updatedDate,
      status,
      author,
      body,
      faq,
      metaTitle,
      metaDescription,
      focusKeyword,
      canonicalUrl,
      ogImage,
      "ogImageUrl": ogImage.asset->url
    }`;

    const sanityPosts = await client.fetch(sanityQuery);
    if (Array.isArray(sanityPosts) && sanityPosts.length > 0) {
      return sanityPosts.map(sanityDocToBlog);
    }
  } catch (sanityError) {
    console.warn("Direct Sanity query failed, trying local API/fallback:", sanityError);
  }

  // 2. Try /api/blogs if running with active Next.js server
  try {
    const response = await customFetch("/api/blogs");
    if (response.ok) {
      const text = await response.text();
      if (text && text.trim()) {
        const blogsData = JSON.parse(text);
        if (Array.isArray(blogsData) && blogsData.length > 0) {
          return blogsData;
        }
      }
    }
  } catch {}

  // 3. Fallback to static /blogs.json
  try {
    const basePath =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/reelscale")
        ? "/reelscale"
        : "";
    const response = await fetch(`${basePath}/blogs.json`);
    if (response.ok) {
      const text = await response.text();
      if (text && text.trim()) {
        const blogsData = JSON.parse(text);
        if (Array.isArray(blogsData)) return blogsData;
      }
    }
  } catch {}

  return [];
}

export async function apiSaveBlog(blog: Blog): Promise<void> {
  let sanitySuccess = false;
  let lastError: any = null;

  // 1. Direct Sanity Sync (instant, works everywhere including GitHub Pages)
  try {
    await syncBlogToSanity(blog);
    sanitySuccess = true;
  } catch (sanityErr: any) {
    console.error("Direct Sanity save error:", sanityErr);
    lastError = sanityErr;
  }

  // 2. Also sync to /api/blogs if running with server or as fallback
  try {
    const res = await customFetch("/api/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: blog.id ? "update" : "add",
        ...blog,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return;
    } else if (!sanitySuccess) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `API server returned ${res.status}`);
    }
  } catch (apiErr: any) {
    if (!sanitySuccess) {
      console.error("API route save error:", apiErr);
      throw new Error(apiErr.message || lastError?.message || "Failed to save blog to Sanity");
    }
  }

  if (!sanitySuccess && lastError) {
    throw new Error(lastError.message || "Failed to save blog to Sanity");
  }
}

export async function apiDeleteBlog(id: string | number): Promise<void> {
  // 1. Direct Sanity Delete
  try {
    await deleteBlogFromSanity(id);
  } catch (sanityErr: any) {
    console.error("Direct Sanity delete error:", sanityErr);
    throw new Error(sanityErr.message || "Failed to delete from Sanity");
  }

  // 2. Non-blocking sync to local API
  try {
    customFetch("/api/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        id,
      }),
    }).catch(() => {});
  } catch {}
}

// ==============================
// DELIVERIES API SERVICES
// ==============================
export async function fetchDeliveries(
  clientId?: string | number,
  month?: string
): Promise<{ deliveries: DeliveredReel[]; driveLink?: string; showDriveLink?: boolean }> {
  try {
    const params = new URLSearchParams();
    if (clientId) params.append("clientId", String(clientId));
    if (month && month !== "all") params.append("month", month);

    const response = await fetch(`/api/deliveries?${params.toString()}`);
    const data = await response.json();
    if (data.success && Array.isArray(data.deliveries)) {
      if (typeof window !== "undefined") {
        // Cache in localStorage for offline / fast fallback
        localStorage.setItem(`reelscale_deliveries_cache`, JSON.stringify(data.deliveries));
      }
      return {
        deliveries: data.deliveries,
        driveLink: data.driveLink || "",
        showDriveLink: data.showDriveLink !== false,
      };
    }
    return { deliveries: [], driveLink: "", showDriveLink: true };
  } catch (error) {
    console.warn("fetchDeliveries API error, falling back to cache:", error);
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`reelscale_deliveries_cache`);
        if (cached) {
          let list: DeliveredReel[] = JSON.parse(cached);
          if (clientId) list = list.filter((d) => String(d.clientId) === String(clientId));
          if (month && month !== "all") list = list.filter((d) => d.month === month);
          return { deliveries: list, driveLink: "", showDriveLink: true };
        }
      } catch {}
    }
    return { deliveries: [], driveLink: "", showDriveLink: true };
  }
}

export async function apiSaveMonthDriveLink(
  clientId: string | number,
  month: string,
  driveLink: string,
  showDriveLink: boolean = true
): Promise<void> {
  const response = await fetch("/api/deliveries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "setDriveLink",
      clientId,
      month,
      driveLink,
      showDriveLink,
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to save monthly drive link");
  }
}

export async function apiAddDelivery(
  delivery: Omit<DeliveredReel, "id">
): Promise<DeliveredReel> {
  const response = await fetch("/api/deliveries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "add",
      delivery,
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to add delivery");
  }
  return result.delivery;
}

export async function apiUpdateDelivery(delivery: DeliveredReel): Promise<void> {
  const response = await fetch("/api/deliveries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "update",
      delivery,
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to update delivery");
  }
}

export async function apiDeleteDelivery(id: string): Promise<void> {
  const response = await fetch("/api/deliveries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "delete",
      id,
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to delete delivery");
  }
}


