import React, { useState, useEffect, useCallback } from "react";
import { User, DashboardPage } from "../types";
import { CustomSelect } from "./CustomSelect";
import { Button } from "@/components/ui";
import { IconLogOut, IconSidebar } from "./Icons";
import { STORAGE_KEYS } from "../constants";
import { ArrowLeft, AlertTriangle } from "lucide-react";

interface SubNavItem {
  id: DashboardPage;
  icon: string;
  label: string;
}

interface NavItem {
  id: DashboardPage | string;
  icon: string;
  label: string;
  isGroup?: boolean;
  subItems?: SubNavItem[];
}

interface LayoutProps {
  page: DashboardPage;
  setPage: (page: DashboardPage) => void;
  user: User | null;
  logout: () => void;
  children: React.ReactNode;
  searchBar?: React.ReactNode;
  // Specific action buttons for Topbar
  clientFiltersBtn?: React.ReactNode;
  addClientBtn?: React.ReactNode;
  addSaleBtn?: React.ReactNode;
  userFiltersBtn?: React.ReactNode;
  addUserBtn?: React.ReactNode;
  salesFiltersBtn?: React.ReactNode;
  blogActionsBtn?: React.ReactNode;
  createBlogBtn?: React.ReactNode;
  createBlogHeaderLeft?: React.ReactNode;
  createBlogActionsBtn?: React.ReactNode;
  systemStatusActionsBtn?: React.ReactNode;
  systemStatusOperational?: boolean | null;
  resourcesHeaderLeft?: React.ReactNode;
  resourcesActionsBtn?: React.ReactNode;
  aiWritingHeaderLeft?: React.ReactNode;
  aiWritingActionsBtn?: React.ReactNode;
  aiSettingsHeaderLeft?: React.ReactNode;
  aiSettingsActionsBtn?: React.ReactNode;
  toast?: React.ReactNode;
  selectedMonth?: string;
  setSelectedMonth?: (month: string) => void;
  availableMonths?: { key: string; label: string }[];
}

export function Layout({
  page,
  setPage,
  user,
  logout,
  children,
  searchBar,
  clientFiltersBtn,
  addClientBtn,
  addSaleBtn,
  userFiltersBtn,
  addUserBtn,
  salesFiltersBtn,
  blogActionsBtn,
  createBlogBtn,
  createBlogHeaderLeft,
  createBlogActionsBtn,
  systemStatusActionsBtn,
  systemStatusOperational,
  resourcesHeaderLeft,
  resourcesActionsBtn,
  aiWritingHeaderLeft,
  aiWritingActionsBtn,
  aiSettingsHeaderLeft,
  aiSettingsActionsBtn,
  toast,
  selectedMonth,
  setSelectedMonth,
  availableMonths = [],
}: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const role = user?.role?.toLowerCase();

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCollapsed = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
        if (savedCollapsed !== null) {
          setSidebarCollapsed(savedCollapsed === "true");
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme =
        (localStorage.getItem(STORAGE_KEYS.THEME) as "light" | "dark") || "dark";
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      if (savedTheme === "light") {
        document.body.classList.add("light-theme");
      } else {
        document.body.classList.remove("light-theme");
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    if (newTheme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
  };

  const isBlogsActive =
    page === "blogs" ||
    page === "ai-blog-writing" ||
    page === "ai-blog-settings" ||
    page === "create-blog" ||
    page === "blog-categories";

  const [blogsOpen, setBlogsOpen] = useState(false);

  useEffect(() => {
    setBlogsOpen(isBlogsActive);
  }, [isBlogsActive]);

  const nav: NavItem[] =
    role === "sales"
      ? [
        {
          id: "sales",
          icon: "/assets/icons/nav-sales.svg",
          label: "Sales",
        },
      ]
      : role === "blogger"
        ? [
          {
            id: "blogs-group",
            icon: "/assets/icons/blog.svg",
            label: "Blogs",
            isGroup: true,
            subItems: [
              {
                id: "blogs",
                icon: "/assets/icons/nav-blog-manage.svg",
                label: "Blog Management",
              },
              {
                id: "ai-blog-writing",
                icon: "/assets/icons/nav-ai-writing.svg",
                label: "AI Blog Writing",
              },
              {
                id: "ai-blog-settings",
                icon: "/assets/icons/nav-ai-settings.svg",
                label: "AI Blog Settings",
              },
            ],
          },
        ]
        : [
          {
            id: "dashboard",
            icon: "/assets/icons/nav-dashboard.svg",
            label: "Dashboard",
          },
          {
            id: "clients",
            icon: "/assets/icons/nav-clients.svg",
            label: "Clients",
          },
          {
            id: "users",
            icon: "/assets/icons/nav-users.svg",
            label: "Users",
          },
          {
            id: "sales",
            icon: "/assets/icons/nav-sales.svg",
            label: "Sales",
          },
          {
            id: "blogs-group",
            icon: "/assets/icons/blog.svg",
            label: "Blogs",
            isGroup: true,
            subItems: [
              {
                id: "blogs",
                icon: "/assets/icons/nav-blog-manage.svg",
                label: "Blog Management",
              },
              {
                id: "ai-blog-writing",
                icon: "/assets/icons/nav-ai-writing.svg",
                label: "AI Blog Writing",
              },
              {
                id: "ai-blog-settings",
                icon: "/assets/icons/nav-ai-settings.svg",
                label: "AI Blog Settings",
              },
            ],
          },
          {
            id: "resources",
            icon: "/assets/icons/nav-resources-v2.svg",
            label: "Resources",
          },
          {
            id: "system-status",
            icon: "/assets/icons/nav-status.svg",
            label: "System Status",
          },
        ];

  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    clients: "Clients",
    analytics: "Dashboard",
    users: "Users",
    sales: "Sales",
    blogs: "Blog Management",
    "ai-blog-writing": "AI Blog Writing Studio",
    "ai-blog-settings": "AI Blog Automation Settings",
    "create-blog": "Create Blog Post",
    "blog-categories": "Blog Categories",
    resources: "Resources",
    "system-status": "System Status",
  };

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          {!sidebarCollapsed ? (
            <>
              <a
                href="/"
                className="sidebar-brand"
                style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
              >
                <img
                  src="/assets/logo.svg"
                  alt="ReelScale Logo"
                  className="sidebar-brand-logo"
                />
              </a>
              <div className="sidebar-toggle-wrap">
                <button
                  type="button"
                  className="sidebar-toggle-btn"
                  onClick={toggleSidebar}
                  aria-label="Collapse sidebar"
                  title="Close sidebar"
                >
                  <IconSidebar size={18} />
                  <div className="sidebar-tooltip-pill sidebar-tooltip-expanded">
                    <span>Close sidebar</span>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <div className="sidebar-collapsed-trigger-wrap">
              <button
                type="button"
                className="sidebar-collapsed-trigger"
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <span className="collapsed-logo-icon">
                  <img
                    src="/assets/icons/logo-small.svg"
                    alt="ReelScale Logo"
                  />
                </span>
                <span className="collapsed-toggle-icon">
                  <IconSidebar size={20} />
                </span>
                <div className="sidebar-tooltip-pill sidebar-tooltip-pop">
                  <span>Toggle sidebar</span>
                </div>
              </button>
            </div>
          )}
        </div>
        <div className="nav">
          {nav.map((n) => {
            if (n.isGroup && n.subItems) {
              return (
                <div key={n.id} className="nav-group">
                  <button
                    type="button"
                    className={`nav-group-toggle ${isBlogsActive ? "active" : ""}`}
                    onClick={() => {
                      if (sidebarCollapsed) {
                        setPage("blogs");
                        return;
                      }
                      if (!isBlogsActive) {
                        setPage("blogs");
                        setBlogsOpen(true);
                      } else {
                        setBlogsOpen((prev) => !prev);
                      }
                    }}
                    data-tooltip={sidebarCollapsed ? n.label : undefined}
                    aria-expanded={blogsOpen}
                  >
                    <img src={n.icon} alt={n.label} className="nav-icon" />
                    {!sidebarCollapsed && (
                      <span
                        className="nav-label"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <span>{n.label}</span>
                        <span
                          className={`nav-chevron ${blogsOpen ? "open" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setBlogsOpen((prev) => !prev);
                          }}
                          title={blogsOpen ? "Collapse submodules" : "Expand submodules"}
                        />
                      </span>
                    )}
                  </button>

                  {/* Submodules – Expanded in sidebar */}
                  {!sidebarCollapsed && (
                    <div className={`nav-submenu ${blogsOpen ? "open" : ""}`}>
                      {n.subItems.map((sub) => {
                        const isSubActive =
                          page === sub.id ||
                          (sub.id === "blogs" &&
                            (page === "create-blog" || page === "blog-categories"));
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            className={`nav-sub-item ${isSubActive ? "active" : ""}`}
                            onClick={() => setPage(sub.id)}
                          >
                            <img src={sub.icon} alt={sub.label} className="nav-sub-icon" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Submodules – Floating flyout menu when sidebar is collapsed */}
                  {sidebarCollapsed && (
                    <div className="nav-collapsed-flyout">
                      <div className="flyout-header">{n.label}</div>
                      {n.subItems.map((sub) => {
                        const isSubActive =
                          page === sub.id ||
                          (sub.id === "blogs" &&
                            (page === "create-blog" || page === "blog-categories"));
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            className={`flyout-item ${isSubActive ? "active" : ""}`}
                            onClick={() => setPage(sub.id)}
                          >
                            <img src={sub.icon} alt={sub.label} className="nav-sub-icon" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={n.id}
                className={`nav-item ${page === n.id ? "active" : ""}`}
                onClick={() => {
                  setPage(n.id as DashboardPage);
                }}
                data-tooltip={sidebarCollapsed ? n.label : undefined}
              >
                <img src={n.icon} alt={n.label} className="nav-icon" />
                {!sidebarCollapsed && (
                  <span
                    className="nav-label"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <span>{n.label}</span>
                    {n.id === "system-status" && systemStatusOperational === false && (
                      <span
                        title="Issues Detected"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          marginLeft: "auto",
                          flexShrink: 0,
                        }}
                      >
                        <AlertTriangle
                          size={15}
                          style={{
                            color: "var(--red)",
                          }}
                        />
                      </span>
                    )}
                  </span>
                )}
                {sidebarCollapsed && n.id === "system-status" && systemStatusOperational === false && (
                  <span
                    title="Issues Detected"
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <AlertTriangle
                      size={12}
                      style={{
                        color: "var(--red)",
                      }}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avatar">
              {(user?.name || "A")[0].toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <div className="user-name">{user?.name || ""}</div>
                <div
                  className="user-role"
                  title={`${user?.role || ""} (${user?.email || ""})`}
                >
                  {user?.role || ""}
                </div>
              </div>
            )}
            <span
              className="logout-btn-wrap"
              data-tooltip={sidebarCollapsed ? "Logout" : undefined}
            >
              <button
                type="button"
                className="logout-btn"
                onClick={logout}
                title="Logout"
                aria-label="Logout"
              >
                <IconLogOut size={18} />
              </button>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`main ${sidebarCollapsed ? "collapsed" : ""}`}>
        {/* Topbar Header */}
        <div className="topbar">
          <div className="topbar-left mobile-topbar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <img src="/assets/icons/menu.svg" width="20" alt="Menu" />
            </button>
            {page === "resources" && resourcesHeaderLeft ? (
              resourcesHeaderLeft
            ) : page === "create-blog" && createBlogHeaderLeft ? (
              createBlogHeaderLeft
            ) : page === "ai-blog-writing" && aiWritingHeaderLeft ? (
              aiWritingHeaderLeft
            ) : page === "ai-blog-settings" && aiSettingsHeaderLeft ? (
              aiSettingsHeaderLeft
            ) : (
              <div className="page-title">{titles[page] || ""}</div>
            )}
          </div>

          <div className="topbar-actions">
            <div className="df-g8 al-c">
              {/* Search bar beside left from all primary, secondary, tertiary elements and dropdowns */}
              {searchBar && (
                <div className="topbar-search-wrap">
                  {searchBar}
                </div>
              )}

              {/* Month Filter Selector */}
              {selectedMonth !== undefined && setSelectedMonth && availableMonths.length > 0 &&
                (page === "dashboard" || page === "clients" || page === "analytics") && (
                  <div className="month-filter-wrap">
                    <CustomSelect
                      value={selectedMonth}
                      onChange={setSelectedMonth}
                      options={[
                        { value: "all", label: "All Months" },
                        ...availableMonths.map((m) => ({ value: m.key, label: m.label })),
                      ]}
                      align="right"
                    />
                  </div>
                )}

              {page === "clients" && clientFiltersBtn}
              {page === "sales" && salesFiltersBtn}
              {page === "users" && userFiltersBtn}
              {page === "blogs" && blogActionsBtn}
              {page === "create-blog" && createBlogActionsBtn}
              {page === "blog-categories" && (
                <Button
                  variant="secondary"
                  pill
                  className="btn-secondary"
                  onClick={() => {
                    setPage("blogs");
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to list</span>
                </Button>
              )}

              {/* Primary action buttons on pure right side (at the end) */}
              {page === "clients" && addClientBtn}
              {page === "sales" && addSaleBtn}
              {page === "users" && addUserBtn}
              {page === "blogs" && createBlogBtn}
              {page === "system-status" && systemStatusActionsBtn}
              {page === "resources" && resourcesActionsBtn}
              {page === "ai-blog-writing" && aiWritingActionsBtn}
              {page === "ai-blog-settings" && aiSettingsActionsBtn}

              {/* Theme Toggle Button - Made consistently visible for premium feel */}
              <Button
                variant="ghost"
                size="icon"
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title="Toggle Theme"
              >
                <img
                  src={
                    theme === "light"
                      ? "/assets/icons/light-theme.svg"
                      : "/assets/icons/dark-theme.svg"
                  }
                  alt="Theme"
                  width="20"
                  height="20"
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Dynamic Children Pages Content */}
        <div className="content">{children}</div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay active"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("mobile-menu-overlay")) {
              setMobileMenuOpen(false);
            }
          }}
        >
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <img src="/assets/logo.svg" height="22" alt="Logo" />
              <Button
                variant="ghost"
                size="icon"
                className="mobile-close-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img
                  src="/assets/icons/close.svg"
                  alt="Close"
                  width="18"
                  height="18"
                />
              </Button>
            </div>
            {nav.map((item) => {
              if (item.isGroup && item.subItems) {
                return (
                  <div key={item.id} className="mobile-nav-group">
                    <button
                      type="button"
                      className={`mobile-nav-item ${isBlogsActive ? "active" : ""}`}
                      onClick={() => setBlogsOpen((prev) => !prev)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img src={item.icon} width="18" alt={item.label} />
                        <span>{item.label}</span>
                      </div>
                      <span className={`nav-chevron ${blogsOpen ? "open" : ""}`} />
                    </button>
                    {blogsOpen && (
                      <div className="mobile-nav-submenu">
                        {item.subItems.map((sub) => {
                          const isSubActive =
                            page === sub.id ||
                            (sub.id === "blogs" &&
                              (page === "create-blog" || page === "blog-categories"));
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              className={`mobile-nav-sub-item ${isSubActive ? "active" : ""}`}
                              onClick={() => {
                                setPage(sub.id);
                                localStorage.setItem(STORAGE_KEYS.CURRENT_PAGE, sub.id);
                                setMobileMenuOpen(false);
                              }}
                            >
                              <img src={sub.icon} width="16" alt={sub.label} />
                              <span>{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  className={`mobile-nav-item ${page === item.id ? "active" : ""}`}
                  onClick={() => {
                    setPage(item.id as DashboardPage);
                    localStorage.setItem(STORAGE_KEYS.CURRENT_PAGE, item.id);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img src={item.icon} width="18" alt={item.label} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === "system-status" && systemStatusOperational === false && (
                    <span
                      title="Issues Detected"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <AlertTriangle
                        size={15}
                        style={{
                          color: "var(--red)",
                        }}
                      />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {toast}
    </div>
  );
}
export default Layout;
