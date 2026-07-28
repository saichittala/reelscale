import React, { useState } from "react";

interface BlogCategoriesProps {
  blogCategories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (index: number) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  setConfirmModal: React.Dispatch<
    React.SetStateAction<{
      title: string;
      message: string;
      onConfirm: () => void | Promise<void>;
    } | null>
  >;
}

export function BlogCategories({
  blogCategories,
  onAddCategory,
  onDeleteCategory,
  showToast,
  setConfirmModal,
}: BlogCategoriesProps) {
  const [newCatInput, setNewCatInput] = useState("");

  const handleAdd = () => {
    const val = newCatInput.trim();
    if (!val) {
      showToast("Category name is required", "error");
      return;
    }
    if (blogCategories.includes(val)) {
      showToast("Category already exists", "error");
      return;
    }
    onAddCategory(val);
    showToast("Category created successfully");
    setNewCatInput("");
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div className="glass-card">
        <div className="glass-card-label">Add New Category</div>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            className="form-input"
            id="new-cat-input"
            placeholder="e.g. Video Editing, Sound Design"
            style={{ flexGrow: 1 }}
            value={newCatInput}
            onChange={(e) => setNewCatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <button
            className="btn btn-primary"
            id="add-cat-btn"
            style={{ whiteSpace: "nowrap", padding: "0 20px" }}
            onClick={handleAdd}
          >
            Create Category
          </button>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-label">Taxonomy Categories</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {blogCategories.map((c, idx) => (
            <div
              className="category-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: "var(--white-03)",
                borderRadius: "var(--border-radius-3)",
                border: "1px solid var(--border)",
              }}
              key={c}
            >
              <div style={{ fontWeight: "var(--fw-semibold)", color: "var(--white)" }}>
                {c}
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  className="btn btn-ghost delete-cat-btn"
                  style={{
                    color: "var(--red)",
                    fontSize: "var(--text-sm)",
                    padding: "4px 8px",
                  }}
                  onClick={() => {
                    setConfirmModal({
                      title: "Delete Category",
                      message: `Are you sure you want to delete category "${c}"?`,
                      onConfirm: () => {
                        onDeleteCategory(idx);
                        showToast("Category deleted successfully");
                      },
                    });
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default BlogCategories;
