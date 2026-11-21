import React, { useState, useEffect } from "react";
import { Client } from "../types";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { SortIcon } from "../components/SortIcon";
import { CustomSelect } from "../components/CustomSelect";
import { ReelTrackerModal } from "../components/ReelTrackerModal";
import { fetchDeliveries } from "../services/api";
import { IconFilm, IconSearch } from "../components/Icons";
import { Input, Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { normalizeDate } from "../utils/subscription";

interface ClientsProps {
  clients: Client[];
  allClients?: Client[];
  selectedMonth?: string;
  setSelectedMonth?: (m: string) => void;
  availableMonths?: { key: string; label: string }[];
  isLoading: boolean;
  newClientRow: boolean;
  setNewClientRow: (show: boolean) => void;
  selectedClientIds: string[];
  setSelectedClientIds: React.Dispatch<React.SetStateAction<string[]>>;
  onAddClient: (client: Omit<Client, "id">) => Promise<void>;
  onUpdateClient: (id: string | number, client: Omit<Client, "id">) => Promise<void>;
  onDeleteClient: (id: string | number) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  setConfirmModal: React.Dispatch<
    React.SetStateAction<{
      title: string;
      message: string;
      onConfirm: () => void | Promise<void>;
    } | null>
  >;
}

// ─── STANDARD PRICING PLANS ───
const STANDARD_PLANS: Record<string, { price: number; reels: number }> = {
  "Presence (Growth)": { price: 14999, reels: 4 },
  "Growth (Growth)": { price: 24999, reels: 6 },
  "Scale (Growth)": { price: 34999, reels: 10 },
  "Starter (Prod)": { price: 11499, reels: 5 },
  "Standard (Prod)": { price: 19999, reels: 10 },
  "Growth (Prod)": { price: 24999, reels: 15 },
};

// Dropdown options constants
const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Paused", label: "Paused" },
  { value: "Churned", label: "Churned" },
];

const planOptions = [
  { value: "Custom", label: "Custom Plan" },
  ...Object.keys(STANDARD_PLANS).map((p) => ({ value: p, label: p })),
];

export function Clients({
  clients,
  allClients,
  selectedMonth = "all",
  availableMonths = [],
  isLoading,
  newClientRow,
  setNewClientRow,
  selectedClientIds,
  setSelectedClientIds,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  showToast,
  setConfirmModal,
}: ClientsProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"revenue" | "reels" | "name">("revenue");
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);
  const [viewScope, setViewScope] = useState<"month" | "all">("month");
  // New client form states
  const [newClientName, setNewClientName] = useState("");
  const [newClientBusiness, setNewClientBusiness] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientInstagram, setNewClientInstagram] = useState("");
  const [newClientReels, setNewClientReels] = useState("");
  const [newClientPpr, setNewClientPpr] = useState(""); // Rate / fee
  const [newClientStatus, setNewClientStatus] = useState<string>("Active");
  const [newSubscriptionPlan, setNewSubscriptionPlan] = useState<string>("Custom");
  const [newBasePpr, setNewBasePpr] = useState<string>("");
  const [newClientDate, setNewClientDate] = useState("2026-08-14");
  const [isSaving, setIsSaving] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | number | null>(null);
  const [editClientData, setEditClientData] = useState<Client | null>(null);
  // Reel delivery tracking modal states
  const [trackerClient, setTrackerClient] = useState<Client | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [deliveryCounts, setDeliveryCounts] = useState<Record<string, number>>({});

  const loadDeliveriesSummary = async () => {
    try {
      const res = await fetchDeliveries();
      const list = res.deliveries || [];
      const targetMonth = selectedMonth && selectedMonth !== "all"
        ? selectedMonth
        : new Date().toISOString().slice(0, 7);
      const counts: Record<string, number> = {};
      list.forEach((d) => {
        if (d.month === targetMonth && d.status === "Delivered") {
          const idKey = String(d.clientId);
          counts[idKey] = (counts[idKey] || 0) + 1;
        }
      });
      setDeliveryCounts(counts);
    } catch (e) {
      console.warn("Could not load deliveries summary", e);
    }
  };

  useEffect(() => {
    loadDeliveriesSummary();
  }, [clients, selectedMonth]);

  if (isLoading) {
    return <SkeletonLoader type="clients" />;
  }

  const getClientRevenue = (c: Client) => {
    return c.revenue || (c.reels || 0) * (c.ppr || 0);
  };

  const renderRateCell = (actual: number, base: number) => {
    if (base > actual) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontWeight: 600, color: "var(--white)" }}>₹{actual.toLocaleString("en-IN")}</span>
          <span style={{ textDecoration: "line-through", color: "var(--muted)", fontSize: "11px" }}>
            ₹{base.toLocaleString("en-IN")}
          </span>
        </div>
      );
    }
    return <span style={{ fontWeight: 600, color: "var(--white)" }}>₹{base.toLocaleString("en-IN")}</span>;
  };

  const displaySourceClients =
    selectedMonth !== "all" && viewScope === "all" && allClients
      ? allClients
      : clients;

  // Filter clients by search term (name, business, instagram)
  const filteredClients = displaySourceClients.filter((x) => {
    const name = x.name || "";
    const business = x.business || "";
    const instagram = x.instagram || "";
    return (name + business + instagram)
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  // Sort filtered clients
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortKey === "name") {
      const av = (a.name || "").toLowerCase();
      const bv = (b.name || "").toLowerCase();
      return av.localeCompare(bv) * sortDir;
    }
    const av =
      sortKey === "revenue"
        ? getClientRevenue(a)
        : sortKey === "reels"
        ? a.reels || 0
        : 0;
    const bv =
      sortKey === "revenue"
        ? getClientRevenue(b)
        : sortKey === "reels"
        ? b.reels || 0
        : 0;
    return (av - bv) * sortDir;
  });

  // Selection states for Clients table
  const sortedFilteredIds = sortedClients.map((c) => String(c.id)).filter(Boolean);
  const areAllSelected = sortedFilteredIds.length > 0 && sortedFilteredIds.every((id) => selectedClientIds.includes(id));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedClientIds((prev) => {
        const next = [...prev];
        sortedFilteredIds.forEach((id) => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    } else {
      setSelectedClientIds((prev) => prev.filter((id) => !sortedFilteredIds.includes(id)));
    }
  };

  const handleSelectClientRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedClientIds((prev) => [...prev, id]);
    } else {
      setSelectedClientIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleSaveNewClient = async () => {
    if (isSaving) return;
    if (!newClientBusiness.trim()) {
      showToast("Business name is required", "error");
      return;
    }
    const reelsVal = Number(newClientReels || 0);
    const rateVal = Number(newClientPpr || 0);
    const baseRateVal = Number(newBasePpr || newClientPpr || 0);
    const discountPct = baseRateVal > rateVal ? Math.round(((baseRateVal - rateVal) / baseRateVal) * 100) : 0;
    
    const clientPayload = {
      name: newClientName,
      business: newClientBusiness,
      phone: newClientPhone,
      instagram: newClientInstagram,
      reels: reelsVal,
      ppr: reelsVal > 0 ? rateVal / reelsVal : rateVal,
      image: "",
      billingModel: "Subscription",
      plan: newSubscriptionPlan || "Custom",
      baseRate: baseRateVal,
      bargain: discountPct,
      date: normalizeDate(newClientDate) || "2026-08-14",
      status: newClientStatus || "Active",
    };
    
    // Close row and reset inputs immediately for instant UI response
    setNewClientName("");
    setNewClientBusiness("");
    setNewClientPhone("");
    setNewClientInstagram("");
    setNewClientReels("");
    setNewClientPpr("");
    setNewBasePpr("");
    setNewClientDate("2026-08-14");
    setNewSubscriptionPlan("Custom");
    setNewClientStatus("Active");
    setNewClientRow(false);

    try {
      await onAddClient(clientPayload);
      showToast("Client added successfully", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to create client", "error");
    }
  };

  const handleSort = (key: "revenue" | "reels" | "name") => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === -1 ? 1 : -1));
    } else {
      setSortKey(key);
      setSortDir(-1);
    }
  };

  // Preview properties for New Client Inline Addition Row

  const handleStartEdit = (c: Client) => {
    setEditingClientId(c.id);
    setEditClientData({
      ...c,
      date: normalizeDate(c.date) || c.date || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editClientData) return;
    setIsSaving(true);
    const clientToSave: Client = {
      ...editClientData,
      revenue: editClientData.revenue !== undefined ? editClientData.revenue : (editClientData.reels || 0) * (editClientData.ppr || 0),
      date: normalizeDate(editClientData.date) || editClientData.date || "",
    };

    try {
      await onUpdateClient(clientToSave.id, clientToSave);
      setEditingClientId(null);
      setEditClientData(null);
      showToast("Client updated successfully", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to update client", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingClientId(null);
    setEditClientData(null);
  };

  const renderNewClientRow = () => {
    const previewRate = Number(newClientPpr || 0);
    const previewBase = Number(newBasePpr || newClientPpr || 0);
    const previewDiscount = previewBase > previewRate ? Math.round(((previewBase - previewRate) / previewBase) * 100) : 0;

    return (
      <tr className="new-client-row">
        <td className="td-checkbox"></td>
        <td>
          <div className="client-name-col">
            <div className="client-avatar">?</div>
            <div className="client-fields-col">
              <input
                className="company-input td-input td-input-name"
                placeholder="Client Name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveNewClient();
                  if (e.key === "Escape") setNewClientRow(false);
                }}
              />
              <input
                className="phone-input td-input td-input-phone"
                placeholder="Phone Number"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveNewClient();
                  if (e.key === "Escape") setNewClientRow(false);
                }}
              />
            </div>
          </div>
        </td>
        <td>
          <input
            className="company-input td-input td-input-2xl"
            placeholder="Business Name"
            value={newClientBusiness}
            onChange={(e) => setNewClientBusiness(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveNewClient();
              if (e.key === "Escape") setNewClientRow(false);
            }}
          />
        </td>
        <td>
          <input
            className="company-input td-input td-input-lg"
            placeholder="Instagram Handle"
            value={newClientInstagram}
            onChange={(e) => setNewClientInstagram(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveNewClient();
              if (e.key === "Escape") setNewClientRow(false);
            }}
          />
        </td>
        <td>
          <div className="date-input-wrapper">
            <input
              type="text"
              className="company-input td-input td-input-date"
              placeholder="YYYY-MM-DD"
              value={newClientDate}
              onChange={(e) => setNewClientDate(e.target.value)}
              onBlur={() => setNewClientDate(normalizeDate(newClientDate))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveNewClient();
                if (e.key === "Escape") setNewClientRow(false);
              }}
            />
            <input
              type="date"
              tabIndex={-1}
              aria-label="Pick date"
              className="date-picker-icon-btn"
              value={normalizeDate(newClientDate) || ""}
              onChange={(e) => {
                if (e.target.value) {
                  setNewClientDate(e.target.value);
                }
              }}
            />
          </div>
        </td>
        <td>
          <CustomSelect
            size="sm"
            value={newClientStatus}
            onChange={(val) => setNewClientStatus(val)}
            options={statusOptions}
            fullWidth={true}
          />
        </td>
        <td>
          <CustomSelect
            size="sm"
            value={newSubscriptionPlan}
            onChange={(plan) => {
              setNewSubscriptionPlan(plan);
              if (plan !== "Custom") {
                const planInfo = STANDARD_PLANS[plan];
                if (planInfo) {
                  setNewClientReels(String(planInfo.reels));
                  setNewClientPpr(String(planInfo.price));
                  setNewBasePpr(String(planInfo.price));
                }
              }
            }}
            options={planOptions}
            fullWidth={true}
          />
        </td>
        <td>
          <input
            type="number"
            className="company-input td-input td-input-sm"
            placeholder="Reels/Mo"
            value={newClientReels}
            onChange={(e) => setNewClientReels(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveNewClient();
              if (e.key === "Escape") setNewClientRow(false);
            }}
          />
        </td>
        <td>
          <input
            type="number"
            className="company-input td-input td-input-md"
            placeholder="Base Monthly Fee"
            value={newBasePpr}
            onChange={(e) => setNewBasePpr(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveNewClient();
              if (e.key === "Escape") setNewClientRow(false);
            }}
          />
        </td>
        <td>
          {previewDiscount > 0 ? (
            <span className="bargain-badge bargained">
              -{previewDiscount}%
            </span>
          ) : (
            <span className="bargain-badge no-bargain">
              0%
            </span>
          )}
        </td>
        <td className="td-bold-green">
          <input
            type="number"
            className="company-input td-input td-input-md"
            placeholder="Revenue"
            value={newClientPpr}
            onChange={(e) => setNewClientPpr(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveNewClient();
              if (e.key === "Escape") setNewClientRow(false);
            }}
          />
        </td>
        <td className="th-actions" onClick={(e) => e.stopPropagation()}>
          <div className="action-btns">
            {isSaving ? (
              <div className="edit-client" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "default", opacity: 1, background: "transparent" }}>
                <div className="btn-loader" style={{ margin: 0, width: "14px", height: "14px" }}></div>
              </div>
            ) : (
              <img
                src="/assets/icons/check.svg"
                className="edit-client"
                alt="Save"
                title="Save"
                onClick={(e) => { e.stopPropagation(); handleSaveNewClient(); }}
              />
            )}
            <img
              src="/assets/icons/close.svg"
              className="del-client"
              alt="Cancel"
              title="Cancel"
              onClick={(e) => { e.stopPropagation(); setNewClientRow(false); }}
            />
          </div>
        </td>
      </tr>
    );
  };

  const renderClientRow = (c: Client) => {
    const isEditing = editingClientId !== null && String(editingClientId) === String(c.id);

    if (isEditing) {
      const editActualRate = editClientData ? Math.round((editClientData.reels || 0) * (editClientData.ppr || 0)) : 0;
      const editBaseRate = editClientData?.baseRate || editActualRate;
      const editDiscountPct = editBaseRate > editActualRate ? Math.round(((editBaseRate - editActualRate) / editBaseRate) * 100) : 0;

      return (
        <tr key={c.id} className="editing-client-row">
          <td className="td-checkbox">
            <input
              type="checkbox"
              className="custom-checkbox"
              checked={selectedClientIds.includes(String(c.id))}
              onChange={(e) => handleSelectClientRow(String(c.id), e.target.checked)}
            />
          </td>
          <td>
            <div className="client-name-col">
              <div className="client-avatar">?</div>
              <div className="client-fields-col">
                <input
                  type="text"
                  className="company-input td-input td-input-name"
                  value={editClientData?.name || ""}
                  onChange={(e) => setEditClientData(prev => prev ? { ...prev, name: e.target.value } : null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  placeholder="Name"
                />
                <input
                  type="text"
                  className="phone-input td-input td-input-phone"
                  value={editClientData?.phone || ""}
                  onChange={(e) => setEditClientData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  placeholder="Phone"
                />
              </div>
            </div>
          </td>
          <td>
            <input
              type="text"
              className="company-input td-input td-input-2xl"
              value={editClientData?.business || ""}
              onChange={(e) => setEditClientData(prev => prev ? { ...prev, business: e.target.value } : null)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") handleCancelEdit();
              }}
              placeholder="Business"
            />
          </td>
          <td>
            <input
              type="text"
              className="company-input td-input td-input-lg"
              value={editClientData?.instagram || ""}
              onChange={(e) => setEditClientData(prev => prev ? { ...prev, instagram: e.target.value } : null)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") handleCancelEdit();
              }}
              placeholder="Instagram"
            />
          </td>
          <td>
            <div className="date-input-wrapper">
              <input
                type="text"
                className="company-input td-input td-input-date"
                value={editClientData?.date || ""}
                placeholder="YYYY-MM-DD"
                onChange={(e) => setEditClientData(prev => prev ? { ...prev, date: e.target.value } : null)}
                onBlur={() => {
                  setEditClientData(prev => prev ? { ...prev, date: normalizeDate(prev.date) } : null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />
              <input
                type="date"
                tabIndex={-1}
                aria-label="Pick date"
                className="date-picker-icon-btn"
                value={normalizeDate(editClientData?.date) || ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setEditClientData(prev => prev ? { ...prev, date: e.target.value } : null);
                  }
                }}
              />
            </div>
          </td>
          <td>
            <CustomSelect
              size="sm"
              value={editClientData?.status || "Active"}
              onChange={(val) => {
                setEditClientData(prev => prev ? { ...prev, status: val } : null);
              }}
              options={statusOptions}
              fullWidth={true}
            />
          </td>
          <td>
            <CustomSelect
              size="sm"
              value={editClientData?.plan || "Custom"}
              onChange={(plan) => {
                setEditClientData(prev => {
                  if (!prev) return null;
                  if (plan !== "Custom") {
                    const planInfo = STANDARD_PLANS[plan];
                    if (planInfo) {
                      return {
                        ...prev,
                        plan,
                        reels: planInfo.reels,
                        ppr: planInfo.price / (planInfo.reels || 1),
                        baseRate: planInfo.price,
                        bargain: 0,
                      };
                    }
                  }
                  return { ...prev, plan };
                });
              }}
              options={planOptions}
            />
          </td>
          <td>
            <input
              type="number"
              className="company-input td-input td-input-sm"
              value={editClientData?.reels ?? ""}
              onChange={(e) => {
                const reelsVal = Number(e.target.value || 0);
                setEditClientData(prev => {
                  if (!prev) return null;
                  const actualRate = Math.round((prev.reels || 0) * prev.ppr);
                  return {
                    ...prev,
                    reels: reelsVal,
                    ppr: actualRate / (reelsVal || 1),
                  };
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") handleCancelEdit();
              }}
              placeholder="Reels/Mo"
            />
          </td>

          <td>
            <input
              type="number"
              className="company-input td-input td-input-md"
              value={editClientData?.baseRate ?? ""}
              onChange={(e) => {
                const baseRateVal = Number(e.target.value || 0);
                setEditClientData(prev => {
                  if (!prev) return null;
                  const actualRate = Math.round((prev.reels || 0) * prev.ppr);
                  const discountPct = baseRateVal > actualRate ? Math.round(((baseRateVal - actualRate) / baseRateVal) * 100) : 0;
                  return {
                    ...prev,
                    baseRate: baseRateVal,
                    bargain: discountPct,
                  };
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") handleCancelEdit();
              }}
              placeholder="Base Monthly Fee"
            />
          </td>
          <td>
            {editDiscountPct > 0 ? (
              <span className="bargain-badge bargained">
                -{editDiscountPct}%
              </span>
            ) : (
              <span className="bargain-badge no-bargain">
                0%
              </span>
            )}
          </td>
          <td className="td-rev td-bold-green">
            <input
              type="number"
              className="company-input td-input td-input-md"
              value={editClientData ? (editClientData.revenue !== undefined ? editClientData.revenue : Math.round(getClientRevenue(editClientData))) : ""}
              onChange={(e) => {
                const newRevVal = Number(e.target.value || 0);
                setEditClientData(prev => {
                  if (!prev) return null;
                  const reelsVal = prev.reels || 1;
                  const calculatedPpr = newRevVal / (reelsVal || 1);
                  const baseRateVal = prev.baseRate || newRevVal;
                  const discountPct = baseRateVal > newRevVal ? Math.round(((baseRateVal - newRevVal) / baseRateVal) * 100) : 0;
                  return {
                    ...prev,
                    revenue: newRevVal,
                    ppr: calculatedPpr,
                    bargain: discountPct,
                  };
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") handleCancelEdit();
              }}
              placeholder="Revenue"
            />
          </td>
          <td className="th-actions" onClick={(e) => e.stopPropagation()}>
            <div className="action-btns">
              {isSaving ? (
                <div className="edit-client" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "default", opacity: 1, background: "transparent" }}>
                  <div className="btn-loader" style={{ margin: 0, width: "14px", height: "14px" }}></div>
                </div>
              ) : (
                <img
                  src="/assets/icons/check.svg"
                  className="edit-client"
                  alt="Save"
                  title="Save Changes"
                  onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                />
              )}
              <img
                src="/assets/icons/close.svg"
                className="del-client"
                alt="Cancel"
                title="Cancel Edit"
                onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
              />
            </div>
          </td>
        </tr>
      );
    }

    // Default: Clean Read-only mode
    const rev = getClientRevenue(c);
    const nameStr = String(c.name || "").trim();
    const businessStr = String(c.business || "").trim();
    const displayName = nameStr || businessStr || "Unnamed Client";
    const avatarChar = (nameStr ? nameStr[0] : businessStr ? businessStr[0] : "?").toUpperCase();

    const actualRate = Math.round((c.reels || 0) * (c.ppr || 0));
    const baseRate = c.baseRate || actualRate;
    const discountPct = c.bargain || (baseRate > actualRate ? Math.round(((baseRate - actualRate) / baseRate) * 100) : 0);

    const cleanInsta = String(c.instagram || "").trim();
    const displayInsta = cleanInsta ? (cleanInsta.startsWith("@") ? cleanInsta : `@${cleanInsta}`) : "";
    const hrefInsta = cleanInsta ? (cleanInsta.startsWith("@") ? cleanInsta.slice(1) : cleanInsta) : "";

    return (
      <tr
        key={c.id}
        onClick={() => handleStartEdit(c)}
        style={{ cursor: "pointer" }}
        className="readonly-client-row"
      >
        <td className="td-checkbox" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="custom-checkbox"
            checked={selectedClientIds.includes(String(c.id))}
            onChange={(e) => handleSelectClientRow(String(c.id), e.target.checked)}
          />
        </td>
        <td>
          <div className="client-name-col">
            <div className="client-avatar">
              {(() => {
                const cleanImg = String(c.image || "").trim().toLowerCase();
                const hasValidImage = cleanImg !== "" &&
                                      cleanImg !== "—" &&
                                      cleanImg !== "image url" &&
                                      (cleanImg.startsWith("http") || cleanImg.startsWith("/"));
                return hasValidImage ? (
                  <img
                    src={c.image}
                    alt={displayName}
                    className="avatar-img"
                  />
                ) : (
                  avatarChar
                );
              })()}
            </div>
            <div className="client-fields-col">
              <span className="client-name-text" style={{ fontWeight: 600, color: "var(--white)" }}>{displayName}</span>
              {c.phone && <span className="client-phone-text td-muted" style={{ fontSize: "11px" }}>{c.phone}</span>}
            </div>
          </div>
        </td>
        <td>
          <span className="client-business-text">{c.business || "—"}</span>
        </td>
        <td>
          {cleanInsta ? (
            <a
              href={`https://instagram.com/${hrefInsta}`}
              target="_blank"
              rel="noreferrer"
              className="insta-link"
              onClick={(e) => e.stopPropagation()}
              style={{ color: "var(--white)", textDecoration: "none" }}
            >
              {displayInsta}
            </a>
          ) : (
            <span className="td-muted">—</span>
          )}
        </td>
        <td>
          <span className="client-date-text">{c.date || "—"}</span>
        </td>
        <td>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "99px",
                fontSize: "11px",
                fontWeight: 600,
                background:
                  c.status === "Paused"
                    ? "rgba(234, 179, 8, 0.15)"
                    : c.status === "Churned"
                    ? "rgba(239, 68, 68, 0.15)"
                    : "rgba(34, 197, 94, 0.15)",
                color:
                  c.status === "Paused"
                    ? "#eab308"
                    : c.status === "Churned"
                    ? "#ef4444"
                    : "var(--green)",
                border: `1px solid ${
                  c.status === "Paused"
                    ? "rgba(234, 179, 8, 0.3)"
                    : c.status === "Churned"
                    ? "rgba(239, 68, 68, 0.3)"
                    : "rgba(34, 197, 94, 0.3)"
                }`,
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "99px",
                  background: "currentColor",
                }}
              />
              {c.status || "Active"}
            </span>
          </div>
        </td>
        <td>
          <span className="plan-badge" style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "18px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span>{c.plan || "Custom"}</span>
            {c.billingModel === "Subscription" && (
              <span style={{ fontSize: "9px", background: "var(--green-12)", color: "var(--green)", border: "0.6px solid var(--green)", padding: "1px 5px", borderRadius: "99px", fontWeight: 700 }}>
                SUB
              </span>
            )}
          </span>
        </td>
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="client-reels-text" style={{ fontWeight: 600, display: "inline-flex", alignItems: "baseline", gap: "2px" }}>
              {c.reels}
              {c.billingModel === "Subscription" && (
                <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 400 }}>
                  /mo
                </span>
              )}
            </span>
            {(() => {
              const count = deliveryCounts[String(c.id)] || 0;
              const quota = c.reels || 1;
              const isFull = count >= quota;
              const isPartial = count > 0 && count < quota;
              const activeCycle = selectedMonth && selectedMonth !== "all"
                ? availableMonths.find((m) => m.key === selectedMonth)?.label || selectedMonth
                : "Current Cycle";
              
              let bg = "rgba(255, 255, 255, 0.05)";
              let border = "0.6px solid rgba(255, 255, 255, 0.12)";
              let color = "var(--muted)";
              
              if (isFull) {
                bg = "var(--green-12)";
                border = "0.6px solid var(--green)";
                color = "var(--green)";
              } else if (isPartial) {
                bg = "rgba(234, 179, 8, 0.12)";
                border = "0.6px solid rgba(234, 179, 8, 0.4)";
                color = "var(--gold)";
              }

              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTrackerClient(c);
                    setIsTrackerOpen(true);
                  }}
                  title={
                    c.billingModel === "Subscription"
                      ? count === 0
                        ? `Monthly subscription reset for ${activeCycle}: 0/${c.reels} reels delivered so far`
                        : `${activeCycle}: ${count}/${c.reels} monthly subscription reels delivered`
                      : `${count}/${c.reels} reels delivered`
                  }
                  style={{
                    background: bg,
                    border,
                    color,
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "var(--border-radius-99)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "var(--transition-fast)",
                  }}
                >
                  <IconFilm size={12} />
                  <span>{count}/{c.reels} Del.</span>
                </button>
              );
            })()}
          </div>
        </td>

        <td>
          <span className="client-base-text">
            {renderRateCell(actualRate, baseRate)}
          </span>
        </td>
        <td>
          {discountPct > 0 ? (
            <span className="bargain-badge bargained" title={`Base: ₹${baseRate.toLocaleString("en-IN")} | Actual: ₹${actualRate.toLocaleString("en-IN")}`}>
              -{discountPct}%
            </span>
          ) : (
            <span className="bargain-badge no-bargain">
              0%
            </span>
          )}
        </td>
        <td className="td-rev td-bold-green">
          ₹{rev.toLocaleString("en-IN")}
        </td>
        <td className="th-actions" onClick={(e) => e.stopPropagation()}>
          <div className="action-btns">
            <button
              type="button"
              className="edit-client tracker-btn is-sub"
              onClick={(e) => {
                e.stopPropagation();
                setTrackerClient(c);
                setIsTrackerOpen(true);
              }}
              title="Track Monthly Deliveries & Copy Client Link"
            >
              <IconFilm size={20} strokeWidth={1.8} />
            </button>
            <img
              src="/assets/icons/edit.svg"
              alt="Edit"
              className="edit-client"
              title="Edit Client"
              onClick={(e) => { e.stopPropagation(); handleStartEdit(c); }}
            />
            <img
              src="/assets/icons/delete.svg"
              alt="Delete"
              className="del-client"
              title="Delete Client"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmModal({
                  title: "Delete Client",
                  message: `Are you sure you want to delete client "${displayName}"?`,
                  onConfirm: () => onDeleteClient(c.id),
                });
              }}
            />
          </div>
        </td>
      </tr>
    );
  };

  return (
    <>
      {selectedMonth && selectedMonth !== "all" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "18px",
            padding: "10px 16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 600,
                fontSize: "13px",
                color: "var(--white)",
              }}
            >
              📅 {availableMonths.find((m) => m.key === selectedMonth)?.label || selectedMonth}
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              <strong style={{ color: "var(--white)" }}>
                {clients.length}
              </strong>{" "}
              Clients
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              MRR:{" "}
              <strong style={{ color: "var(--green)" }}>
                ₹{clients.reduce((sum, c) => sum + getClientRevenue(c), 0).toLocaleString("en-IN")}
              </strong>
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Reels:{" "}
              <strong style={{ color: "#facc15" }}>
                {clients.reduce((sum, c) => sum + (c.reels || 0), 0)}
              </strong>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Tabs
              value={viewScope}
              onValueChange={(val) => setViewScope(val as "month" | "all")}
            >
              <TabsList>
                <TabsTrigger value="month">Active in Month ({clients.length})</TabsTrigger>
                <TabsTrigger value="all">All Portfolio ({allClients?.length || clients.length})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      {/* Controls: Search and Sort */}
      <div className="controls">
        <div className="search-wrap" style={{ flex: 1, maxWidth: "420px" }}>
          <Input
            id="search-input"
            type="search"
            startIcon={<IconSearch size={16} />}
            placeholder="Search clients by name, business, insta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ─── CLIENTS TABLE ─── */}
      <div className="table-wrap table-scroll-wrap mt-24">
        <div className="table-inner-scroll">
          <table>
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
                <th onClick={() => handleSort("name")} className="sortable-header th-sortable">
                  <div className="th-header-inner">
                    <span>Client Name</span>
                    <SortIcon active={sortKey === "name"} dir={sortDir} />
                  </div>
                </th>
                <th>Business</th>
                <th>Insta ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Plan</th>
                <th onClick={() => handleSort("reels")} className="sortable-header th-sortable">
                  <div className="th-header-inner">
                    <span>Reels / Mo</span>
                    <SortIcon active={sortKey === "reels"} dir={sortDir} />
                  </div>
                </th>

                <th>Rate</th>
                <th>Bargain</th>
                <th onClick={() => handleSort("revenue")} className="sortable-header th-sortable">
                  <div className="th-header-inner">
                    <span>Monthly Revenue</span>
                    <SortIcon active={sortKey === "revenue"} dir={sortDir} />
                  </div>
                </th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {newClientRow && renderNewClientRow()}

              {sortedClients.length === 0 && !newClientRow ? (
                <tr>
                  <td colSpan={12}>
                    <div className="empty">
                      <div className="empty-icon">◎</div>
                      <div className="empty-text">No clients found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedClients.map((c) => renderClientRow(c))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* ─── REEL TRACKER MODAL ─── */}
      <ReelTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        client={trackerClient}
        showToast={showToast}
        onDeliveriesUpdated={loadDeliveriesSummary}
        initialMonth={selectedMonth && selectedMonth !== "all" ? selectedMonth : undefined}
      />
    </>
  );
}

export default Clients;
