"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { Layout } from "./components/Layout";
import { Client, User, Lead, Blog, DashboardPage } from "./types";
import {
  customFetch,
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
import { CreateBlog } from "./modules/CreateBlog";
import { BlogCategories } from "./modules/BlogCategories";
import { Resources } from "./modules/Resources";
import { SystemStatus } from "./modules/SystemStatus";
import { Button, Input, DatePicker, toast } from "@/components/ui";
import { IconSearch } from "./components/Icons";
import { CustomSelect } from "./components/CustomSelect";

export default function DashboardMainPage() {
  const router = useRouter();
  const auth = useAuth();
  const { isLoggedIn, role, user, logout, sessionExpired, setSessionExpired } = auth;

  // Selected tab route state (synced with localStorage)
  const [page, setPage] = useLocalStorage<DashboardPage>("reelscale_current_page", "dashboard");

  // Top header search inputs state
  const [clientSearch, setClientSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [blogSearch, setBlogSearch] = useState("");
  const [blogStatusFilter, setBlogStatusFilter] = useState("all");
  const [blogCategoryFilter, setBlogCategoryFilter] = useState("all");
  const [resourcesHeaderLeft, setResourcesHeaderLeft] = useState<React.ReactNode>(null);
  const [resourcesActionsBtn, setResourcesActionsBtn] = useState<React.ReactNode>(null);

  const handleResourcesHeaderChange = useCallback(
    (left: React.ReactNode, right: React.ReactNode) => {
      setResourcesHeaderLeft(left);
      setResourcesActionsBtn(right);
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
      "create-blog",
      "blog-categories",
      "resources",
      "system-status",
    ];

    const getTargetTab = (): DashboardPage | null => {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab") as DashboardPage | null;
      if (urlTab && VALID_PAGES.includes(urlTab)) {
        return urlTab;
      }
      try {
        const stored = window.localStorage.getItem("reelscale_current_page");
        if (stored) {
          let parsed: any = stored;
          try {
            parsed = JSON.parse(stored);
          } catch (e) { }
          if (VALID_PAGES.includes(parsed)) return parsed;
        }
      } catch (e) { }
      return null;
    };

    const target = getTargetTab();
    if (target && target !== page) {
      setPage(target);
    }

    const handlePopState = () => {
      const popTarget = getTargetTab();
      if (popTarget && popTarget !== page) {
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

  // Initial and periodic system health check for live nav status dot
  useEffect(() => {
    let mounted = true;
    const checkSystemHealth = async () => {
      try {
        const res = await customFetch("/api/system-status");
        const json = await res.json();
        if (mounted && json?.success) {
          setSysIsOperational(json.overall?.status === "operational");
        }
      } catch {
        if (mounted) setSysIsOperational(false);
      }
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
    const authFlag = localStorage.getItem("reelscale_auth") === "1";
    if (!authFlag && !sessionExpired) {
      router.push("/dashboard/login/");
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
      // Try load cache
      const cached = localStorage.getItem("clients_cache");
      if (cached) {
        try {
          setClients(JSON.parse(cached));
        } catch (e) { }
      }
      try {
        const data = await fetchClients();
        setClients(data);
        localStorage.setItem("clients_cache", JSON.stringify(data));
      } catch (err) {
        console.error("Clients Fetch Error:", err);
      } finally {
        setClientsLoading(false);
      }
    };

    const loadUsersData = async () => {
      setUsersLoading(true);
      const cached = localStorage.getItem("users_cache");
      if (cached) {
        try {
          setUsers(JSON.parse(cached));
        } catch (e) { }
      }
      try {
        const data = await fetchUsers();
        setUsers(data);
        localStorage.setItem("users_cache", JSON.stringify(data));
      } catch (err) {
        console.error("Users Fetch Error:", err);
      } finally {
        setUsersLoading(false);
      }
    };

    const loadSalesData = async () => {
      setLeadsLoading(true);
      const cached = localStorage.getItem("sales_cache");
      if (cached) {
        try {
          setLeads(JSON.parse(cached));
        } catch (e) { }
      }
      try {
        const data = await fetchLeads();
        setLeads(data);
        localStorage.setItem("sales_cache", JSON.stringify(data));
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

      // Auto-assign local storage date mapping if not returned by server
      if (typeof window !== "undefined" && clientData.date) {
        try {
          const stored = localStorage.getItem("reelscale_client_dates") || "{}";
          const localDates = JSON.parse(stored);
          const maxIdClient = data.reduce((max: Client | null, curr: Client) => {
            if (!max) return curr;
            return Number(curr.id) > Number(max.id) ? curr : max;
          }, null);
          if (maxIdClient && !localDates[String(maxIdClient.id)]) {
            localDates[String(maxIdClient.id)] = clientData.date;
            localStorage.setItem("reelscale_client_dates", JSON.stringify(localDates));
            maxIdClient.date = clientData.date;
          }
        } catch (e) {
          console.warn("Failed to map added client date locally", e);
        }
      }

      setClients(data);
      localStorage.setItem("clients_cache", JSON.stringify(data));
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
      try {
        localStorage.setItem("clients_cache", JSON.stringify(next));
      } catch (e) { }
      return next;
    });

    try {
      await apiUpdateClient(id, clientData);
      showToast("Client updated successfully");
    } catch (err: any) {
      if (prevClient) {
        setClients((prev) => {
          const reverted = prev.map((c) =>
            String(c.id) === String(id) ? prevClient! : c
          );
          try {
            localStorage.setItem("clients_cache", JSON.stringify(reverted));
          } catch (e) { }
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
      try {
        localStorage.setItem("clients_cache", JSON.stringify(next));
      } catch (e) { }
      return next;
    });

    try {
      await apiDeleteClient(id);
      showToast("Client deleted successfully");
    } catch (err: any) {
      if (deletedClient) {
        setClients((prev) => {
          const reverted = [...prev, deletedClient!];
          try {
            localStorage.setItem("clients_cache", JSON.stringify(reverted));
          } catch (e) { }
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
      try {
        localStorage.setItem("users_cache", JSON.stringify(next));
      } catch (e) { }
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
          try {
            localStorage.setItem("users_cache", JSON.stringify(next));
          } catch (e) { }
          return next;
        });
      } else {
        const data = await fetchUsers();
        setUsers(data);
        localStorage.setItem("users_cache", JSON.stringify(data));
      }
    } catch (err: any) {
      setUsers((prev) => {
        const next = prev.filter((u) => u.id !== tempId);
        try {
          localStorage.setItem("users_cache", JSON.stringify(next));
        } catch (e) { }
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
      try {
        localStorage.setItem("users_cache", JSON.stringify(next));
      } catch (e) { }
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
          try {
            localStorage.setItem("users_cache", JSON.stringify(reverted));
          } catch (e) { }
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
      try {
        localStorage.setItem("users_cache", JSON.stringify(next));
      } catch (e) { }
      return next;
    });

    try {
      await apiDeleteUser(id);
      showToast("User deleted successfully");
    } catch (err: any) {
      if (deletedUser) {
        setUsers((prev) => {
          const reverted = [...prev, deletedUser!];
          try {
            localStorage.setItem("users_cache", JSON.stringify(reverted));
          } catch (e) { }
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
      try {
        localStorage.setItem("sales_cache", JSON.stringify(next));
      } catch (e) { }
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
          try {
            localStorage.setItem("sales_cache", JSON.stringify(next));
          } catch (e) { }
          return next;
        });
      } else {
        const data = await fetchLeads();
        setLeads(data);
        localStorage.setItem("sales_cache", JSON.stringify(data));
      }
    } catch (err: any) {
      setLeads((prev) => {
        const next = prev.filter((l) => l.id !== tempId);
        try {
          localStorage.setItem("sales_cache", JSON.stringify(next));
        } catch (e) { }
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
      try {
        localStorage.setItem("sales_cache", JSON.stringify(next));
      } catch (e) { }
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
          try {
            localStorage.setItem("sales_cache", JSON.stringify(reverted));
          } catch (e) { }
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
      try {
        localStorage.setItem("sales_cache", JSON.stringify(next));
      } catch (e) { }
      return next;
    });

    try {
      await apiDeleteLead(id);
      showToast("Lead deleted successfully");
    } catch (err: any) {
      if (deletedLead) {
        setLeads((prev) => {
          const reverted = [...prev, deletedLead!];
          try {
            localStorage.setItem("sales_cache", JSON.stringify(reverted));
          } catch (e) { }
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
    }
    try {
      await apiSaveBlog(blogData);
      showToast(
        blogData.id ? "Blog updated successfully" : "Blog created successfully"
      );
      setEditingBlog(null);
      setPage("blogs");
      if (blogData.id) {
        setBlogs((prev) =>
          prev.map((b) =>
            String(b.id) === String(blogData.id) ? { ...b, ...blogData } : b
          )
        );
      } else {
        setBlogsLoading(true);
        const data = await fetchBlogs();
        setBlogs(data);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save blog", "error");
    } finally {
      setBlogsLoading(false);
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

  // Safe SSR Auth Check
  if (!isLoggedIn) {
    return null;
  }

  // Define dynamic action elements for the Layout topbar portal
  const clientFiltersBtn = selectedClientIds.length > 0 && (
    <Button
      variant="danger"
      onClick={() => {
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
      }}
    >
      <img
        src="/assets/icons/delete.svg"
        width="16"
        className="icon-red"
        alt=""
      />
      <span><span className="hide-mobile">Delete Selected </span>({selectedClientIds.length})</span>
    </Button>
  );

  const addClientBtn = (
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
  );

  const addSaleBtn = (
    <Button
      variant="primary"
      onClick={() => setNewLeadRow(true)}
    >
      <img src="/assets/icons/add.svg" width="18" alt="" />
      <span>Add Lead</span>
    </Button>
  );

  const salesFiltersBtn = (
    <div className="df-g8 al-c">
      {selectedLeadIds.length > 0 && (
        <Button
          variant="danger"
          onClick={() => {
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
          }}
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

      <div ref={dateFilterPopoverRef} style={{ position: "relative" }}>
        <Button
          variant={salesDateFrom || salesDateTo ? "primary" : "secondary"}
          className="df-g8 al-c"
          onClick={() => setSalesFilterExpanded(!salesFilterExpanded)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-70"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>
            {salesDateFrom || salesDateTo
              ? `${salesDateFrom || "..."} → ${salesDateTo || "..."}`
              : "Filter by Date"}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`chevron-icon-rotatable${salesFilterExpanded ? " chevron-rotated" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Button>

        {salesFilterExpanded && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
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

  const userFiltersBtn = selectedUserIds.length > 0 && (
    <Button
      variant="danger"
      onClick={() => {
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
      }}
    >
      <img
        src="/assets/icons/delete.svg"
        width="16"
        className="icon-red"
        alt=""
      />
      <span><span className="hide-mobile">Delete Selected </span>({selectedUserIds.length})</span>
    </Button>
  );

  const addUserBtn = (
    <Button
      variant="primary"
      onClick={() => setNewUserRow(true)}
    >
      <img src="/assets/icons/add.svg" width="18" alt="" />
      <span>Add User</span>
    </Button>
  );

  const blogActionsBtn = (
    <div className="df-g8 al-c">
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
              }
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
  );

  const createBlogBtn = (
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
  );

  const createBlogActionsBtn = (
    <Button
      variant="secondary"
      onClick={() => {
        setEditingBlog(null);
        setPage("blogs");
      }}
    >
      <span>Back to list</span>
    </Button>
  );

  const systemStatusActionsBtn = (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: sysIsOperational === false ? "var(--red)" : "var(--green)",
            boxShadow: sysIsOperational === false ? "0 0 6px var(--red)" : "0 0 6px var(--green)",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
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
      createBlogActionsBtn={createBlogActionsBtn}
      systemStatusActionsBtn={systemStatusActionsBtn}
      systemStatusOperational={sysIsOperational}
      resourcesHeaderLeft={resourcesHeaderLeft}
      resourcesActionsBtn={resourcesActionsBtn}
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
            setConfirmModal={setConfirmModal}
            search={blogSearch}
            onSearchChange={setBlogSearch}
            statusFilter={blogStatusFilter}
            onStatusFilterChange={setBlogStatusFilter}
            categoryFilter={blogCategoryFilter}
            onCategoryFilterChange={setBlogCategoryFilter}
          />
        )}

        {page === "create-blog" && (
          <CreateBlog
            editingBlog={editingBlog}
            blogCategories={blogCategories}
            onSaveBlog={handleSaveBlog}
            showToast={showToast}
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

      {/* Add / Edit Client Modal overlay has been replaced with inline editing */}



      {/* 5-minute Inactivity Session Expired Overlay Modal */}
      {sessionExpired && (
        <div className="modal-overlay active">
          <div className="modal modal-sm">
            <div className="modal-icon">
              <img
                src="/assets/icons/log-out.svg"
                alt="Info"
                width="24"
                height="24"
              />
            </div>
            <div className="modal-header">
              <div className="modal-title">Session Expired</div>
            </div>
            <div className="text-muted mb-24 modal-body-text">
              Your session expired due to inactivity. Please sign in again to
              continue using ReelScale.
            </div>
            <div className="form-footer">
              <Button
                variant="primary"
                onClick={() => {
                  setSessionExpired(false);
                  router.push("/dashboard/login/");
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
        <div className="modal-overlay active">
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
    </Layout>
  );
}
export const dynamic = "force-dynamic";
