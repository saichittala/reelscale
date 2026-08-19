import React, { useState, useEffect } from "react";
import { Client } from "../types";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { SortIcon } from "../components/SortIcon";
import { CustomSelect } from "../components/CustomSelect";

interface ClientsProps {
  clients: Client[];
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
const billingTypeOptions = [
  { value: "reel-to-reel", label: "RTR" },
  { value: "subscription", label: "SUB" },
];

const planOptions = [
  { value: "Custom", label: "Custom Plan" },
  ...Object.keys(STANDARD_PLANS).map((p) => ({ value: p, label: p })),
];

export function Clients({
  clients,
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
  // New client form states
  const [newClientName, setNewClientName] = useState("");
  const [newClientBusiness, setNewClientBusiness] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientInstagram, setNewClientInstagram] = useState("");
  const [newClientReels, setNewClientReels] = useState("");
  const [newClientPpr, setNewClientPpr] = useState(""); // Rate / fee
  const [newBillingType, setNewBillingType] = useState<"reel-to-reel" | "subscription">("reel-to-reel");
  const [newSubscriptionPlan, setNewSubscriptionPlan] = useState<string>("Custom");
  const [newBasePpr, setNewBasePpr] = useState<string>("");
  const [newClientDate, setNewClientDate] = useState("2026-08-14");
  const [isSaving, setIsSaving] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | number | null>(null);
  const [editClientData, setEditClientData] = useState<Client | null>(null);
  const [activeModelFilter, setActiveModelFilter] = useState<"all" | "bm" | "rtr">("all");

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

  // Filter clients by search term (name, business, instagram)
  const filteredClients = clients.filter((x) => {
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

  // Separate clients into two groups
  const subscriptionClients = sortedClients.filter((c) => String(c.billingModel).toLowerCase() === "subscription");
  const reeltoreelClients = sortedClients.filter((c) => String(c.billingModel).toLowerCase() !== "subscription");

  // Selection states for Subscription table
  const subFilteredIds = subscriptionClients.map((c) => String(c.id)).filter(Boolean);
  const areAllSubSelected = subFilteredIds.length > 0 && subFilteredIds.every((id) => selectedClientIds.includes(id));

  const handleSelectAllSub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedClientIds((prev) => {
        const next = [...prev];
        subFilteredIds.forEach((id) => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    } else {
      setSelectedClientIds((prev) => prev.filter((id) => !subFilteredIds.includes(id)));
    }
  };

  // Selection states for Reel-to-Reel table
  const r2rFilteredIds = reeltoreelClients.map((c) => String(c.id)).filter(Boolean);
  const areAllR2RSelected = r2rFilteredIds.length > 0 && r2rFilteredIds.every((id) => selectedClientIds.includes(id));

  const handleSelectAllR2R = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedClientIds((prev) => {
        const next = [...prev];
        r2rFilteredIds.forEach((id) => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    } else {
      setSelectedClientIds((prev) => prev.filter((id) => !r2rFilteredIds.includes(id)));
    }
  };

  // Selection states for All (Combined) table
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
    setIsSaving(true);
    try {
      const reelsVal = Number(newClientReels || 0);
      const rateVal = Number(newClientPpr || 0);
      const baseRateVal = Number(newBasePpr || newClientPpr || 0);
      const discountPct = baseRateVal > rateVal ? Math.round(((baseRateVal - rateVal) / baseRateVal) * 100) : 0;
      
      await onAddClient({
        name: newClientName,
        business: newClientBusiness,
        phone: newClientPhone,
        instagram: newClientInstagram,
        reels: reelsVal,
        ppr: rateVal / (reelsVal || 1),
        image: "",
        billingModel: newBillingType === "subscription" ? "Subscription" : "Reel-to-Reel",
        plan: newBillingType === "subscription" ? newSubscriptionPlan : "",
        baseRate: baseRateVal,
        bargain: discountPct,
        date: newClientDate || "2026-08-14",
      });
      
      setNewClientName("");
      setNewClientBusiness("");
      setNewClientPhone("");
      setNewClientInstagram("");
      setNewClientReels("");
      setNewClientPpr("");
      setNewBasePpr("");
      setNewClientDate("2026-08-14");
      setNewBillingType("reel-to-reel");
      setNewSubscriptionPlan("Custom");
      setNewClientRow(false);
    } catch (e: any) {
      showToast(e.message || "Failed to create client", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Sync edits to the database
  const updateClientField = async (
    c: Client,
    field: keyof Omit<Client, "id">,
    value: any
  ) => {
    const updatedClient = {
      name: c.name || "",
      business: c.business || "",
      phone: c.phone || "",
      instagram: c.instagram || "",
      reels: c.reels || 0,
      ppr: c.ppr || 0,
      image: c.image || "",
      billingModel: c.billingModel || "Reel-to-Reel",
      plan: c.plan || "",
      baseRate: Number(c.baseRate || 0),
      bargain: Number(c.bargain || 0),
      date: c.date || "",
      [field]: field === "reels" || field === "ppr" || field === "baseRate" || field === "bargain" ? Number(value || 0) : value,
    };
    if (c[field] === updatedClient[field]) return;
    await onUpdateClient(c.id, updatedClient);
  };

  const handleUpdateBillingModel = async (c: Client, type: "reel-to-reel" | "subscription") => {
    const modelStr = String(c.billingModel || "").toLowerCase();
    if ((modelStr === "subscription" && type === "subscription") ||
        (modelStr !== "subscription" && type === "reel-to-reel")) {
      return;
    }
    
    const isSub = type === "subscription";
    const reels = c.reels || 0;
    const actualRate = isSub ? (reels * c.ppr) || 14999 : c.ppr;
    const baseRate = isSub ? c.baseRate || actualRate : c.baseRate || c.ppr;
    const discountPct = baseRate > actualRate ? Math.round(((baseRate - actualRate) / baseRate) * 100) : 0;
    
    const updatedClient = {
      name: c.name || "",
      business: c.business || "",
      phone: c.phone || "",
      instagram: c.instagram || "",
      reels: reels,
      ppr: isSub ? (actualRate / (reels || 1)) : c.ppr,
      image: c.image || "",
      billingModel: isSub ? "Subscription" : "Reel-to-Reel",
      plan: isSub ? "Custom" : "",
      baseRate: baseRate,
      bargain: discountPct,
    };
    
    await onUpdateClient(c.id, updatedClient);
  };

  const handleUpdatePlan = async (c: Client, plan: string) => {
    if (c.plan === plan) return;
    
    let reels = c.reels;
    let actualRate = c.reels * c.ppr;
    let baseRate = c.baseRate || actualRate;
    
    if (plan !== "Custom") {
      const planInfo = STANDARD_PLANS[plan];
      if (planInfo) {
        reels = planInfo.reels;
        actualRate = planInfo.price;
        baseRate = planInfo.price;
      }
    } else {
      actualRate = actualRate || 14999;
      baseRate = baseRate || actualRate;
    }
    
    const discountPct = baseRate > actualRate ? Math.round(((baseRate - actualRate) / baseRate) * 100) : 0;
    
    const updatedClient = {
      name: c.name || "",
      business: c.business || "",
      phone: c.phone || "",
      instagram: c.instagram || "",
      reels: reels,
      ppr: actualRate / (reels || 1),
      image: c.image || "",
      billingModel: "Subscription",
      plan: plan,
      baseRate: baseRate,
      bargain: discountPct,
    };
    
    await onUpdateClient(c.id, updatedClient);
  };

  const handleUpdateRate = async (c: Client, rateValue: number) => {
    const isSub = String(c.billingModel || "").toLowerCase() === "subscription";
    const reels = c.reels || 0;
    const actualRate = rateValue;
    const baseRate = c.baseRate || actualRate;
    const discountPct = baseRate > actualRate ? Math.round(((baseRate - actualRate) / baseRate) * 100) : 0;
    
    const updatedClient = {
      name: c.name || "",
      business: c.business || "",
      phone: c.phone || "",
      instagram: c.instagram || "",
      reels: reels,
      ppr: isSub ? (actualRate / (reels || 1)) : actualRate,
      image: c.image || "",
      billingModel: c.billingModel || "Reel-to-Reel",
      plan: c.plan || "",
      baseRate: baseRate,
      bargain: discountPct,
    };
    await onUpdateClient(c.id, updatedClient);
  };

  const handleUpdateBaseRate = async (c: Client, baseRateValue: number) => {
    const isSub = String(c.billingModel || "").toLowerCase() === "subscription";
    const reels = c.reels || 0;
    const actualRate = isSub ? (reels * c.ppr) : c.ppr;
    const discountPct = baseRateValue > actualRate ? Math.round(((baseRateValue - actualRate) / baseRateValue) * 100) : 0;
    
    const updatedClient = {
      name: c.name || "",
      business: c.business || "",
      phone: c.phone || "",
      instagram: c.instagram || "",
      reels: reels,
      ppr: c.ppr,
      image: c.image || "",
      billingModel: c.billingModel || "Reel-to-Reel",
      plan: c.plan || "",
      baseRate: baseRateValue,
      bargain: discountPct,
    };
    await onUpdateClient(c.id, updatedClient);
  };



  const maxRevenue = Math.max(...clients.map((c) => getClientRevenue(c)), 1);

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
    setEditClientData({ ...c });
  };

  const handleSaveEdit = async () => {
    if (!editClientData) return;
    setIsSaving(true);
    try {
      await onUpdateClient(editClientData.id, editClientData);
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
    const newRevenuePreview = previewRate;

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
              />
              <input
                className="phone-input td-input td-input-phone"
                placeholder="Phone Number"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
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
          />
        </td>
        <td>
          <input
            className="company-input td-input td-input-lg"
            placeholder="Instagram Handle"
            value={newClientInstagram}
            onChange={(e) => setNewClientInstagram(e.target.value)}
          />
        </td>
        <td>
          <input
            type="date"
            className="company-input td-input td-input-lg"
            value={newClientDate}
            onChange={(e) => setNewClientDate(e.target.value)}
          />
        </td>
        <td>
          <CustomSelect
            size="sm"
            value={newBillingType}
            onChange={(val) => {
              const type = val as "reel-to-reel" | "subscription";
              setNewBillingType(type);
              if (type === "subscription") {
                setNewSubscriptionPlan("Custom");
              } else {
                setNewSubscriptionPlan("");
              }
            }}
            options={billingTypeOptions}
          />
        </td>
        {(activeModelFilter === "all" || newBillingType === "subscription") && (
          <td>
            {newBillingType === "subscription" ? (
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
              />
            ) : (
              <span className="td-muted">—</span>
            )}
          </td>
        )}
        <td>
          <input
            type="number"
            className="company-input td-input td-input-sm"
            placeholder="Reels/Mo"
            value={newClientReels}
            onChange={(e) => setNewClientReels(e.target.value)}
          />
        </td>
        <td>
          <input
            type="number"
            className="company-input td-input td-input-md"
            placeholder={newBillingType === "subscription" ? "Base Monthly Fee" : "Base Price/Reel"}
            value={newBasePpr}
            onChange={(e) => setNewBasePpr(e.target.value)}
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

  const renderClientRow = (c: Client, isSub: boolean) => {
    const isEditing = editingClientId !== null && String(editingClientId) === String(c.id);

    if (isEditing) {
      const editActualRate = editClientData ? (editClientData.billingModel?.toLowerCase() === "subscription" ? Math.round(editClientData.reels * editClientData.ppr) : editClientData.ppr) : 0;
      const editBaseRate = editClientData?.baseRate || editActualRate;
      const editDiscountPct = editBaseRate > editActualRate ? Math.round(((editBaseRate - editActualRate) / editBaseRate) * 100) : 0;
      const editRev = editClientData ? getClientRevenue(editClientData) : 0;

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
                  placeholder="Name"
                />
                <input
                  type="text"
                  className="phone-input td-input td-input-phone"
                  value={editClientData?.phone || ""}
                  onChange={(e) => setEditClientData(prev => prev ? { ...prev, phone: e.target.value } : null)}
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
              placeholder="Business"
            />
          </td>
          <td>
            <input
              type="text"
              className="company-input td-input td-input-lg"
              value={editClientData?.instagram || ""}
              onChange={(e) => setEditClientData(prev => prev ? { ...prev, instagram: e.target.value } : null)}
              placeholder="Instagram"
            />
          </td>
          <td>
            <input
              type="date"
              className="company-input td-input td-input-lg"
              value={editClientData?.date || ""}
              onChange={(e) => setEditClientData(prev => prev ? { ...prev, date: e.target.value } : null)}
            />
          </td>
          <td>
            <CustomSelect
              size="sm"
              value={editClientData?.billingModel?.toLowerCase() === "subscription" ? "subscription" : "reel-to-reel"}
              onChange={(val) => {
                const type = val as "reel-to-reel" | "subscription";
                const isNewSub = type === "subscription";
                setEditClientData(prev => {
                  if (!prev) return null;
                  const reelsVal = prev.reels || 0;
                  const actualRate = isNewSub ? Math.round(reelsVal * prev.ppr) : prev.ppr;
                  return {
                    ...prev,
                    billingModel: isNewSub ? "Subscription" : "Reel-to-Reel",
                    plan: isNewSub ? "Custom" : "",
                    ppr: isNewSub ? (actualRate / (reelsVal || 1)) : actualRate,
                  };
                });
              }}
              options={billingTypeOptions}
            />
          </td>
          {(activeModelFilter === "all" || isSub) && (
            <td>
              {isSub ? (
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
              ) : (
                <span className="td-muted">—</span>
              )}
            </td>
          )}
          <td>
            <input
              type="number"
              className="company-input td-input td-input-sm"
              value={editClientData?.reels ?? ""}
              onChange={(e) => {
                const reelsVal = Number(e.target.value || 0);
                setEditClientData(prev => {
                  if (!prev) return null;
                  const isSubActive = String(prev.billingModel || "").toLowerCase() === "subscription";
                  const actualRate = isSubActive ? Math.round((prev.reels || 0) * prev.ppr) : prev.ppr;
                  return {
                    ...prev,
                    reels: reelsVal,
                    ppr: isSubActive ? (actualRate / (reelsVal || 1)) : prev.ppr,
                  };
                });
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
                  const isSubActive = String(prev.billingModel || "").toLowerCase() === "subscription";
                  const actualRate = isSubActive ? Math.round(prev.reels * prev.ppr) : prev.ppr;
                  const discountPct = baseRateVal > actualRate ? Math.round(((baseRateVal - actualRate) / baseRateVal) * 100) : 0;
                  return {
                    ...prev,
                    baseRate: baseRateVal,
                    bargain: discountPct,
                  };
                });
              }}
              placeholder={isSub ? "Base Monthly Fee" : "Base Price/Reel"}
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
              value={editClientData ? Math.round(getClientRevenue(editClientData)) : ""}
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
                    ppr: calculatedPpr,
                    bargain: discountPct,
                  };
                });
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

    const actualRate = isSub ? Math.round(c.reels * c.ppr) : c.ppr;
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
          <span>
            {isSub ? "SUB" : "RTR"}
          </span>
        </td>
        {(activeModelFilter === "all" || isSub) && (
          <td>
            {isSub ? (
              <span className="plan-badge" style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "4px", fontSize: "11px" }}>
                {c.plan || "Custom"}
              </span>
            ) : (
              <span className="td-muted">—</span>
            )}
          </td>
        )}
        <td>
          <span className="client-reels-text" style={{ fontWeight: 500 }}>{c.reels}</span>
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
      {/* Controls: Search and Sort */}
      <div className="controls">
        <div className="search-wrap">
          <img
            src="/assets/icons/search.svg"
            alt="Search"
            className="search-icon"
          />
          <input
            id="search-input"
            placeholder="Search clients by name, business, insta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input search-input-padded"
          />
        </div>

        {/* Model Filter Toggle - Segmented control style */}
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-control-item ${activeModelFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveModelFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`segmented-control-item ${activeModelFilter === "bm" ? "active" : ""}`}
            onClick={() => setActiveModelFilter("bm")}
          >
            SUB
          </button>
          <button
            type="button"
            className={`segmented-control-item ${activeModelFilter === "rtr" ? "active" : ""}`}
            onClick={() => setActiveModelFilter("rtr")}
          >
            RTR
          </button>
        </div>
      </div>

      {/* ─── ALL (COMBINED) CLIENTS TABLE ─── */}
      {activeModelFilter === "all" && (
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
                  <th>BM</th>
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
                    <td colSpan={13}>
                      <div className="empty">
                        <div className="empty-icon">◎</div>
                        <div className="empty-text">No clients found</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedClients.map((c) => renderClientRow(c, String(c.billingModel).toLowerCase() === "subscription"))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── SUBSCRIPTION CLIENTS TABLE (BM) ─── */}
      {activeModelFilter === "bm" && (
        <div className="table-wrap table-scroll-wrap mt-24">
          <div className="table-inner-scroll">
            <table>
              <thead>
                <tr>
                  <th className="th-checkbox">
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={areAllSubSelected}
                      onChange={handleSelectAllSub}
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
                  <th>BM</th>
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
                {newClientRow && newBillingType === "subscription" && renderNewClientRow()}

                {subscriptionClients.length === 0 && !(newClientRow && newBillingType === "subscription") ? (
                  <tr>
                    <td colSpan={13}>
                      <div className="empty">
                        <div className="empty-icon">◎</div>
                        <div className="empty-text">No subscription clients found</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  subscriptionClients.map((c) => renderClientRow(c, true))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── REEL-TO-REEL CLIENTS TABLE (RTR) ─── */}
      {activeModelFilter === "rtr" && (
        <div className="table-wrap table-scroll-wrap mt-24">
          <div className="table-inner-scroll">
            <table>
              <thead>
                <tr>
                  <th className="th-checkbox">
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={areAllR2RSelected}
                      onChange={handleSelectAllR2R}
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
                  <th>BM</th>
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
                {newClientRow && newBillingType === "reel-to-reel" && renderNewClientRow()}

                {reeltoreelClients.length === 0 && !(newClientRow && newBillingType === "reel-to-reel") ? (
                  <tr>
                    <td colSpan={12}>
                      <div className="empty">
                        <div className="empty-icon">◎</div>
                        <div className="empty-text">No reel-to-reel clients found</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reeltoreelClients.map((c) => renderClientRow(c, false))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
export default Clients;
