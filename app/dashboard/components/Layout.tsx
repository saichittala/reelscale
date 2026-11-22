import React, { useState, useEffect, useCallback } from "react";
import { User, DashboardPage } from "../types";
import { CustomSelect } from "./CustomSelect";
import { Button } from "@/components/ui";
import { IconLogOut, IconSidebar } from "./Icons";

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
  createBlogActionsBtn?: React.ReactNode;
  systemStatusActionsBtn?: React.ReactNode;
  systemStatusOperational?: boolean | null;
  resourcesHeaderLeft?: React.ReactNode;
  resourcesActionsBtn?: React.ReactNode;
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
  createBlogActionsBtn,
  systemStatusActionsBtn,
  systemStatusOperational,
  resourcesHeaderLeft,
  resourcesActionsBtn,
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
        localStorage.setItem("sidebarCollapsed", String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCollapsed = localStorage.getItem("sidebarCollapsed");
        if (savedCollapsed !== null) {
          setSidebarCollapsed(savedCollapsed === "true");
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme =
        (localStorage.getItem("theme") as "light" | "dark") || "dark";
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
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    if (newTheme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
  };

  const nav =
    role === "sales"
      ? [
        {
          id: "sales" as DashboardPage,
          icon: "/assets/icons/nav-sales.svg",
          label: "Sales",
        },
      ]
      : role === "blogger"
        ? [
          {
            id: "blogs" as DashboardPage,
            icon: "/assets/icons/blog.svg",
            label: "Blogs",
          },
        ]
        : [
          {
            id: "dashboard" as DashboardPage,
            icon: "/assets/icons/nav-dashboard.svg",
            label: "Dashboard",
          },
          {
            id: "clients" as DashboardPage,
            icon: "/assets/icons/nav-clients.svg",
            label: "Clients",
          },
          {
            id: "users" as DashboardPage,
            icon: "/assets/icons/nav-users.svg",
            label: "Users",
          },
          {
            id: "sales" as DashboardPage,
            icon: "/assets/icons/nav-sales.svg",
            label: "Sales",
          },
          {
            id: "blogs" as DashboardPage,
            icon: "/assets/icons/blog.svg",
            label: "Blogs",
          },
          {
            id: "resources" as DashboardPage,
            icon: "/assets/icons/nav-resources-v2.svg",
            label: "Resources",
          },
          {
            id: "system-status" as DashboardPage,
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
          {nav.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => {
                setPage(n.id);
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
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        backgroundColor: "var(--red)",
                        boxShadow: "0 0 6px var(--red)",
                        marginLeft: "auto",
                        flexShrink: 0,
                      }}
                      title="Issues Detected"
                    />
                  )}
                </span>
              )}
              {sidebarCollapsed && n.id === "system-status" && systemStatusOperational === false && (
                <span
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "var(--red)",
                    boxShadow: "0 0 6px var(--red)",
                  }}
                  title="Issues Detected"
                />
              )}
            </button>
          ))}
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
              {(page === "create-blog" || page === "blog-categories") &&
                createBlogActionsBtn}

              {/* Primary action buttons on pure right side (at the end) */}
              {page === "clients" && addClientBtn}
              {page === "sales" && addSaleBtn}
              {page === "users" && addUserBtn}
              {page === "blogs" && createBlogBtn}
              {page === "system-status" && systemStatusActionsBtn}
              {page === "resources" && resourcesActionsBtn}

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
            {nav.map((item) => (
              <button
                key={item.id}
                className={`mobile-nav-item ${page === item.id ? "active" : ""}`}
                onClick={() => {
                  setPage(item.id);
                  localStorage.setItem("reelscale_current_page", item.id);
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
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--red)",
                      boxShadow: "0 0 6px var(--red)",
                    }}
                    title="Issues Detected"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      {toast}
    </div>
  );
}
export default Layout;
