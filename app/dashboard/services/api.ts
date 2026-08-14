import { User, Client, Lead, Blog } from "../types";

export const GAS_USERS_URL =
  "https://script.google.com/macros/s/AKfycbx4ZaU3l-XsieGxzfGg26XRSFb5TmxL3anOxrLHmpXcufsk3O8zMGWZkj-u0VWdPULG/exec";
export const GAS_CLIENTS_URL =
  "https://script.google.com/macros/s/AKfycbwtHct0aXYy6VshpSelyPt1HpdlZuBahocjc1Ml1wKCKAHlUP74vCRYBPhFVZVmVQX0/exec";
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

export async function apiAddUser(user: Omit<User, "id">): Promise<void> {
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
      billingModel: row.billingModel || "Reel-to-Reel",
      plan: row.plan || "",
      baseRate: Number(row.baseRate || 0),
      bargain: Number(row.bargain || 0),
      revenue: Number(row.revenue || 0),
    }));
  }
  return [];
}

export async function apiAddClient(
  client: Omit<Client, "id">
): Promise<void> {
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
      image: client.image || "",
      billingModel: client.billingModel || "Reel-to-Reel",
      plan: client.plan || "",
      baseRate: Number(client.baseRate || 0),
      bargain: Number(client.bargain || 0),
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Add client failed");
  }
}

export async function apiUpdateClient(
  id: string | number,
  client: Omit<Client, "id">
): Promise<void> {
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
      image: client.image || "",
      billingModel: client.billingModel || "Reel-to-Reel",
      plan: client.plan || "",
      baseRate: Number(client.baseRate || 0),
      bargain: Number(client.bargain || 0),
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
): Promise<void> {
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
  let blogsData: Blog[] = [];
  try {
    let urlToFetch = GAS_BLOGS_URL;
    if (!urlToFetch && useLocalAPI) {
      urlToFetch = "/api/blogs";
    }
    if (!urlToFetch) {
      throw new Error("No blogs database URL configured.");
    }
    const response = await customFetch(urlToFetch);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    if (!text || !text.trim()) {
      throw new Error("Empty response received from blogs database.");
    }
    blogsData = JSON.parse(text);
  } catch (error) {
    console.warn(
      "Dynamic API fetch/parse failed, trying static fallback:",
      error
    );
    const response = await fetch("/blogs.json");
    if (!response.ok) {
      throw new Error(`Fallback HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    if (!text || !text.trim()) {
      throw new Error("Fallback blogs.json content is empty.");
    }
    blogsData = JSON.parse(text);
  }
  return Array.isArray(blogsData) ? blogsData : [];
}

export async function apiSaveBlog(blog: Blog): Promise<void> {
  const action = blog.id ? "update" : "add";
  let urlToFetch = GAS_BLOGS_URL;
  if (!urlToFetch && useLocalAPI) {
    urlToFetch = "/api/blogs";
  }
  const response = await customFetch(urlToFetch, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      ...blog,
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Save failed");
  }
}

export async function apiDeleteBlog(id: string | number): Promise<void> {
  let urlToFetch = GAS_BLOGS_URL;
  if (!urlToFetch && useLocalAPI) {
    urlToFetch = "/api/blogs";
  }
  const response = await customFetch(urlToFetch, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
