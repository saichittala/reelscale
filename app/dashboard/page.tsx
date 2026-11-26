"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth";
import { Layout } from "./components/Layout";
import { Client, User, Lead, Blog, DashboardPage, EditorialValidationReport } from "./types";
import {
  customFetch,
  safeJsonResponse,
  fetchClients,
  fetchUsers,
  fetchLeads,
  fetchBlogs,
  apiAddClient,
  apiUpdateClient,
  apiDeleteClient,
  apiAddUser,
  apiUpdateUser,
  apiDeleteUser,
  apiAddLead,
  apiUpdateLead,
  apiDeleteLead,
  apiSaveBlog,
  apiValidateBlog,
  apiDeleteBlog,
} from "./services/api";

// Sub-modules
import { Overview } from "./modules/Overview";
import { Clients } from "./modules/Clients";
import {
  generateAvailableMonths,
  isClientActiveInMonth,
} from "./utils/subscription";
import { Users } from "./modules/Users";
import { Sales } from "./modules/Sales";
import { Blogs } from "./modules/Blogs";
import { AiBlogSettings } from "./modules/AiBlogSettings";
import { CreateBlog } from "./modules/CreateBlog";
import { BlogCategories } from "./modules/BlogCategories";
import { Resources } from "./modules/Resources";
import { SystemStatus } from "./modules/SystemStatus";
import { Button, Input, DatePicker, toast, DropdownMenu, type DropdownItem } from "@/components/ui";
import { AlertTriangle, Sparkles, Calendar, ChevronDown, RefreshCw } from "lucide-react";
import { GenerateAiBlogModal } from "./components/GenerateAiBlogModal";
import { BlogValidationModal } from "./components/BlogValidationModal";
import { IconSearch, IconLogOut, IconDotsHorizontal } from "./components/Icons";
import { CustomSelect } from "./components/CustomSelect";
import { STORAGE_KEYS } from "./constants";

function updateCache<T>(key: string, data: T): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // ignore storage errors
    }
  }
}

export default function DashboardMainPage() {
  const router = useRouter();
  const auth = useAuth();
  const { isLoggedIn, role, user, logout, sessionExpired, setSessionExpired } = auth;

  // Selected tab route state (synced with URL)
  const [page, setPageState] = useState<DashboardPage>("dashboard");

  const setPage = useCallback((newPage: DashboardPage) => {
    setPageState(newPage);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_PAGE, JSON.stringify(newPage));
      } catch (e) {}
    }
  }, []);

  // Top header search inputs state
  const [clientSearch, setClientSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [blogSearch, setBlogSearch] = useState("");
  const [blogStatusFilter, setBlogStatusFilter] = useState("all");
  const [blogCategoryFilter, setBlogCategoryFilter] = useState("all");
  const [resourcesHeaderLeft, setResourcesHeaderLeft] = useState<React.ReactNode>(null);
  const [resourcesActionsBtn, setResourcesActionsBtn] = useState<React.ReactNode>(null);
  const [createBlogHeaderLeft, setCreateBlogHeaderLeft] = useState<React.ReactNode>(null);
  const [createBlogActionsBtn, setCreateBlogActionsBtn] = useState<React.ReactNode>(null);

  const handleCreateBlogHeaderChange = useCallback(
    (left: React.ReactNode, right: React.ReactNode) => {
      setCreateBlogHeaderLeft(left);
      setCreateBlogActionsBtn(right);
    },
    []
  );

  const handleResourcesHeaderChange = useCallback(
    (left: React.ReactNode, right: React.ReactNode) => {
      setResourcesHeaderLeft(left);
      setResourcesActionsBtn(right);
    },
    []
  );

  const [aiSettingsHeaderLeft, setAiSettingsHeaderLeft] = useState<React.ReactNode>(null);
  const [aiSettingsActionsBtn, setAiSettingsActionsBtn] = useState<React.ReactNode>(null);

  const handleAiSettingsHeaderChange = useCallback(
    (left: React.ReactNode, right: React.ReactNode) => {
      setAiSettingsHeaderLeft(left);
      setAiSettingsActionsBtn(right);
    },
    []
  );

  // Sync active page with URL query parameter ?tab=... on reload and browser back/forward
  useEffect(() => {
    if (typeof window === "undefined") return;

    const VALID_PAGES: DashboardPage[] = [
      "dashboard",
      "clients",
      "users",
      "sales",
      "blogs",
      "ai-blog-settings",
      "create-blog",
      "blog-categories",
      "resources",
      "system-status",
    ];

    const getTargetTab = (): DashboardPage => {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab") as DashboardPage | null;
      if (urlTab && VALID_PAGES.includes(urlTab)) {
        return urlTab;
      }
      return "dashboard";
    };

    const target = getTargetTab();
    if (target !== page) {
      setPage(target);
    }

    const handlePopState = () => {
      const popTarget = getTargetTab();
      if (popTarget !== page) {
        setPage(popTarget);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update browser URL query without reloading whenever tab changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentParams = new URLSearchParams(window.location.search);
    const currentTab = currentParams.get("tab");
    const targetTab = page === "dashboard" ? null : page;

    if (currentTab !== targetTab) {
      const newUrl = targetTab ? `/dashboard?tab=${targetTab}` : "/dashboard";
      window.history.replaceState({ tab: page }, "", newUrl);
    }
  }, [page]);

  // Automatically migrate legacy "analytics" tab to unified "dashboard"
  useEffect(() => {
    if (page === "analytics") {
      setPage("dashboard");
    }
  }, [page, setPage]);

  // Core Data States
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);

  // Category list cache
  const [blogCategories, setBlogCategories] = useState<string[]>([
    "Production",
    "Editing",
    "Branding",
    "Marketing",
    "Case Studies",
  ]);

  // Loading indicator states per-source
  const [clientsLoading, setClientsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [blogsLoading, setBlogsLoading] = useState(false);

  // Modal / inline UI triggers
  const [newUserRow, setNewUserRow] = useState(false);
  const [newLeadRow, setNewLeadRow] = useState(false);
  const [salesDateFrom, setSalesDateFrom] = useState("");
  const [salesDateTo, setSalesDateTo] = useState("");
  const [sysRefreshing, setSysRefreshing] = useState(false);
  const [sysFlushing, setSysFlushing] = useState(false);
  const [sysTriggerRefresh, setSysTriggerRefresh] = useState(0);
  const [sysTriggerFlush, setSysTriggerFlush] = useState(0);
  const [sysIsOperational, setSysIsOperational] = useState<boolean | null>(null);
  const [sysTimestamp, setSysTimestamp] = useState<string>("");
  const [sysLabel, setSysLabel] = useState<string>("");
  const [sysRedisOk, setSysRedisOk] = useState<boolean>(true);
  const [salesFilterExpanded, setSalesFilterExpanded] = useState(false);

  // Active blog being edited
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [showAiGenerateModal, setShowAiGenerateModal] = useState(false);
  const [aiModalAutoStart, setAiModalAutoStart] = useState(false);
  const [validationModalData, setValidationModalData] = useState<{
    blog: Blog;
    report: EditorialValidationReport;
  } | null>(null);

  const handleAiBlogPublished = useCallback(
    (newBlog: Blog, validationReport?: EditorialValidationReport) => {
      // Prepend newly published blog to the very top of blogs list immediately
      setBlogs((prev) => {
        const next = [
          newBlog,
          ...prev.filter(
            (b) => b.slug !== newBlog.slug && String(b.id) !== String(newBlog.id)
          ),
        ];
        return next;
      });

      if (validationReport) {
        setValidationModalData({
          blog: newBlog,
          report: validationReport,
        });
      }

      // Re-fetch in background to keep data in sync, while strictly preserving newBlog at the top
      fetchBlogs()
        .then((fresh) => {
          if (fresh && fresh.length > 0) {
            setBlogs((prev) => {
              const withoutNew = fresh.filter(
                (b) =>
                  b.slug !== newBlog.slug && String(b.id) !== String(newBlog.id)
              );
              return [newBlog, ...withoutNew];
            });
          }
        })
        .catch(() => {});
    },
    []
  );

  // Active selected leads for bulk delete option
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedBlogIds, setSelectedBlogIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [newClientRow, setNewClientRow] = useState(false);

  // Month filter state
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const availableMonths = generateAvailableMonths(clients);

  const filteredClientsByMonth = clients.filter((c) =>
    isClientActiveInMonth(c, selectedMonth)
  );

  useEffect(() => {
    setSelectedLeadIds([]);
    setSelectedClientIds([]);
    setSelectedBlogIds([]);
    setSelectedUserIds([]);
    setNewUserRow(false);
    setNewLeadRow(false);
    setNewClientRow(false);
  }, [page]);

  // Purge legacy local storage mock cache keys to ensure data is always fresh from database
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEYS.CLIENT_DATES);
        localStorage.removeItem(STORAGE_KEYS.CLIENT_STATUSES);
        localStorage.removeItem(STORAGE_KEYS.CLIENTS_CACHE);
        localStorage.removeItem(STORAGE_KEYS.USERS_CACHE);
        localStorage.removeItem(STORAGE_KEYS.SALES_CACHE);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Initial and periodic system health check for live nav status dot
  useEffect(() => {
    let mounted = true;
    const checkSystemHealth = async () => {
      try {
        const res = await customFetch("/api/system-status");
        const json = await safeJsonResponse(res);
        if (mounted && json?.success) {
          setSysIsOperational(json.overall?.status === "operational");
        }
      } catch {
        if (mounted) setSysIsOperational(false);
      }

      // Autonomous AI Blog Automation schedule evaluation
      try {
        await customFetch("/api/ai/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "evaluate-schedule" }),
        });
      } catch {}
    };
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const dateFilterPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!salesFilterExpanded) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        dateFilterPopoverRef.current &&
        !dateFilterPopoverRef.current.contains(e.target as Node)
      ) {
        setSalesFilterExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [salesFilterExpanded]);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Centralized Toast system
  const loadingToastRef = useRef<string | null>(null);
  const showToast = useCallback(
    (msg: string, type: "success" | "error" | "loading" = "success") => {
      if (type === "loading") {
        if (loadingToastRef.current) toast.dismiss(loadingToastRef.current);
        loadingToastRef.current = toast.loading(msg);
      } else {
        if (loadingToastRef.current) {
          toast.update(loadingToastRef.current, {
            title: msg,
            type: type === "error" ? "error" : "success",
            duration: 4000,
          });
          loadingToastRef.current = null;
        } else {
          if (type === "error") {
            toast.error(msg);
          } else {
            toast.success(msg);
          }
        }
      }
    },
    []
  );

  // Check login authentication
  useEffect(() => {
    const authFlag = localStorage.getItem(STORAGE_KEYS.AUTH) === "1";
    const isExpired =
      sessionExpired ||
      (typeof window !== "undefined" &&
        sessionStorage.getItem(STORAGE_KEYS.SESSION_EXPIRED) === "1");
    if (!authFlag && !isExpired) {
      router.push("/dashboard/login");
    }
  }, [isLoggedIn, sessionExpired, router]);

  // Force RBAC path constraints on view load
  useEffect(() => {
    if (!role) return;

    if (role === "sales" && page !== "sales") {
      setPage("sales");
    } else if (
      role === "blogger" &&
      page !== "blogs" &&
      page !== "ai-blog-settings" &&
      page !== "create-blog" &&
      page !== "blog-categories"
    ) {
      setPage("blogs");
    }
  }, [role, page, setPage]);

  // Load datasets based on User Role (Reads cache immediately, then fetches fresh)
  useEffect(() => {
    if (!role) return;

    const loadClientsData = async () => {
      setClientsLoading(true);
      try {
        const data = await fetchClients();
        setClients(data);
      } catch (err) {
        console.error("Clients Fetch Error:", err);
      } finally {
        setClientsLoading(false);
      }
    };

    const loadUsersData = async () => {
      setUsersLoading(true);
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (err) {
        console.error("Users Fetch Error:", err);
      } finally {
        setUsersLoading(false);
      }
    };

    const loadSalesData = async () => {
      setLeadsLoading(true);
      try {
        const data = await fetchLeads();
        setLeads(data);
      } catch (err) {
        console.error("Leads Fetch Error:", err);
      } finally {
        setLeadsLoading(false);
      }
    };

    const loadBlogsData = async () => {
      setBlogsLoading(true);
      try {
        const data = await fetchBlogs();
        setBlogs(data);

        // Sync unique categories found in blogs
        const extractedCats = Array.from(
          new Set(data.map((b) => b.category).filter(Boolean))
        );
        setBlogCategories((prev) => {
          const merged = [...prev];
          extractedCats.forEach((c) => {
            if (!merged.includes(c)) merged.push(c);
          });
          return merged;
        });
      } catch (err) {
        console.error("Blogs Fetch Error:", err);
      } finally {
        setBlogsLoading(false);
      }
    };

    const cleanRole = (role || "").toLowerCase().trim();
    if (cleanRole === "admin" || !role) {
      loadClientsData();
      loadUsersData();
      loadSalesData();
      loadBlogsData();
    } else if (cleanRole === "sales") {
      loadSalesData();
    } else if (cleanRole === "blogger") {
      loadBlogsData();
    }
  }, [role]);

  // Clients modifications
  const handleAddClient = async (clientData: Omit<Client, "id">) => {
    const tempId = `temp_${Date.now()}`;
    const tempClient: Client = {
      id: tempId,
      ...clientData,
    };
    // Immediate optimistic update
    setClients((prev) => [tempClient, ...prev]);

    try {
      await apiAddClient(clientData);
      showToast("Client added successfully");
      const data = await fetchClients();
      setClients(data);
    } catch (err: any) {
      setClients((prev) => prev.filter((c) => c.id !== tempId));
      showToast(err.message || "Failed to add client", "error");
    }
  };

  const handleUpdateClient = async (
    id: string | number,
    clientData: Omit<Client, "id">
  ) => {
    let prevClient: Client | undefined;

    setClients((prev) => {
      prevClient = prev.find((c) => String(c.id) === String(id));
      const next = prev.map((c) =>
        String(c.id) === String(id) ? { ...c, ...clientData } : c
      );
      updateCache(STORAGE_KEYS.CLIENTS_CACHE, next);
      return next;
    });

    try {
      await apiUpdateClient(id, clientData);
      showToast("Client updated successfully");
      const data = await fetchClients();
      setClients(data);
    } catch (err: any) {
      if (prevClient) {
        setClients((prev) => {
          const reverted = prev.map((c) =>
            String(c.id) === String(id) ? prevClient! : c
          );
          updateCache(STORAGE_KEYS.CLIENTS_CACHE, reverted);
          return reverted;
        });
      }
      showToast(err.message || "Failed to update client", "error");
    }
  };

  const handleDeleteClient = async (id: string | number) => {
    let deletedClient: Client | undefined;
    setClients((prev) => {
      deletedClient = prev.find((c) => String(c.id) === String(id));
      const next = prev.filter((c) => String(c.id) !== String(id));
      updateCache(STORAGE_KEYS.CLIENTS_CACHE, next);
      return next;
    });

    try {
      await apiDeleteClient(id);
      showToast("Client deleted successfully");
      const data = await fetchClients();
      setClients(data);
    } catch (err: any) {
      if (deletedClient) {
        setClients((prev) => {
          const reverted = [...prev, deletedClient!];
          updateCache(STORAGE_KEYS.CLIENTS_CACHE, reverted);
          return reverted;
        });
      }
      showToast(err.message || "Failed to delete client", "error");
    }
  };

  // User database updates
  const handleAddUser = async (userData: Omit<User, "id">) => {
    const tempId = Date.now();
    const tempUser: User = {
      id: tempId,
      ...userData,
    };
    setUsers((prev) => {
      const next = [...prev, tempUser];
      updateCache(STORAGE_KEYS.USERS_CACHE, next);
      return next;
    });

    try {
      const res = await apiAddUser(userData);
      showToast("User added successfully");
      const realId = res?.id || res?.user?.id;
      if (realId) {
        setUsers((prev) => {
          const next = prev.map((u) =>
            u.id === tempId ? { ...u, id: realId, ...(res.user || {}) } : u
          );
          updateCache(STORAGE_KEYS.USERS_CACHE, next);
          return next;
        });
      } else {
        const data = await fetchUsers();
        setUsers(data);
        updateCache(STORAGE_KEYS.USERS_CACHE, data);
      }
    } catch (err: any) {
      setUsers((prev) => {
        const next = prev.filter((u) => u.id !== tempId);
        updateCache(STORAGE_KEYS.USERS_CACHE, next);
        return next;
      });
      showToast(err.message || "Failed to add user", "error");
    }
  };

  const handleUpdateUser = async (id: string | number, userData: User) => {
    showToast("Updating...", "loading");
    let prevUser: User | undefined;

    setUsers((prev) => {
      prevUser = prev.find((u) => String(u.id) === String(id));
      const next = prev.map((u) =>
        String(u.id) === String(id) ? { ...u, ...userData } : u
      );
      updateCache(STORAGE_KEYS.USERS_CACHE, next);
      return next;
    });

    try {
      await apiUpdateUser(id, userData);
      showToast("User updated successfully");
    } catch (err: any) {
      if (prevUser) {
        setUsers((prev) => {
          const reverted = prev.map((u) =>
            String(u.id) === String(id) ? prevUser! : u
          );
          updateCache(STORAGE_KEYS.USERS_CACHE, reverted);
          return reverted;
        });
      }
      showToast(err.message || "Failed to update user", "error");
    }
  };

  const handleDeleteUser = async (id: string | number) => {
    let deletedUser: User | undefined;
    setUsers((prev) => {
      deletedUser = prev.find((u) => String(u.id) === String(id));
      const next = prev.filter((u) => String(u.id) !== String(id));
      updateCache(STORAGE_KEYS.USERS_CACHE, next);
      return next;
    });

    try {
      await apiDeleteUser(id);
      showToast("User deleted successfully");
    } catch (err: any) {
      if (deletedUser) {
        setUsers((prev) => {
          const reverted = [...prev, deletedUser!];
          updateCache(STORAGE_KEYS.USERS_CACHE, reverted);
          return reverted;
        });
      }
      showToast(err.message || "Failed to delete user", "error");
    }
  };

  // Lead additions
  const handleAddLead = async (leadData: Omit<Lead, "id" | "createdDate">) => {
    const tempId = Date.now();
    const tempLead: Lead = {
      id: tempId,
      createdDate: new Date().toISOString().split("T")[0],
      ...leadData,
    };
    setLeads((prev) => {
      const next = [tempLead, ...prev];
      updateCache(STORAGE_KEYS.SALES_CACHE, next);
      return next;
    });

    try {
      const res = await apiAddLead(leadData);
      showToast("Lead added successfully");
      const realId = res?.id || res?.lead?.id;
      if (realId) {
        setLeads((prev) => {
          const next = prev.map((l) =>
            l.id === tempId ? { ...l, id: realId, ...(res.lead || {}) } : l
          );
          updateCache(STORAGE_KEYS.SALES_CACHE, next);
          return next;
        });
      } else {
        const data = await fetchLeads();
        setLeads(data);
        updateCache(STORAGE_KEYS.SALES_CACHE, data);
      }
    } catch (err: any) {
      setLeads((prev) => {
        const next = prev.filter((l) => l.id !== tempId);
        updateCache(STORAGE_KEYS.SALES_CACHE, next);
        return next;
      });
      showToast(err.message || "Failed to add lead", "error");
    }
  };

  const handleUpdateLead = async (
    id: string | number,
    leadData: Omit<Lead, "id" | "createdDate">
  ) => {
    showToast("Updating...", "loading");
    let prevLead: Lead | undefined;

    setLeads((prev) => {
      prevLead = prev.find((l) => String(l.id) === String(id));
      const next = prev.map((l) =>
        String(l.id) === String(id) ? { ...l, ...leadData } : l
      );
      updateCache(STORAGE_KEYS.SALES_CACHE, next);
      return next;
    });

    try {
      await apiUpdateLead(id, leadData);
      showToast("Lead updated successfully");
    } catch (err: any) {
      if (prevLead) {
        setLeads((prev) => {
          const reverted = prev.map((l) =>
            String(l.id) === String(id) ? prevLead! : l
          );
          updateCache(STORAGE_KEYS.SALES_CACHE, reverted);
          return reverted;
        });
      }
      showToast(err.message || "Failed to save lead updates", "error");
    }
  };

  const handleDeleteLead = async (id: string | number) => {
    let deletedLead: Lead | undefined;
    setLeads((prev) => {
      deletedLead = prev.find((l) => String(l.id) === String(id));
      const next = prev.filter((l) => String(l.id) !== String(id));
      updateCache(STORAGE_KEYS.SALES_CACHE, next);
      return next;
    });

    try {
      await apiDeleteLead(id);
      showToast("Lead deleted successfully");
    } catch (err: any) {
      if (deletedLead) {
        setLeads((prev) => {
          const reverted = [...prev, deletedLead!];
          updateCache(STORAGE_KEYS.SALES_CACHE, reverted);
          return reverted;
        });
      }
      showToast(err.message || "Failed to delete lead", "error");
    }
  };

  // Blog publishing actions
  const handleSaveBlog = async (blogData: Blog) => {
    if (blogData.id) {
      showToast("Updating...", "loading");
    } else {
      showToast("Publishing blog...", "loading");
    }
    try {
      const result = await apiSaveBlog(blogData);
      const today = new Date().toISOString().split("T")[0];
      const savedBlog: Blog = result?.blog || {
        ...blogData,
        id: blogData.id || Date.now().toString(),
        updatedDate: today,
        publishedDate: blogData.publishedDate || today,
      };

      showToast(
        blogData.id ? "Blog updated successfully" : "Blog published successfully",
        "success"
      );
      setEditingBlog(null);
      setPage("blogs");

      // Prepend the recently saved/published blog to the very top of blogs list immediately
      setBlogs((prev) => {
        const remaining = prev.filter(
          (b) => String(b.id) !== String(savedBlog.id) && b.slug !== savedBlog.slug
        );
        return [savedBlog, ...remaining];
      });

      // Show validation modal if validation report is available
      if (result?.validation) {
        setValidationModalData({
          blog: savedBlog,
          report: result.validation,
        });
      }

      // Re-fetch in background to ensure sync, while strictly keeping savedBlog at the top
      fetchBlogs()
        .then((fresh) => {
          if (fresh && fresh.length > 0) {
            setBlogs((prev) => {
              const remaining = fresh.filter(
                (b) => String(b.id) !== String(savedBlog.id) && b.slug !== savedBlog.slug
              );
              return [savedBlog, ...remaining];
            });
          }
        })
        .catch(() => {});
    } catch (err: any) {
      showToast(err.message || "Failed to save blog", "error");
    } finally {
      setBlogsLoading(false);
    }
  };

  const handleInspectBlogValidation = async (blog: Blog) => {
    showToast("Inspecting editorial & SEO validation...", "loading");
    try {
      const rep = await apiValidateBlog(blog);
      if (rep) {
        showToast(`Validation score: ${rep.overallScore}/100 (${rep.status.toUpperCase()})`, "success");
        setValidationModalData({ blog, report: rep });
      } else {
        showToast("Could not retrieve validation report", "error");
      }
    } catch {
      showToast("Failed to run validation check", "error");
    }
  };

  const handleDeleteBlog = async (id: string | number) => {
    let deletedBlog: Blog | undefined;
    setBlogs((prev) => {
      deletedBlog = prev.find((b) => String(b.id) === String(id));
      return prev.filter((b) => String(b.id) !== String(id));
    });

    try {
      await apiDeleteBlog(id);
      showToast("Blog deleted successfully");
    } catch (err: any) {
      if (deletedBlog) {
        setBlogs((prev) => [...prev, deletedBlog!]);
      }
      showToast(err.message || "Failed to delete blog", "error");
    }
  };

  // Categories addition
  const handleAddCategory = (newCat: string) => {
    setBlogCategories((prev) => [...prev, newCat]);
  };

  const handleDeleteCategory = (idx: number) => {
    setBlogCategories((prev) => prev.filter((_, i) => i !== idx));
  };

  // Safe SSR Auth Check - Allow rendering if sessionExpired modal is active so user sees popup instead of blank screen
  if (!isLoggedIn && !sessionExpired) {
    return null;
  }

  // ── Helper handlers for batch deletion prompts ──
  const handleDeleteSelectedClientsPrompt = () => {
    setConfirmModal({
      title: "Delete Selected Clients",
      message: `Are you sure you want to delete the ${selectedClientIds.length} selected clients?`,
      onConfirm: async () => {
        try {
          showToast(`Deleting ${selectedClientIds.length} selected clients...`);
          await Promise.all(
            selectedClientIds.map((id) => handleDeleteClient(id))
          );
          setSelectedClientIds([]);
          showToast(`Deleted ${selectedClientIds.length} clients successfully`, "success");
        } catch (err: any) {
          showToast(
            err.message || "Failed to delete some selected clients",
            "error"
          );
        }
      }
    });
  };

  const handleDeleteSelectedLeadsPrompt = () => {
    setConfirmModal({
      title: "Delete Selected Leads",
      message: `Are you sure you want to delete the ${selectedLeadIds.length} selected leads?`,
      onConfirm: async () => {
        try {
          showToast(`Deleting ${selectedLeadIds.length} selected leads...`);
          await Promise.all(
            selectedLeadIds.map((id) => handleDeleteLead(id))
          );
          setSelectedLeadIds([]);
          showToast(`Deleted ${selectedLeadIds.length} leads successfully`, "success");
        } catch (err: any) {
          showToast(
            err.message || "Failed to delete some selected leads",
            "error"
          );
        }
      }
    });
  };

  const handleDeleteSelectedUsersPrompt = () => {
    setConfirmModal({
      title: "Delete Selected Users",
      message: `Are you sure you want to delete the ${selectedUserIds.length} selected users?`,
      onConfirm: async () => {
        try {
          showToast(`Deleting ${selectedUserIds.length} selected users...`);
          await Promise.all(
            selectedUserIds.map((id) => handleDeleteUser(id))
          );
          setSelectedUserIds([]);
          showToast(`Deleted ${selectedUserIds.length} users successfully`, "success");
        } catch (err: any) {
          showToast(
            err.message || "Failed to delete some selected users",
            "error"
          );
        }
      }
    });
  };

  // Define dynamic action elements for the Layout topbar portal
  const clientFiltersBtn = selectedClientIds.length > 0 ? (
    <div className="header-actions-desktop df-g8 al-c">
      <Button
        variant="danger"
        onClick={handleDeleteSelectedClientsPrompt}
      >
        <img
          src="/assets/icons/delete.svg"
          width="16"
          className="icon-red"
          alt=""
        />
        <span><span className="hide-mobile">Delete Selected </span>({selectedClientIds.length})</span>
      </Button>
    </div>
  ) : null;

  const addClientBtn = (
    <>
      <div className="header-actions-desktop df-g8 al-c">
        <Button
          variant="primary"
          onClick={() => {
            setNewClientRow(true);
          }}
        >
          <img
            src="/assets/icons/add.svg"
            alt="Add"
            width="18"
            height="18"
          />
          <span>Add Client</span>
        </Button>
      </div>

      <div className="header-actions-compact df-g8 al-c">
        <Button
          variant="primary"
          onClick={() => {
            setNewClientRow(true);
          }}
        >
          <img
            src="/assets/icons/add.svg"
            alt="Add"
            width="18"
            height="18"
          />
          <span>Add Client</span>
        </Button>

        {selectedClientIds.length > 0 && (
          <DropdownMenu
            items={[
              {
                label: `Delete Selected (${selectedClientIds.length})`,
                icon: (
                  <img
                    src="/assets/icons/delete.svg"
                    width="16"
                    className="icon-red"
                    alt=""
                  />
                ),
                destructive: true,
                onSelect: handleDeleteSelectedClientsPrompt,
              },
            ]}
            align="end"
            trigger={
              <Button
                variant="secondary"
                size="icon"
                pill
                className="btn-secondary header-more-btn"
                title="More actions"
                aria-label="More actions"
              >
                <IconDotsHorizontal size={18} />
              </Button>
            }
          />
        )}
      </div>
    </>
  );

  // Sales Date Filter Popover Element
  const salesDateFilterNode = (
    <div ref={dateFilterPopoverRef} style={{ position: "relative" }}>
      <Button
        variant={salesDateFrom || salesDateTo ? "primary" : "secondary"}
        className="df-g8 al-c"
        onClick={() => setSalesFilterExpanded(!salesFilterExpanded)}
      >
        <Calendar size={15} className="opacity-70" />
        <span>
          {salesDateFrom || salesDateTo
            ? `${salesDateFrom || "..."} → ${salesDateTo || "..."}`
            : "Filter by Date"}
        </span>
        <ChevronDown
          size={12}
          className={`chevron-icon-rotatable${salesFilterExpanded ? " chevron-rotated" : ""}`}
        />
      </Button>

      {salesFilterExpanded && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 1000,
            background: "var(--bg2, #141414)",
            border: "1px solid var(--border)",
            borderRadius: "var(--border-radius-2)",
            padding: "16px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.8)",
            minWidth: "290px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--white)" }}>
              Filter Leads by Date
            </span>
            {(salesDateFrom || salesDateTo) && (
              <button
                type="button"
                onClick={() => {
                  setSalesDateFrom("");
                  setSalesDateTo("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--red)",
                  fontSize: "var(--text-xs)",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Clear Filter
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <DatePicker
              label="From Date"
              value={salesDateFrom}
              onChange={(e: any) => setSalesDateFrom(e?.target?.value ?? e)}
            />
            <DatePicker
              label="To Date"
              value={salesDateTo}
              onChange={(e: any) => setSalesDateTo(e?.target?.value ?? e)}
            />
          </div>
        </div>
      )}
    </div>
  );

  const salesFiltersBtn = (
    <div className="header-actions-desktop df-g8 al-c">
      {selectedLeadIds.length > 0 && (
        <Button
          variant="danger"
          onClick={handleDeleteSelectedLeadsPrompt}
        >
          <img
            src="/assets/icons/delete.svg"
            width="16"
            className="icon-red"
            alt=""
          />
          <span><span className="hide-mobile">Delete Selected </span>({selectedLeadIds.length})</span>
        </Button>
      )}

      {salesDateFilterNode}

      <Button
        variant="secondary"
        onClick={() => {
          const trigger = document.getElementById(
            "import-sales-btn-trigger"
          );
          if (trigger) trigger.click();
        }}
      >
        <img src="/assets/icons/upload.svg" width="18" alt="" />
        <span>Import XLS</span>
      </Button>
    </div>
  );

  const addSaleBtn = (
    <>
      <div className="header-actions-desktop df-g8 al-c">
        <Button
          variant="primary"
          onClick={() => setNewLeadRow(true)}
        >
          <img src="/assets/icons/add.svg" width="18" alt="" />
          <span>Add Lead</span>
        </Button>
      </div>

      <div className="header-actions-compact df-g8 al-c">
        <Button
          variant="primary"
          onClick={() => setNewLeadRow(true)}
        >
          <img src="/assets/icons/add.svg" width="18" alt="" />
          <span>Add Lead</span>
        </Button>

        {/* Anchor point if date filter was triggered from menu */}
        {salesFilterExpanded && salesDateFilterNode}

        <DropdownMenu
          items={[
            ...(selectedLeadIds.length > 0
              ? [
                  {
                    label: `Delete Selected (${selectedLeadIds.length})`,
                    icon: (
                      <img
                        src="/assets/icons/delete.svg"
                        width="16"
                        className="icon-red"
                        alt=""
                      />
                    ),
                    destructive: true,
                    onSelect: handleDeleteSelectedLeadsPrompt,
                  },
                ]
              : []),
            {
              label: salesDateFrom || salesDateTo ? `Filter by Date (Active)` : "Filter by Date",
              icon: <Calendar size={16} className="opacity-70" />,
              onSelect: () => setSalesFilterExpanded(true),
            },
            {
              label: "Import XLS",
              icon: <img src="/assets/icons/upload.svg" width="16" alt="" />,
              onSelect: () => {
                const trigger = document.getElementById("import-sales-btn-trigger");
                if (trigger) trigger.click();
              },
            },
          ]}
          align="end"
          trigger={
            <Button
              variant="secondary"
              size="icon"
              pill
              className="btn-secondary header-more-btn"
              title="More actions"
              aria-label="More actions"
            >
              <IconDotsHorizontal size={18} />
            </Button>
          }
        />
      </div>
    </>
  );

  const userFiltersBtn = selectedUserIds.length > 0 ? (
    <div className="header-actions-desktop df-g8 al-c">
      <Button
        variant="danger"
        onClick={handleDeleteSelectedUsersPrompt}
      >
        <img
          src="/assets/icons/delete.svg"
          width="16"
          className="icon-red"
          alt=""
        />
        <span><span className="hide-mobile">Delete Selected </span>({selectedUserIds.length})</span>
      </Button>
    </div>
  ) : null;

  const addUserBtn = (
    <>
      <div className="header-actions-desktop df-g8 al-c">
        <Button
          variant="primary"
          onClick={() => setNewUserRow(true)}
        >
          <img src="/assets/icons/add.svg" width="18" alt="" />
          <span>Add User</span>
        </Button>
      </div>

      <div className="header-actions-compact df-g8 al-c">
        <Button
          variant="primary"
          onClick={() => setNewUserRow(true)}
        >
          <img src="/assets/icons/add.svg" width="18" alt="" />
          <span>Add User</span>
        </Button>

        {selectedUserIds.length > 0 && (
          <DropdownMenu
            items={[
              {
                label: `Delete Selected (${selectedUserIds.length})`,
                icon: (
                  <img
                    src="/assets/icons/delete.svg"
                    width="16"
                    className="icon-red"
                    alt=""
                  />
                ),
                destructive: true,
                onSelect: handleDeleteSelectedUsersPrompt,
              },
            ]}
            align="end"
            trigger={
              <Button
                variant="secondary"
                size="icon"
                pill
                className="btn-secondary header-more-btn"
                title="More actions"
                aria-label="More actions"
              >
                <IconDotsHorizontal size={18} />
              </Button>
            }
          />
        )}
      </div>
    </>
  );

  const blogMoreItems: DropdownItem[] = [
    {
      label: "Generate with AI",
      icon: <Sparkles size={16} className="text-[var(--red)]" />,
      onSelect: () => {
        setAiModalAutoStart(true);
        setShowAiGenerateModal(true);
      },
    },
    {
      label: "Manage Categories",
      icon: (
        <img
          src="/assets/icons/nav-analytics.svg"
          width="16"
          className="opacity-70"
          alt=""
        />
      ),
      onSelect: () => setPage("blog-categories"),
    },
    ...(selectedBlogIds.length > 0
      ? [
          {
            label: `Delete Selected (${selectedBlogIds.length})`,
            icon: <img src="/assets/icons/delete.svg" width="16" className="icon-red" alt="" />,
            destructive: true,
            separatorBefore: true,
            onSelect: () => {
              setConfirmModal({
                title: "Delete Selected Blog Posts",
                message: `Are you sure you want to delete the ${selectedBlogIds.length} selected blog posts?`,
                onConfirm: async () => {
                  try {
                    showToast(`Deleting ${selectedBlogIds.length} selected blog posts...`);
                    await Promise.all(
                      selectedBlogIds.map((id) => apiDeleteBlog(id))
                    );
                    setSelectedBlogIds([]);
                    const data = await fetchBlogs();
                    setBlogs(data);
                    showToast(`Deleted ${selectedBlogIds.length} blogs successfully`, "success");
                  } catch (err: any) {
                    showToast(
                      err.message || "Failed to delete some selected blogs",
                      "error"
                    );
                  }
                },
              });
            },
          },
        ]
      : []),
  ];

  const blogActionsBtn = (
    <>
      {/* Desktop view (> 1180px): inline filters and delete */}
      <div className="header-actions-desktop df-g8 al-c">
        {selectedBlogIds.length > 0 && (
          <Button
            variant="danger"
            onClick={() => {
              setConfirmModal({
                title: "Delete Selected Blog Posts",
                message: `Are you sure you want to delete the ${selectedBlogIds.length} selected blog posts?`,
                onConfirm: async () => {
                  try {
                    showToast(`Deleting ${selectedBlogIds.length} selected blog posts...`);
                    await Promise.all(
                      selectedBlogIds.map((id) => apiDeleteBlog(id))
                    );
                    setSelectedBlogIds([]);
                    const data = await fetchBlogs();
                    setBlogs(data);
                    showToast(`Deleted ${selectedBlogIds.length} blogs successfully`, "success");
                  } catch (err: any) {
                    showToast(
                      err.message || "Failed to delete some selected blogs",
                      "error"
                    );
                  }
                },
              });
            }}
          >
            <img
              src="/assets/icons/delete.svg"
              width="16"
              className="icon-red"
              alt=""
            />
            <span><span className="hide-mobile">Delete Selected </span>({selectedBlogIds.length})</span>
          </Button>
        )}

        <CustomSelect
          id="topbar-blog-status-filter"
          value={blogStatusFilter}
          onChange={(v) => setBlogStatusFilter(v)}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "Draft", label: "Draft" },
            { value: "Published", label: "Published" },
          ]}
          size="md"
        />

        <CustomSelect
          id="topbar-blog-category-filter"
          value={blogCategoryFilter}
          onChange={(v) => setBlogCategoryFilter(v)}
          options={[
            { value: "all", label: "All Categories" },
            ...blogCategories.map((c) => ({ value: c, label: c })),
          ]}
          size="md"
          align="right"
        />

        <Button
          variant="secondary"
          pill
          className="btn-secondary"
          onClick={() => setPage("blog-categories")}
        >
          <img
            src="/assets/icons/nav-analytics.svg"
            width="18"
            className="opacity-70"
            alt=""
          />
          <span>Categories</span>
        </Button>
      </div>

      {/* Compact / Overflow view (<= 1180px): filters kept on tablet, collapsed into controls on phone */}
      <div className="header-actions-compact df-g8 al-c">
        <div className="topbar-blog-filters-compact hide-mobile df-g8 al-c">
          <CustomSelect
            id="topbar-blog-status-filter-compact"
            value={blogStatusFilter}
            onChange={(v) => setBlogStatusFilter(v)}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "Draft", label: "Draft" },
              { value: "Published", label: "Published" },
            ]}
            size="md"
          />

          <CustomSelect
            id="topbar-blog-category-filter-compact"
            value={blogCategoryFilter}
            onChange={(v) => setBlogCategoryFilter(v)}
            options={[
              { value: "all", label: "All Categories" },
              ...blogCategories.map((c) => ({ value: c, label: c })),
            ]}
            size="md"
            align="right"
          />
        </div>
      </div>
    </>
  );

  const createBlogBtn = (
    <>
      {/* Desktop view (> 1180px): Both AI Generate and Create Blog visible */}
      <div className="header-actions-desktop df-g8 al-c">
        <Button
          variant="ai"
          onClick={() => {
            setAiModalAutoStart(true);
            setShowAiGenerateModal(true);
          }}
          title="Directly auto-generate AI Blog and publish to production"
        >
          <Sparkles size={16} />
          <span>Generate with AI</span>
        </Button>

        <Button
          variant="primary"
          onClick={() => {
            setEditingBlog(null);
            setPage("create-blog");
          }}
        >
          <img src="/assets/icons/add.svg" width="18" alt="" />
          <span>Create Blog</span>
        </Button>
      </div>

      {/* Compact / Overflow view (<= 1180px): Create Blog + Secondary Three-Dot Menu */}
      <div className="header-actions-compact df-g8 al-c">
        <Button
          variant="primary"
          onClick={() => {
            setEditingBlog(null);
            setPage("create-blog");
          }}
        >
          <img src="/assets/icons/add.svg" width="18" alt="" />
          <span><span className="hide-mobile">Create </span>Blog</span>
        </Button>

        <DropdownMenu
          items={blogMoreItems}
          align="end"
          trigger={
            <Button
              variant="secondary"
              size="icon"
              pill
              className="btn-secondary header-more-btn"
              title="More options"
              aria-label="More options"
            >
              <IconDotsHorizontal size={18} />
            </Button>
          }
        />
      </div>
    </>
  );

  const systemStatusActionsBtn = (
    <>
      <div className="header-actions-desktop df-g8 al-c">
        {/* Status Pill: Dot + Perfect/Issues + Checked Timestamp */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 14px",
            borderRadius: "var(--border-radius-99, 99px)",
            background: "transparent",
            border: "1px solid var(--border)",
            fontSize: "var(--text-xs)",
          }}
        >
          {sysIsOperational === false ? (
            <AlertTriangle
              size={14}
              style={{
                color: "var(--red)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
          ) : (
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--green)",
                boxShadow: "0 0 6px var(--green)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
          )}
          <span style={{ color: "var(--white)", fontWeight: 600 }}>
            {sysIsOperational === false ? sysLabel || "Issues" : "Perfect"}
          </span>
          {sysTimestamp && (
            <span style={{ color: "var(--muted)", fontSize: "11px" }}>
              (Checked: {new Date(sysTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })})
            </span>
          )}
        </div>

        {/* Flush Cache Button */}
        <Button
          variant="secondary"
          onClick={() => setSysTriggerFlush((c) => c + 1)}
          disabled={sysFlushing || !sysRedisOk}
          style={{ fontSize: "var(--text-xs)" }}
        >
          <img src="/assets/icons/delete.svg" width="14" alt="" className="opacity-70" />
          <span>{sysFlushing ? "Flushing..." : "Flush Cache"}</span>
        </Button>

        {/* Refresh Button */}
        <Button
          variant="primary"
          onClick={() => setSysTriggerRefresh((c) => c + 1)}
          disabled={sysRefreshing}
          style={{ fontSize: "var(--text-xs)" }}
        >
          <img
            src="/assets/icons/nav-status.svg"
            width="14"
            alt=""
            style={{
              animation: sysRefreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          <span>{sysRefreshing ? "Checking..." : "Refresh"}</span>
        </Button>
      </div>

      <div className="header-actions-compact df-g8 al-c">
        {/* Compact Status Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 12px",
            borderRadius: "var(--border-radius-99, 99px)",
            background: "transparent",
            border: "1px solid var(--border)",
            fontSize: "var(--text-xs)",
          }}
        >
          {sysIsOperational === false ? (
            <AlertTriangle
              size={14}
              style={{
                color: "var(--red)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
          ) : (
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--green)",
                boxShadow: "0 0 6px var(--green)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
          )}
          <span style={{ color: "var(--white)", fontWeight: 600 }}>
            {sysIsOperational === false ? sysLabel || "Issues" : "Perfect"}
          </span>
        </div>

        {/* Refresh Button */}
        <Button
          variant="primary"
          onClick={() => setSysTriggerRefresh((c) => c + 1)}
          disabled={sysRefreshing}
          style={{ fontSize: "var(--text-xs)" }}
        >
          <img
            src="/assets/icons/nav-status.svg"
            width="14"
            alt=""
            style={{
              animation: sysRefreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          <span>{sysRefreshing ? "Checking..." : "Refresh"}</span>
        </Button>

        <DropdownMenu
          items={[
            {
              label: sysFlushing ? "Flushing Cache..." : "Flush Cache",
              icon: <img src="/assets/icons/delete.svg" width="14" alt="" className="opacity-70" />,
              disabled: sysFlushing || !sysRedisOk,
              onSelect: () => setSysTriggerFlush((c) => c + 1),
            },
          ]}
          align="end"
          trigger={
            <Button
              variant="secondary"
              size="icon"
              pill
              className="btn-secondary header-more-btn"
              title="More actions"
              aria-label="More actions"
            >
              <IconDotsHorizontal size={18} />
            </Button>
          }
        />
      </div>
    </>
  );

  const searchBar = ["clients", "sales", "users", "blogs"].includes(page) ? (
    <Input
      type="search"
      startIcon={<IconSearch size={16} />}
      placeholder={
        page === "clients"
          ? "Search clients..."
          : page === "sales"
            ? "Search leads..."
            : page === "users"
              ? "Search users..."
              : "Search blogs..."
      }
      value={
        page === "clients"
          ? clientSearch
          : page === "sales"
            ? leadSearch
            : page === "users"
              ? userSearch
              : blogSearch
      }
      onChange={(e) => {
        const val = e.target.value;
        if (page === "clients") setClientSearch(val);
        else if (page === "sales") setLeadSearch(val);
        else if (page === "users") setUserSearch(val);
        else if (page === "blogs") setBlogSearch(val);
      }}
    />
  ) : null;

  return (
    <>
      <Layout
        page={page}
        setPage={setPage}
        user={user}
        logout={logout}
        searchBar={searchBar}
        clientFiltersBtn={clientFiltersBtn}
        addClientBtn={addClientBtn}
        addSaleBtn={addSaleBtn}
        userFiltersBtn={userFiltersBtn}
        addUserBtn={addUserBtn}
        salesFiltersBtn={salesFiltersBtn}
        blogActionsBtn={blogActionsBtn}
        createBlogBtn={createBlogBtn}
        createBlogHeaderLeft={createBlogHeaderLeft}
        createBlogActionsBtn={createBlogActionsBtn}
        systemStatusActionsBtn={systemStatusActionsBtn}
        systemStatusOperational={sysIsOperational}
        resourcesHeaderLeft={resourcesHeaderLeft}
        resourcesActionsBtn={resourcesActionsBtn}
        aiSettingsHeaderLeft={aiSettingsHeaderLeft}
        aiSettingsActionsBtn={aiSettingsActionsBtn}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        availableMonths={availableMonths}
      >
        {/* Active page views wrapped in a premium entrance animation container */}
        <div key={page} className="active-view">
          {(page === "dashboard" || page === "analytics") && (
            <Overview
              clients={filteredClientsByMonth}
              allClients={clients}
              selectedMonth={selectedMonth}
              availableMonths={availableMonths}
              isLoading={clientsLoading}
            />
          )}

          {page === "clients" && (
            <Clients
              clients={filteredClientsByMonth}
              allClients={clients}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              availableMonths={availableMonths}
              isLoading={clientsLoading}
              newClientRow={newClientRow}
              setNewClientRow={setNewClientRow}
              selectedClientIds={selectedClientIds}
              setSelectedClientIds={setSelectedClientIds}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              showToast={showToast}
              setConfirmModal={setConfirmModal}
              search={clientSearch}
              onSearchChange={setClientSearch}
            />
          )}

          {page === "users" && (
            <Users
              users={users}
              isLoading={usersLoading}
              newUserRow={newUserRow}
              setNewUserRow={setNewUserRow}
              selectedUserIds={selectedUserIds}
              setSelectedUserIds={setSelectedUserIds}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              showToast={showToast}
              setConfirmModal={setConfirmModal}
              search={userSearch}
              onSearchChange={setUserSearch}
            />
          )}

          {page === "sales" && (
            <Sales
              leads={leads}
              isLoading={leadsLoading}
              newLeadRow={newLeadRow}
              setNewLeadRow={setNewLeadRow}
              salesFilterExpanded={salesFilterExpanded}
              salesDateFrom={salesDateFrom}
              setSalesDateFrom={setSalesDateFrom}
              salesDateTo={salesDateTo}
              setSalesDateTo={setSalesDateTo}
              selectedLeadIds={selectedLeadIds}
              setSelectedLeadIds={setSelectedLeadIds}
              onAddLead={handleAddLead}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              showToast={showToast}
              setConfirmModal={setConfirmModal}
              search={leadSearch}
              onSearchChange={setLeadSearch}
            />
          )}

          {page === "blogs" && (
            <Blogs
              blogs={blogs}
              isLoading={blogsLoading}
              blogCategories={blogCategories}
              selectedBlogIds={selectedBlogIds}
              setSelectedBlogIds={setSelectedBlogIds}
              onEditBlog={(blog) => {
                setEditingBlog(blog);
                setPage("create-blog");
              }}
              onDeleteBlog={handleDeleteBlog}
              onCreateBlog={() => {
                setEditingBlog(null);
                setPage("create-blog");
              }}
              onManageCategories={() => setPage("blog-categories")}
              onGenerateAiBlog={() => {
                setAiModalAutoStart(true);
                setShowAiGenerateModal(true);
              }}
              setConfirmModal={setConfirmModal}
              search={blogSearch}
              onSearchChange={setBlogSearch}
              statusFilter={blogStatusFilter}
              onStatusFilterChange={setBlogStatusFilter}
              categoryFilter={blogCategoryFilter}
              onCategoryFilterChange={setBlogCategoryFilter}
              onValidateBlog={handleInspectBlogValidation}
            />
          )}

          {page === "ai-blog-settings" && (
            <AiBlogSettings
              blogs={blogs}
              onNavigateTab={(tab) => setPage(tab as DashboardPage)}
              showToast={showToast}
              onHeaderChange={handleAiSettingsHeaderChange}
            />
          )}

          {page === "create-blog" && (
            <CreateBlog
              editingBlog={editingBlog}
              blogCategories={blogCategories}
              onSaveBlog={handleSaveBlog}
              onBlogPublished={handleAiBlogPublished}
              onShowValidation={(blog, report) => setValidationModalData({ blog, report })}
              showToast={showToast}
              onBack={() => {
                setEditingBlog(null);
                setPage("blogs");
              }}
              onHeaderChange={handleCreateBlogHeaderChange}
            />
          )}

          {page === "blog-categories" && (
            <BlogCategories
              blogCategories={blogCategories}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              showToast={showToast}
              setConfirmModal={setConfirmModal}
            />
          )}

          {page === "resources" && (
            <Resources
              clients={clients}
              showToast={showToast}
              setConfirmModal={setConfirmModal}
              onHeaderChange={handleResourcesHeaderChange}
            />
          )}

          {page === "system-status" && (
            <SystemStatus
              showToast={showToast}
              refreshTrigger={sysTriggerRefresh}
              flushTrigger={sysTriggerFlush}
              onStateChange={({
                refreshing,
                flushing,
                isOperational,
                timestamp,
                label,
                redisOk,
              }) => {
                setSysRefreshing(refreshing);
                setSysFlushing(flushing);
                setSysIsOperational(isOperational);
                if (timestamp) setSysTimestamp(timestamp);
                if (label) setSysLabel(label);
                if (redisOk !== undefined) setSysRedisOk(redisOk);
              }}
            />
          )}
        </div>
      </Layout>

      {/* 5-minute Inactivity Session Expired Overlay Modal */}
      {sessionExpired && (
        <div
          className="modal-overlay active"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <div
            className="modal modal-sm"
            style={{
              position: "relative",
              zIndex: 1000000,
              opacity: 1,
              transform: "scale(1)",
              background: "var(--bg, #111115)",
              border: "1px solid var(--border, rgba(255, 255, 255, 0.1))",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "420px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 24px 64px rgba(0, 0, 0, 0.8)",
            }}
          >
            <div
              className="modal-icon"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(229, 9, 20, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px auto",
              }}
            >
              <IconLogOut size={26} style={{ color: "var(--red, #e50914)" }} />
            </div>
            <div className="modal-header" style={{ marginBottom: "12px", justifyContent: "center" }}>
              <div
                className="modal-title"
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "var(--text, #fff)",
                  justifyContent: "center"
                }}
              >
                Session Expired
              </div>
            </div>
            <div
              className="text-muted mb-24 modal-body-text"
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--text-muted, #8e8e93)",
                marginBottom: "24px",
              }}
            >
              Your session expired due to 5 minutes of inactivity. Please sign in again to
              continue using ReelScale.
            </div>
            <div className="form-footer" style={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="primary"
                style={{
                  minWidth: "100%",
                  padding: "12px 24px",
                  fontWeight: 600,
                  borderRadius: "12px",
                }}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRED);
                  }
                  logout();
                  setSessionExpired(false);
                  router.push("/dashboard/login");
                }}
              >
                Login Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmModal && (
        <div className="modal-overlay active" style={{ zIndex: 99999 }}>
          <div className="delete-modal modal-sm text-left">
            <div className="delete-icon mb-20">
              <img
                src="/assets/icons/delete.svg"
                alt="Delete"
                className="icon-red"
              />
            </div>
            <div className="delete-title">{confirmModal.title}</div>
            <div className="delete-sub text-left mb-28">{confirmModal.message}</div>
            <div className="delete-actions del-actions-end">
              <Button
                variant="secondary"
                className="btn-auto"
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="btn-auto"
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await action();
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual AI Blog Generator Modal with Direct Production Publish */}
      <GenerateAiBlogModal
        isOpen={showAiGenerateModal}
        onClose={() => {
          setShowAiGenerateModal(false);
          setAiModalAutoStart(false);
        }}
        autoStart={aiModalAutoStart}
        blogCategories={blogCategories}
        onBlogPublished={handleAiBlogPublished}
        showToast={showToast}
      />

      {/* Editorial & SEO Quality Validation Modal */}
      <BlogValidationModal
        isOpen={!!validationModalData}
        onClose={() => setValidationModalData(null)}
        blog={validationModalData?.blog || null}
        report={validationModalData?.report || null}
        onEditBlog={(b) => {
          setEditingBlog(b);
          setPage("create-blog");
        }}
      />
    </>
  );
}
export const dynamic = "force-dynamic";
