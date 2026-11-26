import { User, Client, Lead, Blog, DeliveredReel, EditorialValidationReport } from "../types";
import { client } from "../../sanity/client";
import {
  syncBlogToSanity,
  deleteBlogFromSanity,
  sanityDocToBlog,
} from "../../sanity/blog-sync";
import { STORAGE_KEYS, API_ROUTES } from "../constants";

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
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
  const updatedOptions = { ...options };
  const user = getCurrentUser();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (user) {
    headers["x-user-role"] = user.role;
    headers["x-user-email"] = user.email;
  }
  updatedOptions.headers = headers;

  return fetch(url, updatedOptions);
}

/**
 * Safely parse a fetch Response as JSON with defense against HTML, text, or proxy error pages.
 * Prevents "Unexpected token 'A', 'An error o'... is not valid JSON" crashes.
 */
export async function safeJsonResponse<T = any>(
  res: Response,
  fallbackMessage = "Request failed"
): Promise<T> {
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const isJson = contentType.includes("application/json");

  let rawText = "";
  try {
    rawText = await res.text();
  } catch (readErr: any) {
    throw new Error(`Failed to read response from server: ${readErr?.message || fallbackMessage}`);
  }

  // If response is not JSON or is empty
  if (!isJson) {
    const cleanSnippet = rawText
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]*>?/gm, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);

    const errorMsg = cleanSnippet
      ? `${cleanSnippet}`
      : `${fallbackMessage} (Status ${res.status})`;

    if (!res.ok) {
      throw new Error(errorMsg);
    }
    return { success: true, message: cleanSnippet || rawText } as unknown as T;
  }

  // Attempt JSON parsing safely
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    const snippet = rawText.replace(/\s+/g, " ").trim().slice(0, 120);
    throw new Error(`Server returned invalid JSON (${res.status}): ${snippet || fallbackMessage}`);
  }

  if (!res.ok && data && typeof data === "object") {
    const msg = data.message || data.error || `${fallbackMessage} (Status ${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

// ==============================
// USER API SERVICES (Database-backed)
// ==============================
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const response = await customFetch(API_ROUTES.AUTH, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const data = await safeJsonResponse(response, "Failed to log in");
    if (data.success) {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.AUTH, "1");
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
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
    const response = await customFetch(API_ROUTES.USERS);
    const data = await safeJsonResponse(response, "Failed to fetch users");
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
  const response = await customFetch(API_ROUTES.USERS, {
    method: "POST",
    body: JSON.stringify({
      action: "add",
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
    }),
  });
  const result = await safeJsonResponse(response, "Add user failed");
  if (!result.success) {
    throw new Error(result.message || "Add failed");
  }
  return result;
}

export async function apiUpdateUser(
  id: string | number,
  user: User
): Promise<void> {
  const response = await customFetch(API_ROUTES.USERS, {
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
  const result = await safeJsonResponse(response, "Update user failed");
  if (!result.success) {
    throw new Error(result.message || "Update failed");
  }
}

export async function apiDeleteUser(id: string | number): Promise<void> {
  const response = await customFetch(API_ROUTES.USERS, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      id,
    }),
  });
  const result = await safeJsonResponse(response, "Delete user failed");
  if (!result.success) {
    throw new Error(result.message || "Delete failed");
  }
}

// ==============================
// CLIENT API SERVICES (Database-backed)
// ==============================
export async function fetchClients(): Promise<Client[]> {
  try {
    const response = await customFetch(API_ROUTES.CLIENTS);
    const data = await safeJsonResponse(response, "Failed to fetch clients");
    const list = data.clients || data || [];

    if (Array.isArray(list)) {
      return list.map((row: any) => ({
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
        date: row.date || "",
        status: row.status || "Active",
        startDate: row.startDate || row.date || "",
        endDate: row.endDate || "",
      }));
    }
    return [];
  } catch (error) {
    console.error("fetchClients Error:", error);
    return [];
  }
}

export async function apiAddClient(
  client: Omit<Client, "id">
): Promise<any> {
  const response = await customFetch(API_ROUTES.CLIENTS, {
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
  const result = await safeJsonResponse(response, "Add client failed");
  if (!result.success) {
    throw new Error(result.message || "Add client failed");
  }
  return result;
}

export async function apiUpdateClient(
  id: string | number,
  client: Omit<Client, "id">
): Promise<void> {
  const response = await customFetch(API_ROUTES.CLIENTS, {
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
  const result = await safeJsonResponse(response, "Update client failed");
  if (!result.success) {
    throw new Error(result.message || "Update client failed");
  }
}

export async function apiDeleteClient(id: string | number): Promise<void> {
  const response = await customFetch(API_ROUTES.CLIENTS, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      id,
    }),
  });
  const result = await safeJsonResponse(response, "Delete client failed");
  if (!result.success) {
    throw new Error(result.message || "Delete client failed");
  }
}

// ==============================
// SALES LEAD API SERVICES (Database-backed)
// ==============================
export async function fetchLeads(): Promise<Lead[]> {
  try {
    const response = await customFetch(API_ROUTES.SALES);
    const result = await safeJsonResponse(response, "Failed to fetch leads");
    return result.leads || [];
  } catch (error) {
    console.error("fetchLeads Error:", error);
    return [];
  }
}

export async function apiAddLead(
  lead: Omit<Lead, "id" | "createdDate">
): Promise<any> {
  const response = await customFetch(API_ROUTES.SALES, {
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
  const result = await safeJsonResponse(response, "Add lead failed");
  if (!result.success) {
    throw new Error(result.message || "Add lead failed");
  }
  return result;
}

export async function apiUpdateLead(
  id: string | number,
  lead: Omit<Lead, "id" | "createdDate">
): Promise<void> {
  const response = await customFetch(API_ROUTES.SALES, {
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
  const result = await safeJsonResponse(response, "Update lead failed");
  if (!result.success) {
    throw new Error(result.message || "Update lead failed");
  }
}

export async function apiDeleteLead(id: string | number): Promise<void> {
  const response = await customFetch(API_ROUTES.SALES, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      id,
    }),
  });
  const result = await safeJsonResponse(response, "Delete lead failed");
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
    const sanityQuery = `*[_type == "post"] | order(publishedDate desc, updatedDate desc, _updatedAt desc, _createdAt desc) {
      _id,
      title,
      slug,
      description,
      category,
      tags,
      featuredImage,
      "featuredImageUrl": coalesce(featuredImageUrl, featuredImage.asset->url),
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
      "ogImageUrl": coalesce(ogImageUrl, ogImage.asset->url, featuredImageUrl, featuredImage.asset->url)
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
  } catch { }

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
  } catch { }

  return [];
}

export async function apiSaveBlog(blog: Blog): Promise<{ blog: Blog; validation?: EditorialValidationReport }> {
  let apiSuccess = false;
  let lastError: any = null;

  // 1. Primary: Save via /api/blogs server route (runs in Node.js, handles remote images without CORS, caches in Redis, saves local backup)
  try {
    const res = await customFetch(API_ROUTES.BLOGS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: blog.id ? "update" : "add",
        ...blog,
      }),
    });

    if (res.ok) {
      const json = await safeJsonResponse(res, "Save blog failed");
      if (json.success) {
        return {
          blog: json.blog || blog,
          validation: json.validation,
        };
      }
    } else {
      const errJson = await safeJsonResponse(res, "Failed to save blog").catch((e) => ({ message: e.message }));
      lastError = new Error(errJson.message || `API server returned ${res.status}`);
      throw lastError;
    }
  } catch (apiErr: any) {
    lastError = apiErr;
    console.warn("API route save error, attempting direct Sanity fallback:", apiErr);
  }

  // 2. Fallback: Direct Sanity Sync (for static environments like GitHub Pages or when API server is unreachable)
  try {
    const synced = await syncBlogToSanity(blog);
    return { blog: synced };
  } catch (sanityErr: any) {
    console.error("Direct Sanity save error:", sanityErr);
    throw new Error(sanityErr.message || lastError?.message || "Failed to save blog to Sanity");
  }
}

export async function apiValidateBlog(blog: Partial<Blog>): Promise<EditorialValidationReport | null> {
  try {
    const res = await customFetch(API_ROUTES.BLOGS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "validate",
        ...blog,
      }),
    });

    if (res.ok) {
      const json = await safeJsonResponse(res, "Validation failed");
      if (json.success && json.validation) {
        return json.validation;
      }
    }
  } catch (valErr) {
    console.warn("Failed to validate blog via API:", valErr);
  }
  return null;
}

export async function apiDeleteBlog(id: string | number): Promise<void> {
  let apiSuccess = false;
  let lastError: any = null;

  // 1. Primary: Delete via /api/blogs server route
  try {
    const res = await customFetch(API_ROUTES.BLOGS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        id,
      }),
    });
    if (res.ok) {
      const json = await safeJsonResponse(res, "Delete blog failed");
      if (json.success) {
        apiSuccess = true;
        return;
      }
    }
  } catch (apiErr: any) {
    lastError = apiErr;
    console.warn("API route delete error, attempting direct Sanity fallback:", apiErr);
  }

  // 2. Fallback: Direct Sanity Delete
  if (!apiSuccess) {
    try {
      await deleteBlogFromSanity(id);
    } catch (sanityErr: any) {
      console.error("Direct Sanity delete error:", sanityErr);
      throw new Error(sanityErr.message || lastError?.message || "Failed to delete from Sanity");
    }
  }
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

    const response = await fetch(`${API_ROUTES.DELIVERIES}?${params.toString()}`);
    const data = await safeJsonResponse(response, "Failed to load deliveries");
    if (data.success && Array.isArray(data.deliveries)) {
      if (typeof window !== "undefined") {
        // Cache in localStorage for offline / fast fallback
        localStorage.setItem(STORAGE_KEYS.DELIVERIES_CACHE, JSON.stringify(data.deliveries));
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
        const cached = localStorage.getItem(STORAGE_KEYS.DELIVERIES_CACHE);
        if (cached) {
          let list: DeliveredReel[] = JSON.parse(cached);
          if (clientId) list = list.filter((d) => String(d.clientId) === String(clientId));
          if (month && month !== "all") list = list.filter((d) => d.month === month);
          return { deliveries: list, driveLink: "", showDriveLink: true };
        }
      } catch { }
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
  const result = await safeJsonResponse(response, "Failed to save monthly drive link");
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
  const result = await safeJsonResponse(response, "Failed to add delivery");
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
  const result = await safeJsonResponse(response, "Failed to update delivery");
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
  const result = await safeJsonResponse(response, "Failed to delete delivery");
  if (!result.success) {
    throw new Error(result.message || "Failed to delete delivery");
  }
}


