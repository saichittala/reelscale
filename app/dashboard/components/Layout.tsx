import React, { useState, useEffect } from "react";
import { User, DashboardPage } from "../types";
import { CustomSelect } from "./CustomSelect";

interface LayoutProps {
  page: DashboardPage;
  setPage: (page: DashboardPage) => void;
  user: User | null;
  logout: () => void;
  children: React.ReactNode;
  // Specific action buttons for Topbar
  addClientBtn?: React.ReactNode;
  addSaleBtn?: React.ReactNode;
  addUserBtn?: React.ReactNode;
  salesFiltersBtn?: React.ReactNode;
  blogActionsBtn?: React.ReactNode;
  createBlogActionsBtn?: React.ReactNode;
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
  addClientBtn,
  addSaleBtn,
  addUserBtn,
  salesFiltersBtn,
  blogActionsBtn,
  createBlogActionsBtn,
  toast,
  selectedMonth,
  setSelectedMonth,
  availableMonths = [],
}: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const role = user?.role?.toLowerCase();

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
            id: "analytics" as DashboardPage,
            icon: "/assets/icons/nav-analytics.svg",
            label: "Analytics",
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
        ];

  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    clients: "Clients",
    analytics: "Revenue Analytics",
    users: "Users",
    sales: "Sales",
    blogs: "Blog Management",
    "create-blog": "Create Blog Post",
    "blog-categories": "Blog Categories",
  };

  const subs: Record<string, string> = {
    dashboard: "Overview of your business metrics",
    clients: "Manage all client accounts",
    analytics: "Detailed revenue insights",
    users: "Manage system users",
    sales: "Manage sales leads",
    blogs: "Manage your publication and draft posts",
    "create-blog": "Compose, preview and optimize your article",
    "blog-categories": "Manage blog taxonomies and organization",
  };

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand" : "Collapse"}
        ></button>
        <a href="/" className="dashboard-logo" style={{ display: "block", textDecoration: "none" }}>
          <img
            src={
              sidebarCollapsed
                ? "/assets/icons/logo-small.svg"
                : "/assets/logo.svg"
            }
            alt="ReelScale Logo"
          />
          {!sidebarCollapsed && (
            <div className="logo-sub">Reel Production House</div>
          )}
        </a>
        <div className="nav">
          {nav.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => {
                setPage(n.id);
                localStorage.setItem("reelscale_current_page", n.id);
              }}
              data-tooltip={sidebarCollapsed ? n.label : undefined}
            >
              <img src={n.icon} alt={n.label} className="nav-icon" />
              {!sidebarCollapsed && (
                <span className="nav-label">{n.label}</span>
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
              onClick={logout}
            >
              <img
                src="/assets/icons/log-out.svg"
                alt="Logout"
                className="logout-btn"
                title="Logout"
              />
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`main ${sidebarCollapsed ? "collapsed" : ""}`}>
        {/* Topbar Header */}
        <div className="topbar">
          <div className="mobile-topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <img src="/assets/icons/menu.svg" width="20" alt="Menu" />
            </button>
            <div>
              <div className="page-title">{titles[page] || ""}</div>
              <div className="page-sub">{subs[page] || ""}</div>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="df-g8">
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

              {page === "clients" && addClientBtn}
              {page === "sales" && salesFiltersBtn}
              {page === "sales" && addSaleBtn}
              {page === "users" && addUserBtn}
              {page === "blogs" && blogActionsBtn}
              {(page === "create-blog" || page === "blog-categories") &&
                createBlogActionsBtn}

              {/* Theme Toggle Button - Made consistently visible for premium feel */}
              <button
                className="btn-ghost theme-toggle-btn"
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
              </button>
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
              <button
                className="mobile-close-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img
                  src="/assets/icons/close.svg"
                  alt="Close"
                  width="18"
                  height="18"
                />
              </button>
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
              >
                <img src={item.icon} width="18" alt={item.label} />
                {item.label}
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
