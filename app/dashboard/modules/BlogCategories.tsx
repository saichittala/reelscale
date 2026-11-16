import React, { useState } from "react";
import { Button, Input } from "@/components/ui";

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
        <div className="df-g12 al-c">
          <div style={{ flex: 1 }}>
            <Input
              id="new-cat-input"
              placeholder="e.g. Video Editing, Sound Design"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
          </div>
          <Button
            variant="primary"
            id="add-cat-btn"
            onClick={handleAdd}
          >
            Create Category
          </Button>
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
                <Button
                  variant="danger"
                  size="sm"
                  className="delete-cat-btn delete-category-btn"
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
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default BlogCategories;
