"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { Layout } from "./components/Layout";
import { Modal } from "./components/Modal";
import { Client, User, Lead, Blog, DashboardPage } from "./types";
import {
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
import { Analytics } from "./modules/Analytics";
import { Users } from "./modules/Users";
import { Sales } from "./modules/Sales";
import { Blogs } from "./modules/Blogs";
import { CreateBlog } from "./modules/CreateBlog";
import { BlogCategories } from "./modules/BlogCategories";

export default function DashboardMainPage() {
  const router = useRouter();
  const auth = useAuth();
  const { isLoggedIn, role, user, logout, sessionExpired, setSessionExpired } = auth;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Selected tab route state (synced with localStorage)
  const [page, setPage] = useLocalStorage<DashboardPage>("reelscale_current_page", "dashboard");

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
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newUserRow, setNewUserRow] = useState(false);
  const [newLeadRow, setNewLeadRow] = useState(false);
  const [salesFilterExpanded, setSalesFilterExpanded] = useState(false);

  // Active blog being edited
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  // Active selected leads for bulk delete option
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedBlogIds, setSelectedBlogIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [newClientRow, setNewClientRow] = useState(false);

  useEffect(() => {
    setSelectedLeadIds([]);
    setSelectedClientIds([]);
    setSelectedBlogIds([]);
    setSelectedUserIds([]);
    setNewUserRow(false);
    setNewLeadRow(false);
    setNewClientRow(false);
  }, [page]);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Toast message states
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "success" | "error" | "loading" }>
  >([]);

  const showToast = useCallback(
    (msg: string, type: "success" | "error" | "loading" = "success") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message: msg, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  // Check login authentication
  useEffect(() => {
    const authFlag = localStorage.getItem("reelscale_auth") === "1";
    if (!authFlag) {
      router.push("/dashboard/login/");
    }
  }, [isLoggedIn, router]);

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

    if (role === "admin") {
      loadClientsData();
      loadUsersData();
      loadSalesData();
      loadBlogsData();
    } else if (role === "sales") {
      loadSalesData();
    } else if (role === "blogger") {
      loadBlogsData();
    }
  }, [role]);

  // Clients modifications
  const handleAddClient = async (clientData: Omit<Client, "id">) => {
    try {
      await apiAddClient(clientData);
      showToast("Client added successfully");
      const data = await fetchClients();
      setClients(data);
      localStorage.setItem("clients_cache", JSON.stringify(data));
    } catch (err: any) {
      showToast(err.message || "Failed to add client", "error");
    }
  };

  const handleUpdateClient = async (
    id: string | number,
    clientData: Omit<Client, "id">
  ) => {
    showToast("Updating...", "loading");
    const backup = [...clients];
    setClients((prev) =>
      prev.map((c) => (String(c.id) === String(id) ? { ...c, ...clientData } : c))
    );
    try {
      await apiUpdateClient(id, clientData);
      showToast("Client updated successfully");
      const data = await fetchClients();
      setClients(data);
      localStorage.setItem("clients_cache", JSON.stringify(data));
    } catch (err: any) {
      setClients(backup);
      showToast(err.message || "Failed to update client", "error");
    }
  };

  const handleDeleteClient = async (id: string | number) => {
    try {
      await apiDeleteClient(id);
      showToast("Client deleted successfully");
      const data = await fetchClients();
      setClients(data);
      localStorage.setItem("clients_cache", JSON.stringify(data));
    } catch (err: any) {
      showToast(err.message || "Failed to delete client", "error");
    }
  };

  // User database updates
  const handleAddUser = async (userData: Omit<User, "id">) => {
    await apiAddUser(userData);
    showToast("User added successfully");
    const data = await fetchUsers();
    setUsers(data);
    localStorage.setItem("users_cache", JSON.stringify(data));
  };

  const handleUpdateUser = async (id: string | number, userData: User) => {
    showToast("Updating...", "loading");
    // Optimistic UI updates
    setUsers((prev) =>
      prev.map((u) => (String(u.id) === String(id) ? { ...u, ...userData } : u))
    );
    try {
      await apiUpdateUser(id, userData);
      showToast("User updated successfully");
      const data = await fetchUsers();
      setUsers(data);
      localStorage.setItem("users_cache", JSON.stringify(data));
    } catch (err: any) {
      showToast(err.message || "Failed to update user", "error");
      // Revert from backend database
      const cached = localStorage.getItem("users_cache");
      if (cached) setUsers(JSON.parse(cached));
    }
  };

  const handleDeleteUser = async (id: string | number) => {
    // Optimistic UI updates
    const backup = [...users];
    setUsers((prev) => prev.filter((u) => String(u.id) !== String(id)));
    try {
      await apiDeleteUser(id);
      showToast("User deleted successfully");
      const data = await fetchUsers();
      setUsers(data);
      localStorage.setItem("users_cache", JSON.stringify(data));
    } catch (err: any) {
      showToast(err.message || "Failed to delete user", "error");
      setUsers(backup);
    }
  };

  // Lead additions
  const handleAddLead = async (leadData: Omit<Lead, "id" | "createdDate">) => {
    // Optimistic UI update
    const tempLead: Lead = {
      id: Date.now(),
      createdDate: new Date().toISOString().split("T")[0],
      ...leadData,
    };
    setLeads((prev) => [tempLead, ...prev]);

    try {
      await apiAddLead(leadData);
      showToast("Lead added successfully");
      const data = await fetchLeads();
      setLeads(data);
      localStorage.setItem("sales_cache", JSON.stringify(data));
    } catch (err: any) {
      // Revert on error
      setLeads((prev) => prev.filter((l) => l.id !== tempLead.id));
      showToast(err.message || "Failed to add lead", "error");
    }
  };

  const handleUpdateLead = async (
    id: string | number,
    leadData: Omit<Lead, "id" | "createdDate">
  ) => {
    showToast("Updating...", "loading");
    const backup = [...leads];
    setLeads((prev) =>
      prev.map((l) => (String(l.id) === String(id) ? { ...l, ...leadData } : l))
    );
    try {
      await apiUpdateLead(id, leadData);
      showToast("Lead updated successfully");
      const data = await fetchLeads();
      setLeads(data);
      localStorage.setItem("sales_cache", JSON.stringify(data));
    } catch (err: any) {
      setLeads(backup);
      showToast(err.message || "Failed to save lead updates", "error");
    }
  };

  const handleDeleteLead = async (id: string | number) => {
    const backup = [...leads];
    setLeads((prev) => prev.filter((l) => String(l.id) !== String(id)));
    try {
      await apiDeleteLead(id);
      showToast("Lead deleted successfully");
      const data = await fetchLeads();
      setLeads(data);
      localStorage.setItem("sales_cache", JSON.stringify(data));
    } catch (err: any) {
      setLeads(backup);
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
      // Reload blog data
      setBlogsLoading(true);
      const data = await fetchBlogs();
      setBlogs(data);
    } catch (err: any) {
      showToast(err.message || "Failed to save blog", "error");
    } finally {
      setBlogsLoading(false);
    }
  };

  const handleDeleteBlog = async (id: string | number) => {
    try {
      await apiDeleteBlog(id);
      showToast("Blog deleted successfully");
      setBlogsLoading(true);
      const data = await fetchBlogs();
      setBlogs(data);
    } catch (err: any) {
      showToast(err.message || "Failed to delete blog", "error");
    } finally {
      setBlogsLoading(false);
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
  const addClientBtn = (
    <div className="df-g8 al-c">
      {selectedClientIds.length > 0 && (
        <button
          className="btn btn-danger"
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
        </button>
      )}

      <button
        className="btn btn-primary"
        onClick={() => {
          setNewClientRow(true);
        }}
      >
        <span>
          <img
            src="/assets/icons/add.svg"
            alt="Add"
            width="20"
          />
        </span>
        <span>Add Client</span>
      </button>
    </div>
  );

  const addSaleBtn = (
    <button
      className="btn btn-primary"
      onClick={() => setNewLeadRow(true)}
    >
      <img src="/assets/icons/add.svg" width="18" alt="" />
      <span>Add Lead</span>
    </button>
  );

  const salesFiltersBtn = (
    <>
      {selectedLeadIds.length > 0 && (
        <button
          className="btn btn-danger"
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
        </button>
      )}

      <button
        className="btn btn-ghost df-g8 al-c"
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
        <span>Filter by Date</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="chevron-icon-rotatable"
          style={{
            transform: salesFilterExpanded ? "rotate(180deg)" : "none",
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <button
        className="btn btn-ghost"
        onClick={() => {
          const trigger = document.getElementById(
            "import-sales-btn-trigger"
          );
          if (trigger) trigger.click();
        }}
      >
        <img src="/assets/icons/upload.svg" width="18" alt="" />
        <span>Import XLS</span>
      </button>
    </>
  );

  const addUserBtn = (
    <div className="df-g8 al-c">
      {selectedUserIds.length > 0 && (
        <button
          className="btn btn-danger"
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
        </button>
      )}

      <button
        className="btn btn-primary"
        onClick={() => setNewUserRow(true)}
      >
        <img src="/assets/icons/add.svg" width="18" alt="" />
        <span>Add User</span>
      </button>
    </div>
  );

  const blogActionsBtn = (
    <>
      {selectedBlogIds.length > 0 && (
        <button
          className="btn btn-danger"
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
        </button>
      )}

      <button
        className="btn btn-ghost"
        onClick={() => setPage("blog-categories")}
      >
        <img
          src="/assets/icons/nav-analytics.svg"
          width="18"
          className="opacity-70"
          alt=""
        />
        <span>Categories</span>
      </button>
      <button
        className="btn btn-primary"
        onClick={() => {
          setEditingBlog(null);
          setPage("create-blog");
        }}
      >
        <img src="/assets/icons/add.svg" width="18" alt="" />
        <span>Create Blog</span>
      </button>
    </>
  );

  const createBlogActionsBtn = (
    <button
      className="btn btn-ghost"
      onClick={() => {
        setEditingBlog(null);
        setPage("blogs");
      }}
    >
      <span>Back to list</span>
    </button>
  );

  return (
    <Layout
      page={page}
      setPage={setPage}
      user={user}
      logout={logout}
      addClientBtn={addClientBtn}
      addSaleBtn={addSaleBtn}
      addUserBtn={addUserBtn}
      salesFiltersBtn={salesFiltersBtn}
      blogActionsBtn={blogActionsBtn}
      createBlogActionsBtn={createBlogActionsBtn}
      toast={
        mounted && typeof document !== "undefined" && toasts.length > 0
          ? createPortal(
              <div className="toasts-container">
                {[...toasts].reverse().map((t, idx) => (
                  <div
                    key={t.id}
                    className={`toast ${t.type}`}
                    style={{ "--index": idx } as any}
                  >
                    {t.type === "loading" ? (
                      <div className="toast-loading-spinner" />
                    ) : (
                      <div className={`toast-icon-wrap ${t.type}`}>
                        {t.type === "success" ? (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                        ) : (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        )}
                      </div>
                    )}
                    <span className="toast-message">{t.message}</span>
                    <button
                      className="toast-close-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setToasts((prev) => prev.filter((item) => item.id !== t.id));
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>,
              document.body
            )
          : null
      }
    >
      {/* Active page views wrapped in a premium entrance animation container */}
      <div key={page} className="active-view">
        {page === "dashboard" && (
          <Overview clients={clients} isLoading={clientsLoading} />
        )}

        {page === "clients" && (
          <Clients
            clients={clients}
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
          />
        )}

        {page === "analytics" && (
          <Analytics clients={clients} isLoading={clientsLoading} />
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
          />
        )}

        {page === "sales" && (
          <Sales
            leads={leads}
            isLoading={leadsLoading}
            newLeadRow={newLeadRow}
            setNewLeadRow={setNewLeadRow}
            salesFilterExpanded={salesFilterExpanded}
            setSalesFilterExpanded={setSalesFilterExpanded}
            selectedLeadIds={selectedLeadIds}
            setSelectedLeadIds={setSelectedLeadIds}
            onAddLead={handleAddLead}
            onUpdateLead={handleUpdateLead}
            onDeleteLead={handleDeleteLead}
            showToast={showToast}
            setConfirmModal={setConfirmModal}
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
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSessionExpired(false);
                  router.push("/dashboard/login/");
                }}
              >
                Login Again
              </button>
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
              <button
                className="btn btn-ghost btn-auto"
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-auto"
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await action();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
export const dynamic = "force-dynamic";
