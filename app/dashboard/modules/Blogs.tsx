import React, { useState, useEffect } from "react";
import { Blog } from "../types";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { CustomSelect } from "../components/CustomSelect";
import { SortIcon } from "../components/SortIcon";

interface BlogsProps {
  blogs: Blog[];
  isLoading: boolean;
  blogCategories: string[];
  selectedBlogIds: string[];
  setSelectedBlogIds: React.Dispatch<React.SetStateAction<string[]>>;
  onEditBlog: (blog: Blog) => void;
  onDeleteBlog: (id: string | number) => void;
  onCreateBlog: () => void;
  onManageCategories: () => void;
  setConfirmModal: React.Dispatch<
    React.SetStateAction<{
      title: string;
      message: string;
      onConfirm: () => void | Promise<void>;
    } | null>
  >;
}

export function Blogs({
  blogs,
  isLoading,
  blogCategories,
  selectedBlogIds,
  setSelectedBlogIds,
  onEditBlog,
  onDeleteBlog,
  onCreateBlog,
  onManageCategories,
  setConfirmModal,
}: BlogsProps) {
  const [blogSearch, setBlogSearch] = useState("");
  const [blogStatusFilter, setBlogStatusFilter] = useState("all");
  const [blogCategoryFilter, setBlogCategoryFilter] = useState("all");
  const [blogSortKey, setBlogSortKey] = useState<"title" | "date">("date");
  const [blogSortDir, setBlogSortDir] = useState<-1 | 1>(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [blogSearch, blogStatusFilter, blogCategoryFilter, blogSortKey, blogSortDir]);

  if (isLoading) {
    return <SkeletonLoader type="blogs" />;
  }

  // Filter and sort blogs
  let filteredBlogs = [...blogs];

  if (blogSearch) {
    filteredBlogs = filteredBlogs.filter((x) =>
      (x.title + x.description + x.category)
        .toLowerCase()
        .includes(blogSearch.toLowerCase())
    );
  }

  if (blogStatusFilter !== "all") {
    filteredBlogs = filteredBlogs.filter((x) => x.status === blogStatusFilter);
  }

  if (blogCategoryFilter !== "all") {
    filteredBlogs = filteredBlogs.filter(
      (x) => x.category.toLowerCase() === blogCategoryFilter.toLowerCase()
    );
  }

  const handleSort = (key: "title" | "date") => {
    if (blogSortKey === key) {
      setBlogSortDir((dir) => (dir === -1 ? 1 : -1));
    } else {
      setBlogSortKey(key);
      setBlogSortDir(-1);
    }
  };

  filteredBlogs.sort((a, b) => {
    if (blogSortKey === "title") {
      const valA = a.title || "";
      const valB = b.title || "";
      return valA.localeCompare(valB) * blogSortDir;
    }
    const valA = a.publishedDate || "";
    const valB = b.publishedDate || "";
    return valA.localeCompare(valB) * blogSortDir;
  });

  const totalItems = filteredBlogs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const pagedBlogs = filteredBlogs.slice(startIndex, endIndex);

  const allFilteredBlogIds = filteredBlogs.map((b) => String(b.id || "")).filter(Boolean);
  const areAllFilteredBlogsSelected =
    allFilteredBlogIds.length > 0 &&
    allFilteredBlogIds.every((id) => selectedBlogIds.includes(id));

  const handleSelectAllBlogs = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBlogIds((prev) => {
        const newSelection = [...prev];
        allFilteredBlogIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    } else {
      setSelectedBlogIds((prev) =>
        prev.filter((id) => !allFilteredBlogIds.includes(id))
      );
    }
  };

  const handleSelectBlogRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedBlogIds((prev) => [...prev, id]);
    } else {
      setSelectedBlogIds((prev) => prev.filter((x) => x !== id));
    }
  };

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

  return (
    <>
      {/* Controls: Search and Filters */}
      <div className="controls">
        <div className="search-wrap">
          <img
            src="/assets/icons/search.svg"
            alt="Search"
            className="search-icon"
          />
          <input
            id="blog-search-input"
            type="text"
            placeholder="Search blogs by title..."
            value={blogSearch}
            onChange={(e) => setBlogSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="df-g8">
          <CustomSelect
            id="blog-status-filter"
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
            id="blog-category-filter"
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

      {/* Blogs Table */}
      <div className="table-wrap" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table>
          <thead>
            <tr>
              <th style={{ width: "40px", paddingLeft: "16px" }}>
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={areAllFilteredBlogsSelected}
                  onChange={handleSelectAllBlogs}
                />
              </th>
              <th>Featured Image</th>
              <th
                onClick={() => handleSort("title")}
                className="sortable-header"
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span>Blog Title</span>
                  <SortIcon active={blogSortKey === "title"} dir={blogSortDir} />
                </div>
              </th>
              <th>Category</th>
              <th>Status</th>
              <th
                onClick={() => handleSort("date")}
                className="sortable-header"
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span>Published Date</span>
                  <SortIcon active={blogSortKey === "date"} dir={blogSortDir} />
                </div>
              </th>
              <th>Last Updated</th>
              <th style={{ width: "140px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {totalItems === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty">
                    <div className="empty-icon">◎</div>
                    <div className="empty-text">No articles found</div>
                  </div>
                </td>
              </tr>
            ) : (
              pagedBlogs.map((b) => (
                <tr style={{ height: "80px" }} key={b.id || b.slug}>
                  <td style={{ width: "40px", paddingLeft: "16px" }}>
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={selectedBlogIds.includes(String(b.id || ""))}
                      onChange={(e) => handleSelectBlogRow(String(b.id || ""), e.target.checked)}
                    />
                  </td>
                  <td style={{ width: "120px" }}>
                    <div
                      style={{
                        width: "100px",
                        height: "56px",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                        background: "var(--white-03)",
                      }}
                    >
                      {b.featuredImage ? (
                        <img
                          src={b.featuredImage}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            color: "var(--muted)",
                            fontSize: "10px",
                          }}
                        >
                          No Image
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--white)",
                        fontSize: "14px",
                      }}
                    >
                      {b.title}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--muted)",
                        marginTop: "2px",
                      }}
                    >
                      {b.description
                        ? `${b.description.substring(0, 75)}...`
                        : "—"}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-gold">{b.category}</span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        b.status === "Published" ? "badge-green" : "badge-red"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: "13px" }}>
                    {b.publishedDate || "—"}
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: "13px" }}>
                    {b.updatedDate || "—"}
                  </td>
                  <td style={{ width: "140px" }}>
                    <div className="action-btns">
                      <img
                        src="/assets/icons/eye.svg"
                        alt="Preview"
                        className="preview-blog-btn"
                        title="Preview Post"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.open(`/blog/${b.slug}`, "_blank");
                          }
                        }}
                      />
                      <img
                        src="/assets/icons/edit.svg"
                        alt="Edit"
                        className="edit-blog-btn"
                        title="Edit Post"
                        style={{ cursor: "pointer" }}
                        onClick={() => onEditBlog(b)}
                      />
                      <img
                        src="/assets/icons/delete.svg"
                        alt="Delete"
                        className="delete-blog-btn"
                        title="Delete Post"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setConfirmModal({
                            title: "Delete Blog Post",
                            message: `Are you sure you want to delete the blog post "${b.title}"? This action cannot be undone.`,
                            onConfirm: () => onDeleteBlog(b.id!),
                          });
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
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
export default Blogs;
