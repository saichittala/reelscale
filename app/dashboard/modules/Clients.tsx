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
  { value: "reel-to-reel", label: "Reel-to-Reel" },
  { value: "subscription", label: "Subscription" },
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
  const [isSaving, setIsSaving] = useState(false);

  // Reset to page 1 when search or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortKey, sortDir]);

  if (isLoading) {
    return <SkeletonLoader type="clients" />;
  }

  const getClientRevenue = (c: Client) => {
    return (c.reels || 0) * (c.ppr || 0);
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

  const totalItems = sortedClients.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const pagedClients = sortedClients.slice(startIndex, endIndex);

  const allFilteredClientIds = filteredClients.map((c) => String(c.id)).filter(Boolean);
  const areAllFilteredClientsSelected =
    allFilteredClientIds.length > 0 &&
    allFilteredClientIds.every((id) => selectedClientIds.includes(id));

  const handleSelectAllClients = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedClientIds((prev) => {
        const newSelection = [...prev];
        allFilteredClientIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    } else {
      setSelectedClientIds((prev) =>
        prev.filter((id) => !allFilteredClientIds.includes(id))
      );
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
        ppr: newBillingType === "subscription" ? (rateVal / (reelsVal || 1)) : rateVal,
        image: "",
        billingModel: newBillingType === "subscription" ? "Subscription" : "Reel-to-Reel",
        plan: newBillingType === "subscription" ? newSubscriptionPlan : "",
        baseRate: baseRateVal,
        bargain: discountPct,
      });
      
      setNewClientName("");
      setNewClientBusiness("");
      setNewClientPhone("");
      setNewClientInstagram("");
      setNewClientReels("");
      setNewClientPpr("");
      setNewBasePpr("");
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
  const previewRate = Number(newClientPpr || 0);
  const previewBase = Number(newBasePpr || newClientPpr || 0);
  const previewDiscount = previewBase > previewRate ? Math.round(((previewBase - previewRate) / previewBase) * 100) : 0;
  const newRevenuePreview = newBillingType === "subscription" ? previewRate : Number(newClientReels || 0) * previewRate;

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
      </div>

      {/* Clients Table */}
      <div className="table-wrap table-scroll-wrap">
        <div className="table-inner-scroll">
          <table>
          <thead>
            <tr>
              <th className="th-checkbox">
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={areAllFilteredClientsSelected}
                  onChange={handleSelectAllClients}
                />
              </th>
              <th
                onClick={() => handleSort("name")}
                className="sortable-header th-sortable"
              >
                <div className="th-header-inner">
                  <span>Client Name</span>
                  <SortIcon active={sortKey === "name"} dir={sortDir} />
                </div>
              </th>
              <th>Business</th>
              <th>Insta ID</th>
              <th>Billing Model</th>
              <th>Plan</th>
              <th
                onClick={() => handleSort("reels")}
                className="sortable-header th-sortable"
              >
                <div className="th-header-inner">
                  <span>Reels</span>
                  <SortIcon active={sortKey === "reels"} dir={sortDir} />
                </div>
              </th>
              <th>Rate / Plan Price</th>
              <th>Base Rate</th>
              <th>Bargain</th>
              <th
                onClick={() => handleSort("revenue")}
                className="sortable-header th-sortable"
              >
                <div className="th-header-inner">
                  <span>Revenue</span>
                  <SortIcon active={sortKey === "revenue"} dir={sortDir} />
                </div>
              </th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {totalItems === 0 && !newClientRow ? (
              <tr>
                <td colSpan={12}>
                  <div className="empty">
                    <div className="empty-icon">◎</div>
                    <div className="empty-text">No clients found</div>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {/* New Client Creation Row */}
                {newClientRow && (
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
                    <td>
                      <input
                        type="number"
                        className="company-input td-input td-input-sm"
                        placeholder="Reels"
                        value={newClientReels}
                        onChange={(e) => setNewClientReels(e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="company-input td-input td-input-md"
                        placeholder={newBillingType === "subscription" ? "Monthly Fee" : "Price/Reel"}
                        value={newClientPpr}
                        onChange={(e) => setNewClientPpr(e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="company-input td-input td-input-md"
                        placeholder="Base Rate"
                        value={newBasePpr}
                        onChange={(e) => setNewBasePpr(e.target.value)}
                      />
                    </td>
                    <td>
                      {previewDiscount > 0 ? (
                        <span className="bargain-badge bargained">
                          -{previewDiscount}% Bargained
                        </span>
                      ) : (
                        <span className="bargain-badge no-bargain">
                          0% Bargain
                        </span>
                      )}
                    </td>
                    <td className="td-bold-green">
                      ₹{newRevenuePreview.toLocaleString("en-IN")}
                    </td>
                    <td>
                      <div className="action-btns action-btns-row">
                        {isSaving ? (
                          <div className="btn-loader" style={{ margin: 0, width: "16px", height: "16px" }}></div>
                        ) : (
                          <img
                            src="/assets/icons/check.svg"
                            className="save-client-btn"
                            alt="Save"
                            onClick={handleSaveNewClient}
                          />
                        )}
                        <img
                          src="/assets/icons/close.svg"
                          className="cancel-client-btn"
                          alt="Cancel"
                          onClick={() => setNewClientRow(false)}
                        />
                      </div>
                    </td>
                  </tr>
                )}
                {pagedClients.map((c) => {
                  const rev = getClientRevenue(c);
                  const pct = Math.round((rev / maxRevenue) * 100);
                  const nameStr = String(c.name || "").trim();
                  const businessStr = String(c.business || "").trim();
                  const displayName = nameStr || businessStr || "Unnamed Client";
                  const avatarChar = (nameStr ? nameStr[0] : businessStr ? businessStr[0] : "?").toUpperCase();

                  // Determine active billing model fields
                  const isSub = String(c.billingModel || "").toLowerCase() === "subscription";
                  const billingModelValue = isSub ? "subscription" : "reel-to-reel";
                  const planValue = c.plan || "Custom";
                  const actualRate = isSub ? Math.round(c.reels * c.ppr) : c.ppr;
                  const baseRate = c.baseRate || actualRate;
                  const discountPct = c.bargain || (baseRate > actualRate ? Math.round(((baseRate - actualRate) / baseRate) * 100) : 0);

                  return (
                    <tr key={c.id}>
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
                            <input
                              key={`${c.id}-name-${c.name}`}
                              type="text"
                              className="company-input td-input td-input-name"
                              defaultValue={c.name}
                              onBlur={(e) => updateClientField(c, "name", e.target.value)}
                              placeholder="Name"
                            />
                            <input
                              key={`${c.id}-phone-${c.phone}`}
                              type="text"
                              className="phone-input td-input td-input-phone"
                              defaultValue={c.phone}
                              onBlur={(e) => updateClientField(c, "phone", e.target.value)}
                              placeholder="Phone"
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <input
                          key={`${c.id}-business-${c.business}`}
                          type="text"
                          className="company-input td-input td-input-2xl"
                          defaultValue={c.business}
                          onBlur={(e) => updateClientField(c, "business", e.target.value)}
                          placeholder="Business"
                        />
                      </td>
                      <td>
                        <input
                          key={`${c.id}-instagram-${c.instagram}`}
                          type="text"
                          className="company-input td-input td-input-lg"
                          defaultValue={c.instagram}
                          onBlur={(e) => updateClientField(c, "instagram", e.target.value)}
                          placeholder="Instagram"
                        />
                      </td>
                      <td>
                        <CustomSelect
                          size="sm"
                          value={billingModelValue}
                          onChange={(val) => handleUpdateBillingModel(c, val as any)}
                          options={billingTypeOptions}
                        />
                      </td>
                      <td>
                        {isSub ? (
                          <CustomSelect
                            size="sm"
                            value={planValue}
                            onChange={(plan) => handleUpdatePlan(c, plan)}
                            options={planOptions}
                          />
                        ) : (
                          <span className="td-muted">—</span>
                        )}
                      </td>
                      <td>
                        <input
                          key={`${c.id}-reels-${c.reels}`}
                          type="number"
                          className="company-input td-input td-input-sm"
                          defaultValue={c.reels}
                          onBlur={async (e) => {
                            const reelsVal = Number(e.target.value || 0);
                            const updatedClient = {
                              name: c.name || "",
                              business: c.business || "",
                              phone: c.phone || "",
                              instagram: c.instagram,
                              reels: reelsVal,
                              ppr: isSub ? (actualRate / (reelsVal || 1)) : c.ppr,
                              image: c.image || "",
                              billingModel: c.billingModel,
                              plan: c.plan,
                              baseRate: c.baseRate,
                              bargain: c.bargain,
                            };
                            await onUpdateClient(c.id, updatedClient);
                          }}
                          placeholder="Reels"
                        />
                      </td>
                      <td>
                        <input
                          key={`${c.id}-rate-${actualRate}`}
                          type="number"
                          className="company-input td-input td-input-md"
                          defaultValue={actualRate}
                          onBlur={(e) => handleUpdateRate(c, Number(e.target.value || 0))}
                          placeholder={isSub ? "Monthly Fee" : "Price/Reel"}
                        />
                      </td>
                      <td>
                        <input
                          key={`${c.id}-basePpr-${baseRate}`}
                          type="number"
                          className="company-input td-input td-input-md"
                          defaultValue={baseRate}
                          onBlur={(e) => handleUpdateBaseRate(c, Number(e.target.value || 0))}
                          placeholder={isSub ? "Base Plan Price" : "Base Price/Reel"}
                        />
                      </td>
                      <td>
                        {discountPct > 0 ? (
                          <span className="bargain-badge bargained" title={`Base: ₹${baseRate.toLocaleString("en-IN")} | Actual: ₹${actualRate.toLocaleString("en-IN")}`}>
                            -{discountPct}% Bargained
                          </span>
                        ) : (
                          <span className="bargain-badge no-bargain">
                            0% Bargain
                          </span>
                        )}
                      </td>
                      <td className="td-rev td-bold-green">
                        ₹{rev.toLocaleString("en-IN")}
                      </td>
                      <td className="th-actions">
                        <div className="action-btns">
                          <img
                            src="/assets/icons/delete.svg"
                            alt="Delete"
                            className="del-client"
                            title="Delete Client"
                            onClick={() => {
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
                })}
              </>
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
                      &thinsp;&hellip;&thinsp;
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
export default Clients;
