import React, { useState, useEffect } from "react";
import { Lead } from "../types";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { SortIcon } from "../components/SortIcon";
import {
  formatDisplayDate,
  createWhatsAppLink,
  toDateStr,
} from "../utils/format";
import { loadXLSX } from "../utils/loader";

interface SalesProps {
  leads: Lead[];
  isLoading: boolean;
  newLeadRow: boolean;
  setNewLeadRow: (show: boolean) => void;
  salesFilterExpanded: boolean;
  setSalesFilterExpanded: (show: boolean) => void;
  selectedLeadIds: string[];
  setSelectedLeadIds: React.Dispatch<React.SetStateAction<string[]>>;
  onAddLead: (lead: Omit<Lead, "id" | "createdDate">) => Promise<void>;
  onUpdateLead: (
    id: string | number,
    lead: Omit<Lead, "id" | "createdDate">
  ) => Promise<void>;
  onDeleteLead: (id: string | number) => Promise<void>;
  showToast: (msg: string, type?: "success" | "error") => void;
  setConfirmModal: React.Dispatch<
    React.SetStateAction<{
      title: string;
      message: string;
      onConfirm: () => void | Promise<void>;
    } | null>
  >;
}

export function Sales({
  leads,
  isLoading,
  newLeadRow,
  setNewLeadRow,
  salesFilterExpanded,
  setSalesFilterExpanded,
  selectedLeadIds,
  setSelectedLeadIds,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  showToast,
  setConfirmModal,
}: SalesProps) {
  const [salesDateFrom, setSalesDateFrom] = useState("");
  const [salesDateTo, setSalesDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"company" | "createdDate">("createdDate");
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [salesDateFrom, salesDateTo, search, sortKey, sortDir]);

  // New lead inputs state
  const [newCompany, setNewCompany] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newContacted, setNewContacted] = useState(false);

  if (isLoading) {
    return <SkeletonLoader type="sales" />;
  }

  function normalizeDate(str: string) {
    if (!str) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return toDateStr(d);
  }

  const filteredLeads = leads.filter((item) => {
    const cd = normalizeDate(item.createdDate);
    if (salesDateFrom && cd && cd < salesDateFrom) {
      return false;
    }
    if (salesDateTo && cd && cd > salesDateTo) {
      return false;
    }

    const query = search.toLowerCase();
    const comp = String(item.companyName ?? "").toLowerCase();
    const person = String(item.contactPerson ?? "").toLowerCase();
    const phone = String(item.phoneNumber ?? "").toLowerCase();
    const notes = String(item.notes ?? "").toLowerCase();

    if (
      query &&
      !comp.includes(query) &&
      !person.includes(query) &&
      !phone.includes(query) &&
      !notes.includes(query)
    ) {
      return false;
    }

    return true;
  });

  const handleSort = (key: "company" | "createdDate") => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === -1 ? 1 : -1));
    } else {
      setSortKey(key);
      setSortDir(-1);
    }
  };

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortKey === "company") {
      const av = String(a.companyName ?? "").toLowerCase();
      const bv = String(b.companyName ?? "").toLowerCase();
      return av.localeCompare(bv) * sortDir;
    }
    if (sortKey === "createdDate") {
      const av = new Date(normalizeDate(a.createdDate) || 0).getTime();
      const bv = new Date(normalizeDate(b.createdDate) || 0).getTime();
      return (av - bv) * sortDir;
    }
    return 0;
  });

  const totalItems = sortedLeads.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const pagedLeads = sortedLeads.slice(startIndex, endIndex);

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

  const allFilteredIds = filteredLeads.map((item) => String(item.id)).filter(Boolean);
  const areAllFilteredLeadsSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedLeadIds.includes(id));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds((prev) => {
        const newSelection = [...prev];
        allFilteredIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    } else {
      setSelectedLeadIds((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id))
      );
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedLeadIds((prev) => [...prev, id]);
    } else {
      setSelectedLeadIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleCreateLead = async () => {
    if (!newCompany.trim()) {
      showToast("Company Name is required", "error");
      return;
    }

    try {
      await onAddLead({
        category: "",
        companyName: newCompany,
        contactPerson: "",
        phoneNumber: newPhone,
        notes: newNotes,
        contacted: newContacted ? "Yes" : "No",
      });

      setNewCompany("");
      setNewPhone("");
      setNewNotes("");
      setNewContacted(false);
      setNewLeadRow(false);
    } catch (e: any) {
      showToast(e.message || "Failed to add lead", "error");
    }
  };

  const handleExcelImportClick = async () => {
    try {
      showToast("Loading Excel parsing engine...");
      await loadXLSX();
      const fileInput = document.getElementById(
        "sales-file-input"
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.click();
    } catch (e) {
      showToast("Failed to load Excel library", "error");
    }
  };

  const handleSalesImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const XLSX = await loadXLSX();
    if (!XLSX) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        if (!rows.length) {
          showToast("No records found", "error");
          return;
        }

        showToast(`Importing ${rows.length} leads...`);
        for (const row of rows) {
          await onAddLead({
            category: row.Category || "",
            companyName: row.CompanyName || row.Company || "",
            contactPerson: row.ContactPerson || "",
            phoneNumber: String(row.PhoneNumber || row.Phone || ""),
            notes: row.Notes || "",
            contacted: row.Contacted || "No",
          });
        }
        showToast(`${rows.length} leads imported successfully`);
      } catch (err: any) {
        showToast(err.message || "Failed to import leads", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      {/* Controls: Search */}
      <div className="controls">
        <div className="search-wrap">
          <img
            src="/assets/icons/search.svg"
            alt="Search"
            style={{
              width: "16px",
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          <input
            type="text"
            className="search-input"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Date Filter Panel */}
      {salesFilterExpanded && (
        <div
          className="sales-date-filter-panel"
          style={{ display: "flex", marginBottom: "16px" }}
        >
          <div
            className="sales-date-filter"
            style={{ marginTop: 0, marginBottom: 0, width: "100%" }}
          >
            <div className="date-filter-group">
              <label className="date-filter-label">From</label>
              <input
                type="date"
                id="sales-date-from"
                className="date-filter-input"
                value={salesDateFrom}
                onChange={(e) => setSalesDateFrom(e.target.value)}
              />
            </div>
            <div className="date-filter-group">
              <label className="date-filter-label">To</label>
              <input
                type="date"
                id="sales-date-to"
                className="date-filter-input"
                value={salesDateTo}
                onChange={(e) => setSalesDateTo(e.target.value)}
              />
            </div>
            {(salesDateFrom || salesDateTo) && (
              <button
                id="clear-sales-date"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSalesDateFrom("");
                  setSalesDateTo("");
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input for Excel Uploads */}
      <input
        type="file"
        id="sales-file-input"
        accept=".xlsx,.xls,.csv"
        style={{ display: "none" }}
        onChange={handleSalesImport}
      />

      {/* Topbar Buttons Portal Actions - Renders triggers for actions */}
      {/* (In parent component, triggers can fire functions on this instance if exposed, or we can handle buttons inside topbar dynamically) */}
      <div style={{ display: "none" }}>
        <button id="import-sales-btn-trigger" onClick={handleExcelImportClick} />
      </div>

      {/* Leads Table */}
      <div className="table-wrap" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table className="sales-table">
          <thead>
            <tr>
              <th style={{ width: "40px", paddingLeft: "16px" }}>
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={areAllFilteredLeadsSelected}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="dn">ID</th>
              <th className="dn">Category</th>
              <th
                onClick={() => handleSort("company")}
                className="sortable-header"
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span>Company Name</span>
                  <SortIcon active={sortKey === "company"} dir={sortDir} />
                </div>
              </th>
              <th className="dn">Contact Person</th>
              <th>Phone Number</th>
              <th>Notes</th>
              <th
                onClick={() => handleSort("createdDate")}
                className="sortable-header"
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span>Created Date</span>
                  <SortIcon active={sortKey === "createdDate"} dir={sortDir} />
                </div>
              </th>
              <th>Contacted</th>
              <th style={{ width: "120px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* New Lead Row */}
            {newLeadRow && (
              <tr className="new-lead-row">
                <td></td>
                <td className="dn"></td>
                <td className="dn"></td>
                <td>
                  <input
                    id="new-company"
                    className="company-input"
                    placeholder="Company Name"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                  />
                </td>
                <td className="dn"></td>
                <td>
                  <input
                    id="new-phone"
                    className="phone-input"
                    placeholder="Phone Number"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </td>
                <td>
                  <input
                    id="new-note"
                    className="note-input"
                    placeholder="Notes"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </td>
                <td></td>
                <td>
                  <input
                    type="checkbox"
                    id="new-contacted"
                    className="contacted-toggle"
                    checked={newContacted}
                    onChange={(e) => setNewContacted(e.target.checked)}
                  />
                </td>
                <td>
                  <div className="action-btns">
                    <img
                      src="/assets/icons/check.svg"
                      className="create-lead-btn"
                      alt="Save"
                      title="Create Lead"
                      onClick={handleCreateLead}
                      style={{ cursor: "pointer" }}
                    />
                    <img
                      src="/assets/icons/close.svg"
                      className="cancel-lead-btn"
                      alt="Cancel"
                      title="Cancel"
                      onClick={() => setNewLeadRow(false)}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </td>
              </tr>
            )}

            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <div className="empty">
                    <div className="empty-icon">◎</div>
                    <div className="empty-text">
                      No leads found
                      {salesDateFrom || salesDateTo || search
                        ? " for selected search/date parameters"
                        : ""}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              pagedLeads.map((item) => {
                const leadId = item.id;
                const updateLeadField = async (
                  field: keyof Omit<Lead, "id" | "createdDate">,
                  value: any
                ) => {
                  const updatedLead = {
                    category: item.category || "",
                    companyName: item.companyName || "",
                    contactPerson: item.contactPerson || "",
                    phoneNumber: item.phoneNumber || "",
                    notes: item.notes || "",
                    contacted: item.contacted || "No",
                    [field]: value,
                  };
                  if (item[field] === value) return;
                  await onUpdateLead(leadId, updatedLead);
                };

                const markContactedAndCall = async () => {
                  if (item.contacted !== "Yes") {
                    await updateLeadField("contacted", "Yes");
                  }
                };

                return (
                  <tr key={leadId}>
                    <td style={{ width: "40px", paddingLeft: "16px" }}>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        checked={selectedLeadIds.includes(String(leadId))}
                        onChange={(e) =>
                          handleSelectRow(String(leadId), e.target.checked)
                        }
                      />
                    </td>
                    <td className="dn">{leadId}</td>
                    <td className="dn">
                      <span className="badge badge-gold">{item.category}</span>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="company-input"
                        defaultValue={item.companyName || ""}
                        placeholder="Company Name"
                        onBlur={(e) =>
                          updateLeadField("companyName", e.target.value)
                        }
                      />
                    </td>
                    <td className="dn">{item.contactPerson}</td>
                    <td>
                      <input
                        type="text"
                        className="phone-input"
                        defaultValue={item.phoneNumber || ""}
                        placeholder="Phone Number"
                        onBlur={(e) =>
                          updateLeadField("phoneNumber", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="note-input"
                        defaultValue={item.notes || ""}
                        placeholder="Add note..."
                        title={item.notes || "No notes added"}
                        onBlur={(e) => updateLeadField("notes", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid transparent",
                          background: "transparent",
                          color: "white",
                        }}
                      />
                    </td>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        color: "var(--muted)",
                        fontSize: "12px",
                      }}
                    >
                      {formatDisplayDate(item.createdDate)}
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        className="contacted-toggle"
                        checked={item.contacted === "Yes"}
                        onChange={(e) =>
                          updateLeadField(
                            "contacted",
                            e.target.checked ? "Yes" : "No"
                          )
                        }
                      />
                    </td>
                    <td style={{ width: "120px" }}>
                      <div className="action-btns">
                        <a
                          href={`tel:${item.phoneNumber}`}
                          className="call-sale"
                          title="Call"
                          onClick={markContactedAndCall}
                        >
                          <img
                            src="/assets/icons/phone.svg"
                            alt="Call"
                            width="18"
                            height="18"
                          />
                        </a>
                        <a
                          href={createWhatsAppLink(item.phoneNumber)}
                          className="whatsapp-sale"
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp"
                          onClick={markContactedAndCall}
                        >
                          <img
                            src="/assets/icons/whatsapp.svg"
                            alt="WhatsApp"
                            width="18"
                            height="18"
                          />
                        </a>
                        <img
                          src="/assets/icons/delete.svg"
                          className="delete-sale delete-btn-td"
                          alt="Delete"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setConfirmModal({
                              title: "Delete Lead",
                              message: `Are you sure you want to delete lead from "${item.companyName}"?`,
                              onConfirm: () => onDeleteLead(leadId),
                            });
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
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
export default Sales;
