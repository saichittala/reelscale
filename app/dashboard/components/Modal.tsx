import React, { useState, useEffect } from "react";
import { Client } from "../types";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Client, "id">) => void;
  client: Client | null; // Null if adding a client
  showToast: (msg: string, type?: "success" | "error") => void;
}

export function Modal({
  isOpen,
  onClose,
  onSave,
  client,
  showToast,
}: ModalProps) {
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [reels, setReels] = useState<number | "">("");
  const [ppr, setPpr] = useState<number | "">("");
  const [image, setImage] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync state with selected client
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      if (client) {
        setName(client.name || "");
        setBusiness(client.business || "");
        setPhone(client.phone || "");
        setInstagram(client.instagram || "");
        setReels(client.reels ?? "");
        setPpr(client.ppr ?? "");
        setImage(client.image || "");
      } else {
        setName("");
        setBusiness("");
        setPhone("");
        setInstagram("");
        setReels("");
        setPpr("");
        setImage("");
      }
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, client]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleSave = () => {
    if (!business.trim()) {
      showToast("Business name is required", "error");
      return;
    }

    onSave({
      name,
      business,
      phone,
      instagram,
      reels: Number(reels || 0),
      ppr: Number(ppr || 0),
      image,
    });
    handleClose();
  };

  const calculatedRevenue = Number(reels || 0) * Number(ppr || 0);

  return (
    <div
      className={`modal-overlay ${isAnimating ? "active" : ""}`}
      id="modal-overlay"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "modal-overlay") {
          handleClose();
        }
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            {client ? "Edit Client Details" : "Add New Client"}
          </div>
          <button
            className="modal-close"
            id="modal-close"
            aria-label="Close"
            onClick={handleClose}
          >
            <img
              src="/assets/icons/close.svg"
              alt="Close"
              className="modal-close-icon"
            />
          </button>
        </div>

        {/* Client Image URL (Hidden row as per legacy markup design) */}
        <div className="form-row dn">
          <div className="form-group">
            <label className="form-label">Client Image URL</label>
            <input
              className="form-input"
              id="f-image"
              placeholder="https://..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Client Name</label>
            <input
              className="form-input"
              id="f-name"
              placeholder="Arjun Mehta"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input
              className="form-input"
              id="f-biz"
              placeholder="Spice Route Café"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              className="form-input"
              id="f-phone"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Instagram Handle</label>
            <input
              className="form-input"
              id="f-instagram"
              placeholder="@handle"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Reels Count</label>
            <input
              className="form-input"
              id="f-reels"
              type="number"
              placeholder="24"
              value={reels}
              onChange={(e) =>
                setReels(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Price Per Reel (₹)</label>
            <input
              className="form-input"
              id="f-ppr"
              type="number"
              placeholder="3500"
              value={ppr}
              onChange={(e) =>
                setPpr(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
          </div>
        </div>

        <div
          style={{
            background: "var(--white-03)",
            borderRadius: "10px",
            padding: "12px 14px",
            marginTop: "4px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              marginBottom: "4px",
            }}
          >
            Calculated Revenue
          </div>
          <div
            id="rev-preview"
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--white)",
            }}
          >
            ₹{calculatedRevenue.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="form-footer">
          <button className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {client ? "Save Changes" : "Add Client"}
          </button>
        </div>
      </div>
    </div>
  );
}
export default Modal;
