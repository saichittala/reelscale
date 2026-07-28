import React, { useState, useEffect } from "react";
import { User } from "../types";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { CustomSelect } from "../components/CustomSelect";
import { SortIcon } from "../components/SortIcon";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "sales", label: "Sales" },
  { value: "blogger", label: "Blogger" },
];

interface UsersProps {
  users: User[];
  isLoading: boolean;
  newUserRow: boolean;
  setNewUserRow: (show: boolean) => void;
  selectedUserIds: string[];
  setSelectedUserIds: React.Dispatch<React.SetStateAction<string[]>>;
  onAddUser: (user: Omit<User, "id">) => Promise<void>;
  onUpdateUser: (id: string | number, user: User) => Promise<void>;
  onDeleteUser: (id: string | number) => Promise<void>;
  showToast: (msg: string, type?: "success" | "error") => void;
  setConfirmModal: React.Dispatch<
    React.SetStateAction<{
      title: string;
      message: string;
      onConfirm: () => void | Promise<void>;
    } | null>
  >;
}

export function Users({
  users,
  isLoading,
  newUserRow,
  setNewUserRow,
  selectedUserIds,
  setSelectedUserIds,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  showToast,
  setConfirmModal,
}: UsersProps) {
  // Local state for password visibility mapping (id -> boolean)
  const [passwordVisible, setPasswordVisible] = useState<
    Record<string | number, boolean>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "role">("name");
  const [sortDir, setSortDir] = useState<-1 | 1>(1);

  // Local state for new user inputs
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("admin");

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortKey, sortDir]);

  const handleSort = (key: "name" | "role") => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === -1 ? 1 : -1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = u.name || "";
    const email = u.email || "";
    const role = u.role || "";
    return (name + email + role).toLowerCase().includes(search.toLowerCase());
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortKey === "name") {
      const av = String(a.name || "").toLowerCase();
      const bv = String(b.name || "").toLowerCase();
      return av.localeCompare(bv) * sortDir;
    }
    if (sortKey === "role") {
      const av = String(a.role || "").toLowerCase();
      const bv = String(b.role || "").toLowerCase();
      return av.localeCompare(bv) * sortDir;
    }
    return 0;
  });

  const totalItems = sortedUsers.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const pagedUsers = sortedUsers.slice(startIndex, endIndex);

  // Compute all filtered user IDs for select-all
  const allFilteredIds = filteredUsers.map((u) => String(u.id)).filter(Boolean);
  const areAllSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedUserIds.includes(id));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds((prev) => {
        const next = [...prev];
        allFilteredIds.forEach((id) => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    } else {
      setSelectedUserIds((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id))
      );
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds((prev) => [...prev, id]);
    } else {
      setSelectedUserIds((prev) => prev.filter((x) => x !== id));
    }
  };

  if (isLoading) {
    return <SkeletonLoader type="users" />;
  }

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      if (start > 2) {
        pages.push("...");
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const togglePasswordVisibility = (id: string | number) => {
    setPasswordVisible((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      showToast("All fields are required", "error");
      return;
    }

    try {
      await onAddUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });

      // Clear fields
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("admin");
      setNewUserRow(false);
    } catch (e: any) {
      showToast(e.message || "Failed to create user", "error");
    }
  };

  return (
    <>
      {/* Controls: Search */}
      <div className="controls">
        <div className="search-wrap">
          <img
            src="/assets/icons/search.svg"
            alt="Search"
            className="search-icon"
          />
          <input
            type="text"
            className="search-input"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap table-scroll-wrap">
        <div className="table-inner-scroll">
          <table className="users-table">
        <thead>
          <tr>
            <th className="th-checkbox">
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={areAllSelected}
                onChange={handleSelectAll}
              />
            </th>
            <th>ID</th>
            <th
              onClick={() => handleSort("name")}
              className="sortable-header th-sortable"
            >
              <div className="th-header-inner">
                <span>Name</span>
                <SortIcon active={sortKey === "name"} dir={sortDir} />
              </div>
            </th>
            <th>Email</th>
            <th>Password</th>
            <th
              onClick={() => handleSort("role")}
              className="sortable-header th-sortable"
            >
              <div className="th-header-inner">
                <span>Role</span>
                <SortIcon active={sortKey === "role"} dir={sortDir} />
              </div>
            </th>
            <th className="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* New User Creation Inline Row */}
          {newUserRow && (
            <tr className="new-user-row">
              <td></td>
              <td>Auto</td>
              <td>
                <input
                  id="new-user-name"
                  className="user-input"
                  placeholder="Name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </td>
              <td>
                <input
                  id="new-user-email"
                  className="user-input"
                  placeholder="Email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </td>
              <td>
                <div className="password-wrap">
                  <input
                    id="new-user-password"
                    type={passwordVisible["new-user"] ? "text" : "password"}
                    className="user-input password-input"
                    placeholder="Password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                  <img
                    src={
                      passwordVisible["new-user"]
                        ? "/assets/icons/eye-off.svg"
                        : "/assets/icons/eye.svg"
                    }
                    alt="Toggle View"
                    className="toggle-password"
                    onClick={() => togglePasswordVisibility("new-user")}
                  />
                </div>
              </td>
              <td>
                <CustomSelect
                  id="new-user-role"
                  value={newUserRole}
                  onChange={(v) => setNewUserRole(v)}
                  options={ROLE_OPTIONS}
                  size="sm"
                />
              </td>
              <td>
                <div className="action-btns">
                  <img
                    src="/assets/icons/check.svg"
                    className="create-user-btn"
                    alt="Save"
                    onClick={handleCreateUser}
                  />
                  <img
                    src="/assets/icons/close.svg"
                    className="cancel-user-btn"
                    alt="Cancel"
                    onClick={() => setNewUserRow(false)}
                  />
                </div>
              </td>
            </tr>
          )}

          {/* Existing Users Rows */}
          {totalItems === 0 && !newUserRow ? (
            <tr>
              <td colSpan={7}>
                <div className="empty">
                  <div className="empty-icon">◎</div>
                  <div className="empty-text">No users found</div>
                </div>
              </td>
            </tr>
          ) : (
            pagedUsers.map((user) => {
              const userId = String(user.id ?? "");

            return (
              <tr key={userId}>
                <td className="td-checkbox">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={selectedUserIds.includes(userId)}
                    onChange={(e) => handleSelectRow(userId, e.target.checked)}
                  />
                </td>
                <td>{user.id}</td>
                <td>
                  <input
                    type="text"
                    className="user-name-input"
                    defaultValue={user.name}
                    onBlur={async (e) => {
                      if (e.target.value === user.name) return;
                      await onUpdateUser(userId, {
                        ...user,
                        name: e.target.value,
                      });
                    }}
                  />
                </td>
                <td>
                  <input
                    type="email"
                    className="user-email-input"
                    defaultValue={user.email}
                    onBlur={async (e) => {
                      if (e.target.value === user.email) return;
                      await onUpdateUser(userId, {
                        ...user,
                        email: e.target.value,
                      });
                    }}
                  />
                </td>
                <td>
                  <div className="password-wrap">
                    <input
                      type={passwordVisible[userId] ? "text" : "password"}
                      className="user-password-input"
                      id={`pass-${userId}`}
                      defaultValue={user.password}
                      onBlur={async (e) => {
                        if (e.target.value === user.password) return;
                        await onUpdateUser(userId, {
                          ...user,
                          password: e.target.value,
                        });
                      }}
                    />
                    <img
                      src={
                        passwordVisible[userId]
                          ? "/assets/icons/eye-off.svg"
                          : "/assets/icons/eye.svg"
                      }
                      alt="Toggle View"
                      className="toggle-password"
                      onClick={() => togglePasswordVisibility(userId)}
                    />
                  </div>
                </td>
                <td>
                  <CustomSelect
                    value={user.role ?? ""}
                    onChange={async (v) => {
                      await onUpdateUser(userId, { ...user, role: v });
                    }}
                    options={ROLE_OPTIONS}
                    size="sm"
                  />
                </td>
                <td>
                  <div className="action-btns">
                    <img
                      src="/assets/icons/delete.svg"
                      className="delete-user"
                      alt="Delete"
                      onClick={() => {
                        setConfirmModal({
                          title: "Delete User",
                          message: `Are you sure you want to delete user "${user.name}"?`,
                          onConfirm: () => onDeleteUser(userId),
                        });
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          }))}
          </tbody>
        </table>
        </div>

        {totalItems > 0 && (
          <div className="table-pagination">
            <div className="pagination-info">
              Showing {startIndex + 1}-{endIndex} of {totalItems} items
            </div>
            <div className="pagination-controls">
              <button
                className="btn btn-ghost pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <div className="pagination-numbers">
                {getPageNumbers().map((pageNum, index) =>
                  pageNum === "..." ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      className={`btn btn-ghost pagination-number-btn ${
                        currentPage === pageNum ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(pageNum as number)}
                    >
                      {pageNum}
                    </button>
                  )
                )}
              </div>
              <button
                className="btn btn-ghost pagination-btn"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
export default Users;
