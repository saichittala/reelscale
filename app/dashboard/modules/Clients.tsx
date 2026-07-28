import React, { useState, useEffect } from "react";
import { Client } from "../types";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { SortIcon } from "../components/SortIcon";

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

  // Inline additions states
  const [newClientName, setNewClientName] = useState("");
  const [newClientBusiness, setNewClientBusiness] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientInstagram, setNewClientInstagram] = useState("");
  const [newClientReels, setNewClientReels] = useState("");
  const [newClientPpr, setNewClientPpr] = useState("");

  // Reset to page 1 when search or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortKey, sortDir]);

  if (isLoading) {
    return <SkeletonLoader type="clients" />;
  }

  const getClientRevenue = (c: Client) => (c.reels || 0) * (c.ppr || 0);

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
    if (!newClientBusiness.trim()) {
      showToast("Business name is required", "error");
      return;
    }
    try {
      await onAddClient({
        name: newClientName,
        business: newClientBusiness,
        phone: newClientPhone,
        instagram: newClientInstagram,
        reels: Number(newClientReels || 0),
        ppr: Number(newClientPpr || 0),
        image: "",
      });
      setNewClientName("");
      setNewClientBusiness("");
      setNewClientPhone("");
      setNewClientInstagram("");
      setNewClientReels("");
      setNewClientPpr("");
      setNewClientRow(false);
    } catch (e: any) {
      showToast(e.message || "Failed to create client", "error");
    }
  };

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
      [field]: field === "reels" || field === "ppr" ? Number(value || 0) : value,
    };
    if (c[field] === updatedClient[field]) return;
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
            placeholder="Search clients..."
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
              <th
                onClick={() => handleSort("reels")}
                className="sortable-header th-sortable"
              >
                <div className="th-header-inner">
                  <span>Reels</span>
                  <SortIcon active={sortKey === "reels"} dir={sortDir} />
                </div>
              </th>
              <th>Price/Reel</th>
              <th
                onClick={() => handleSort("revenue")}
                className="sortable-header th-sortable"
              >
                <div className="th-header-inner">
                  <span>Revenue</span>
                  <SortIcon active={sortKey === "revenue"} dir={sortDir} />
                </div>
              </th>
              <th>Revenue Share</th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {totalItems === 0 && !newClientRow ? (
              <tr>
                <td colSpan={9}>
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
                            className="company-input td-input td-input-xl"
                            placeholder="Client Name"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                          />
                          <input
                            className="phone-input td-input td-input-xl"
                            placeholder="Phone Number"
                            value={newClientPhone}
                            onChange={(e) => setNewClientPhone(e.target.value)}
                            style={{ marginTop: "-4px" }}
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
                        placeholder="Price/Reel"
                        value={newClientPpr}
                        onChange={(e) => setNewClientPpr(e.target.value)}
                      />
                    </td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <div className="action-btns action-btns-row">
                        <img
                          src="/assets/icons/check.svg"
                          className="save-client-btn"
                          alt="Save"
                          onClick={handleSaveNewClient}
                        />
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
                const displayName =
                  c.name && c.name.trim()
                    ? c.name
                    : c.business || "Unnamed Client";
                const avatarChar = (
                  c.name && c.name.trim()
                    ? c.name.trim()[0]
                    : c.business && c.business.trim()
                    ? c.business.trim()[0]
                    : "?"
                ).toUpperCase();

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
                          {c.image ? (
                            <img
                              src={c.image}
                              alt={displayName}
                              className="avatar-img"
                            />
                          ) : (
                            avatarChar
                          )}
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
                      <input
                        key={`${c.id}-reels-${c.reels}`}
                        type="number"
                        className="company-input td-input td-input-sm"
                        defaultValue={c.reels}
                        onBlur={(e) => updateClientField(c, "reels", e.target.value)}
                        placeholder="Reels"
                      />
                    </td>
                    <td>
                      <input
                        key={`${c.id}-ppr-${c.ppr}`}
                        type="number"
                        className="company-input td-input td-input-md"
                        defaultValue={c.ppr}
                        onBlur={(e) => updateClientField(c, "ppr", e.target.value)}
                        placeholder="Price/Reel"
                      />
                    </td>
                    <td className="td-rev">
                      ₹{rev.toLocaleString("en-IN")}
                    </td>
                    <td className="td-minw">
                      <div className="rev-bar">
                        <div
                          className="rev-bar-fill"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
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
export default Clients;
