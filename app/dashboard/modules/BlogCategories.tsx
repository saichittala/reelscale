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
    <div className="blog-categories-wrap">
      <div className="glass-card">
        <div className="glass-card-label">Add New Category</div>
        <div className="df-g12">
          <input
            className="form-input flex-grow-1"
            id="new-cat-input"
            placeholder="e.g. Video Editing, Sound Design"
            value={newCatInput}
            onChange={(e) => setNewCatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <button
            className="btn btn-primary"
            id="add-cat-btn"
            onClick={handleAdd}
          >
            Create Category
          </button>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-label">Taxonomy Categories</div>
        <div className="category-list">
          {blogCategories.map((c, idx) => (
            <div className="category-row" key={c}>
              <div className="category-name">
                {c}
              </div>
              <div className="df-g12 al-c">
                <button
                  className="btn btn-ghost delete-cat-btn delete-category-btn"
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
