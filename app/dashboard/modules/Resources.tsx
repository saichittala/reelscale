import React, { useState, useEffect, useRef } from "react";
import { Client, BusinessDocument, ClientContract, DocumentLineItem } from "../types";
import { toDateStr, formatDisplayDate } from "../utils/format";
import { CustomSelect } from "../components/CustomSelect";

interface ResourcesProps {
  clients: Client[];
  showToast: (msg: string, type?: "success" | "error" | "loading") => void;
  setConfirmModal: (modal: {
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null) => void;
}

// Predefined Payment Details for ReelScale
const DEFAULT_PAYMENT_DETAILS = {
  accountName: "Chittala Sai Durga Surya Prakash",
  bank: "HDFC Bank - Ambajipeta",
  accountNumber: "50100657038254",
  ifsc: "HDFC0008100",
  upiId: "saichittala7@ybl",
  terms: "100% upfront payment is due instantly to secure booking.",
};

// Formatting helpers
function formatRupees(num: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

// Mock initial data if storage is empty
const INITIAL_DOCUMENTS: BusinessDocument[] = [
  {
    id: "doc-1",
    number: "RS-Q-2026-0042",
    type: "Quotation",
    status: "Generated",
    clientId: "1",
    clientName: "Alice Miller",
    companyName: "Miller Group",
    clientEmail: "alice@millergroup.com",
    clientPhone: "+91 99662 39433",
    billingAddress: "HITEC City, Phase 2, Hyderabad, TS, 500081",
    projectName: "Monthly Content Partnership",
    service: "Monthly Content Partnership",
    issueDate: "2026-08-25",
    dueDate: "2026-09-10",
    validityDate: "2026-09-25",
    lineItems: [
      {
        id: "item-1",
        description: "Premium Short-form Reels (High-retention editing, color grade, sound design)",
        quantity: 12,
        unit: "Reels",
        rate: 6000,
        amount: 72000,
      },
      {
        id: "item-2",
        description: "On-site Video Production Shoot (Cinematic 4K setup, lighting, audio capture)",
        quantity: 2,
        unit: "Shoots",
        rate: 15000,
        amount: 30000,
      },
    ],
    subtotal: 102000,
    discount: 10, // 10%
    tax: 18, // 18% GST
    expenses: 3000, // Travel
    total: 111324, // (102000 - 10200) + 16524 + 3000
    paymentDetails: DEFAULT_PAYMENT_DETAILS,
    terms: "Quotation validity: 30 days. Delivery within 10 working days from production date.",
    notes: "Thank you for choosing ReelScale! We look forward to scaling your social presence.",
    createdAt: "2026-08-25T10:30:00.000Z",
    updatedAt: "2026-08-25T10:30:00.000Z",
  },
  {
    id: "doc-2",
    number: "RS-INV-2026-0018",
    type: "Invoice",
    status: "Paid",
    clientId: "2",
    clientName: "David Lee",
    companyName: "Lee Marketing",
    clientEmail: "david@leemarketing.co",
    clientPhone: "+91 88776 55432",
    billingAddress: "Jubilee Hills, Road No 36, Hyderabad, TS, 500033",
    projectName: "Brand Video Shoot",
    service: "Brand Shoot",
    issueDate: "2026-08-10",
    dueDate: "2026-08-25",
    lineItems: [
      {
        id: "item-3",
        description: "Brand Commercial Promo Shoot & Post Production Editing",
        quantity: 1,
        unit: "Project",
        rate: 45000,
        amount: 45000,
      },
    ],
    subtotal: 45000,
    discount: 0,
    tax: 18,
    expenses: 0,
    total: 53100,
    paymentDetails: DEFAULT_PAYMENT_DETAILS,
    terms: "Invoice payable within 15 days of issue.",
    notes: "Commercial rights included for all channels.",
    createdAt: "2026-08-10T12:00:00.000Z",
    updatedAt: "2026-08-10T12:00:00.000Z",
  },
];

const INITIAL_CONTRACTS: ClientContract[] = [
  {
    id: "contract-1",
    contractNumber: "RS-CON-2026-0012",
    clientId: "1",
    clientName: "Alice Miller (Miller Group)",
    contractType: "Content Retainer",
    startDate: "2026-09-01",
    endDate: "2027-02-28",
    status: "Active",
    amount: 111324,
    notes: "6 months monthly content creation partnership retainer.",
    createdAt: "2026-08-25T10:45:00.000Z",
  },
];

export function Resources({ clients, showToast, setConfirmModal }: ResourcesProps) {
  const [view, setView] = useState<"overview" | "invoice-generator" | "quotation-generator" | "contracts" | "history">("overview");
  
  // Storage states
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [contracts, setContracts] = useState<ClientContract[]>([]);

  // Generator states
  const [activeDoc, setActiveDoc] = useState<BusinessDocument | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("custom");
  const [showNewClientForm, setShowNewClientForm] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [mobileTab, setMobileTab] = useState<"details" | "preview">("details");

  // History Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Contracts Search & Filter states
  const [searchContract, setSearchContract] = useState("");
  const [statusContract, setStatusContract] = useState("all");
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [newContract, setNewContract] = useState<Partial<ClientContract>>({
    clientId: "custom",
    clientName: "",
    contractType: "Content Retainer",
    startDate: toDateStr(new Date()),
    endDate: toDateStr(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)), // 6 months
    status: "Draft",
    amount: 0,
    notes: "",
  });

  // Success Confirmation modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedDocNum, setGeneratedDocNum] = useState("");

  // Refs
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Load cache on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedDocs = localStorage.getItem("reelscale_documents");
      if (cachedDocs) {
        try {
          setDocuments(JSON.parse(cachedDocs));
        } catch (e) {
          setDocuments(INITIAL_DOCUMENTS);
        }
      } else {
        setDocuments(INITIAL_DOCUMENTS);
        localStorage.setItem("reelscale_documents", JSON.stringify(INITIAL_DOCUMENTS));
      }

      const cachedContracts = localStorage.getItem("reelscale_contracts");
      if (cachedContracts) {
        try {
          setContracts(JSON.parse(cachedContracts));
        } catch (e) {
          setContracts(INITIAL_CONTRACTS);
        }
      } else {
        setContracts(INITIAL_CONTRACTS);
        localStorage.setItem("reelscale_contracts", JSON.stringify(INITIAL_CONTRACTS));
      }
    }
  }, []);

  // Sync / AutoSave timer when activeDoc changes
  useEffect(() => {
    if (!activeDoc) return;
    
    // Set status to unsaved
    setSaveStatus("unsaved");

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    autosaveTimer.current = setTimeout(() => {
      setSaveStatus("saving");
      
      // Update list of documents and save to localStorage
      setDocuments((prev) => {
        const index = prev.findIndex((d) => d.id === activeDoc.id);
        let updated = [...prev];
        if (index > -1) {
          updated[index] = { ...activeDoc, updatedAt: new Date().toISOString() };
        } else {
          updated.push({ ...activeDoc, updatedAt: new Date().toISOString() });
        }
        localStorage.setItem("reelscale_documents", JSON.stringify(updated));
        return updated;
      });

      setTimeout(() => {
        setSaveStatus("saved");
      }, 500);

    }, 1500); // 1.5s debounce autosave

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [activeDoc]);

  // Generate unique document number
  const generateDocNumber = (type: "Invoice" | "Quotation"): string => {
    const year = new Date().getFullYear();
    const prefix = type === "Invoice" ? "RS-INV" : "RS-Q";
    const typeDocs = documents.filter((d) => d.type === type);
    const count = typeDocs.length + 1;
    const formattedCount = String(count).padStart(4, "0");
    return `${prefix}-${year}-${formattedCount}`;
  };

  // Setup dynamic form defaults on load
  const startDocumentGenerator = (type: "Invoice" | "Quotation", docToEdit?: BusinessDocument) => {
    if (docToEdit) {
      setActiveDoc(docToEdit);
      setSelectedClientId(String(docToEdit.clientId));
      setShowNewClientForm(docToEdit.clientId === "custom");
    } else {
      const docNum = generateDocNumber(type);
      const newDoc: BusinessDocument = {
        id: "doc-" + Math.random().toString(36).substring(2, 9),
        number: docNum,
        type: type,
        status: "Draft",
        clientId: "custom",
        clientName: "",
        companyName: "",
        clientEmail: "",
        clientPhone: "",
        billingAddress: "",
        projectName: "Monthly Content Partnership",
        service: "Monthly Content Partnership",
        issueDate: toDateStr(new Date()),
        dueDate: toDateStr(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)), // 15 days due
        validityDate: toDateStr(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days valid (quotation)
        lineItems: [
          {
            id: "item-" + Math.random().toString(36).substring(2, 5),
            description: "Premium Content Creation (Includes Hook testing, Scripting, Editing & Color Grading)",
            quantity: 8,
            unit: "Reels",
            rate: 6500,
            amount: 52000,
          },
        ],
        subtotal: 52000,
        discount: 0,
        tax: 18, // Default GST
        expenses: 0,
        total: 61360,
        paymentDetails: DEFAULT_PAYMENT_DETAILS,
        terms: DEFAULT_PAYMENT_DETAILS.terms,
        notes: "Thank you for collaborating with ReelScale! We create reels that retain, convert and scale.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setActiveDoc(newDoc);
      setSelectedClientId("custom");
      setShowNewClientForm(true);
    }
    setView(type === "Invoice" ? "invoice-generator" : "quotation-generator");
    setMobileTab("details");
  };

  // Totals auto calculator helper
  const calculateTotals = (items: DocumentLineItem[], discPercent: number, taxPercent: number, extraExp: number) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const discountAmount = (subtotal * discPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxPercent) / 100;
    const total = taxableAmount + taxAmount + extraExp;
    return { subtotal, total };
  };

  const handleUpdateField = (key: keyof BusinessDocument, value: any) => {
    if (!activeDoc) return;
    const updated = { ...activeDoc, [key]: value } as BusinessDocument;
    
    // Auto calculate if items or adjustments changed
    if (key === "lineItems" || key === "discount" || key === "tax" || key === "expenses") {
      const lineItems = key === "lineItems" ? (value as DocumentLineItem[]) : activeDoc.lineItems;
      const discount = key === "discount" ? Number(value) : activeDoc.discount;
      const tax = key === "tax" ? Number(value) : activeDoc.tax;
      const expenses = key === "expenses" ? Number(value) : activeDoc.expenses;
      
      const { subtotal, total } = calculateTotals(lineItems, discount, tax, expenses);
      updated.subtotal = subtotal;
      updated.total = total;
    }
    
    setActiveDoc(updated);
  };

  // Client autocompletion selector
  const handleSelectClient = (cId: string) => {
    setSelectedClientId(cId);
    if (cId === "custom") {
      setShowNewClientForm(true);
      handleUpdateField("clientId", "custom");
      handleUpdateField("clientName", "");
      handleUpdateField("companyName", "");
      handleUpdateField("clientEmail", "");
      handleUpdateField("clientPhone", "");
      handleUpdateField("billingAddress", "");
      handleUpdateField("gstin", "");
    } else {
      setShowNewClientForm(false);
      const existingClient = clients.find((c) => String(c.id) === cId);
      if (existingClient) {
        const clientName = existingClient.name || existingClient.business || "";
        const companyName = existingClient.business || "";
        const clientEmail = existingClient.instagram ? `${existingClient.instagram.replace("@", "")}@instagram.com` : "";
        const clientPhone = existingClient.phone || "";
        const billingAddress = "Hyderabad, Telangana";
        
        setActiveDoc((prev) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            clientId: cId,
            clientName,
            companyName,
            clientEmail,
            clientPhone,
            billingAddress,
            gstin: "",
          };
          
          // Prepopulate line items rate/quantities if client has custom rate config
          if (existingClient.baseRate || existingClient.reels) {
            const reelsCount = existingClient.reels || 8;
            const rateVal = existingClient.baseRate || 6000;
            const prepopulatedItems = [
              {
                id: "item-init",
                description: `${reelsCount} Premium Content Partnership Reels`,
                quantity: reelsCount,
                unit: "Reels",
                rate: rateVal,
                amount: reelsCount * rateVal,
              },
            ];
            const { subtotal, total } = calculateTotals(prepopulatedItems, prev.discount, prev.tax, prev.expenses);
            updated.lineItems = prepopulatedItems;
            updated.subtotal = subtotal;
            updated.total = total;
          }
          return updated;
        });
      }
    }
  };

  // Add line item row
  const handleAddLineItem = () => {
    if (!activeDoc) return;
    const newItem: DocumentLineItem = {
      id: "item-" + Math.random().toString(36).substring(2, 5),
      description: "Additional video editing revision or customized request",
      quantity: 1,
      unit: "Item",
      rate: 5000,
      amount: 5000,
    };
    const lineItems = [...activeDoc.lineItems, newItem];
    handleUpdateField("lineItems", lineItems);
  };

  // Update line item row field
  const handleUpdateLineItem = (itemId: string, field: keyof DocumentLineItem, value: any) => {
    if (!activeDoc) return;
    const lineItems = activeDoc.lineItems.map((item) => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value } as DocumentLineItem;
        if (field === "quantity" || field === "rate") {
          const qty = field === "quantity" ? Number(value) : item.quantity;
          const rate = field === "rate" ? Number(value) : item.rate;
          updatedItem.amount = qty * rate;
        }
        return updatedItem;
      }
      return item;
    });
    handleUpdateField("lineItems", lineItems);
  };

  // Duplicate line item row
  const handleDuplicateLineItem = (itemId: string) => {
    if (!activeDoc) return;
    const itemToClone = activeDoc.lineItems.find((i) => i.id === itemId);
    if (!itemToClone) return;
    const newItem: DocumentLineItem = {
      ...itemToClone,
      id: "item-" + Math.random().toString(36).substring(2, 5),
    };
    const lineItems = [...activeDoc.lineItems, newItem];
    handleUpdateField("lineItems", lineItems);
    showToast("Line item duplicated", "success");
  };

  // Delete line item row
  const handleDeleteLineItem = (itemId: string) => {
    if (!activeDoc) return;
    if (activeDoc.lineItems.length <= 1) {
      showToast("Document must contain at least one line item", "error");
      return;
    }
    const lineItems = activeDoc.lineItems.filter((i) => i.id !== itemId);
    handleUpdateField("lineItems", lineItems);
  };

  // Generate / print PDF
  const handleGeneratePdf = () => {
    if (!activeDoc) return;
    
    // Form verification checks
    if (!activeDoc.clientName.trim()) {
      showToast("Please enter client name details", "error");
      return;
    }
    if (!activeDoc.projectName.trim()) {
      showToast("Please specify project name", "error");
      return;
    }

    // Force save state
    const generatedDoc = {
      ...activeDoc,
      status: "Generated" as const,
      updatedAt: new Date().toISOString(),
    };

    setDocuments((prev) => {
      const index = prev.findIndex((d) => d.id === generatedDoc.id);
      let updated = [...prev];
      if (index > -1) {
        updated[index] = generatedDoc;
      } else {
        updated.push(generatedDoc);
      }
      localStorage.setItem("reelscale_documents", JSON.stringify(updated));
      return updated;
    });

    setActiveDoc(generatedDoc);
    setGeneratedDocNum(generatedDoc.number);
    setSaveStatus("saved");
    
    // Show success overlay
    setShowSuccessModal(true);
    showToast(`${generatedDoc.type} generated successfully!`, "success");
  };

  // Print execution helper (opens native print output dialog)
  const triggerBrowserPrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Duplicate generated document
  const handleDuplicateDoc = (doc: BusinessDocument) => {
    const freshType = doc.type;
    const docNum = generateDocNumber(freshType);
    const duplicated: BusinessDocument = {
      ...doc,
      id: "doc-" + Math.random().toString(36).substring(2, 9),
      number: docNum,
      status: "Draft",
      issueDate: toDateStr(new Date()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDocuments((prev) => {
      const updated = [...prev, duplicated];
      localStorage.setItem("reelscale_documents", JSON.stringify(updated));
      return updated;
    });
    showToast(`Duplicated ${doc.number} as new draft ${docNum}`, "success");
  };

  // Delete generated document
  const handleDeleteDoc = (docId: string, docNum: string) => {
    setConfirmModal({
      title: `Delete Document ${docNum}`,
      message: `Are you sure you want to permanently delete this document from history? This action cannot be undone.`,
      onConfirm: () => {
        setDocuments((prev) => {
          const updated = prev.filter((d) => d.id !== docId);
          localStorage.setItem("reelscale_documents", JSON.stringify(updated));
          return updated;
        });
        showToast(`Document ${docNum} deleted successfully`, "success");
      },
    });
  };

  // Add Client Contract Form submit
  const handleCreateContract = () => {
    if (!newContract.clientName || newContract.amount === undefined || !newContract.contractNumber) {
      showToast("Please enter all required contract details", "error");
      return;
    }
    const created: ClientContract = {
      id: "contract-" + Math.random().toString(36).substring(2, 9),
      contractNumber: newContract.contractNumber,
      clientId: newContract.clientId || "custom",
      clientName: newContract.clientName,
      contractType: newContract.contractType || "Content Retainer",
      startDate: newContract.startDate || toDateStr(new Date()),
      endDate: newContract.endDate || toDateStr(new Date()),
      status: newContract.status as any || "Active",
      amount: newContract.amount,
      notes: newContract.notes,
      createdAt: new Date().toISOString(),
    };
    
    setContracts((prev) => {
      const updated = [...prev, created];
      localStorage.setItem("reelscale_contracts", JSON.stringify(updated));
      return updated;
    });

    setIsContractModalOpen(false);
    showToast(`Contract ${created.contractNumber} created successfully!`, "success");
  };

  // Delete Client Contract
  const handleDeleteContract = (contractId: string, contractNum: string) => {
    setConfirmModal({
      title: `Delete Contract ${contractNum}`,
      message: `Are you sure you want to permanently delete this contract from the agreement tracker?`,
      onConfirm: () => {
        setContracts((prev) => {
          const updated = prev.filter((c) => c.id !== contractId);
          localStorage.setItem("reelscale_contracts", JSON.stringify(updated));
          return updated;
        });
        showToast(`Contract ${contractNum} deleted`, "success");
      },
    });
  };

  // Filtered lists helpers
  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesType = typeFilter === "all" || d.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.contractNumber.toLowerCase().includes(searchContract.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchContract.toLowerCase()) ||
      c.contractType.toLowerCase().includes(searchContract.toLowerCase());
    const matchesStatus = statusContract === "all" || c.status === statusContract;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* View: Resources Overview Landing Page */}
      {view === "overview" && (
        <>
          <div className="resources-grid">
            <div className="resource-card" onClick={() => startDocumentGenerator("Invoice")}>
              <div>
                <div className="resource-card-title">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--red)"}}>
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  Invoice Generator
                </div>
                <div className="resource-card-desc">
                  Create professional, itemized ReelScale invoices for clients, including GST calculations and auto-filled billing.
                </div>
              </div>
              <div className="resource-card-action">
                Create Invoice
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>

            <div className="resource-card" onClick={() => startDocumentGenerator("Quotation")}>
              <div>
                <div className="resource-card-title">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--gold)"}}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  Quotation Generator
                </div>
                <div className="resource-card-desc">
                  Generate premium project estimates and quotations for prospects using optimized structures and templates.
                </div>
              </div>
              <div className="resource-card-action" style={{color:"var(--gold)"}}>
                Create Quotation
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>

            <div className="resource-card" onClick={() => setView("contracts")}>
              <div>
                <div className="resource-card-title">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--green)"}}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Client Contracts
                </div>
                <div className="resource-card-desc">
                  Track client retainer partnerships, start/end dates, agreement metrics, and active service lifecycles.
                </div>
              </div>
              <div className="resource-card-action" style={{color:"var(--green)"}}>
                Manage Contracts
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>

            <div className="resource-card" onClick={() => setView("history")}>
              <div>
                <div className="resource-card-title">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--white)"}}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Document History
                </div>
                <div className="resource-card-desc">
                  Access previously generated invoices, estimates, and drafts. Edit existing files or download high-fidelity PDFs.
                </div>
              </div>
              <div className="resource-card-action" style={{color:"var(--white)"}}>
                View History
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View: Document Generator Workspace */}
      {(view === "invoice-generator" || view === "quotation-generator") && activeDoc && (
        <div className="resources-workspace-wrapper">
          {/* Header Bar */}
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button className="btn btn-ghost" style={{ padding: "8px 12px", minWidth: "auto" }} onClick={() => setView("overview")}>
                ← Back
              </button>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 600 }}>{activeDoc.type} Generator</h2>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>Document No: {activeDoc.number}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="save-status-indicator">
                <span className={`save-status-dot ${saveStatus}`}></span>
                <span style={{ textTransform: "capitalize" }}>{saveStatus === "unsaved" ? "unsaved changes" : saveStatus}</span>
              </div>
              <button className="btn btn-ghost" onClick={() => {
                showToast("Draft saved successfully", "success");
                setSaveStatus("saved");
              }}>
                Save Draft
              </button>
              <button className="btn btn-primary" onClick={handleGeneratePdf}>
                Generate PDF
              </button>
            </div>
          </div>

          {/* Mobile responsive tabs switch */}
          <div className="segmented-control dn" style={{ marginBottom: "20px" }} id="mobile-workspace-tabs">
            <button className={`segmented-btn ${mobileTab === "details" ? "active" : ""}`} onClick={() => setMobileTab("details")}>Edit details</button>
            <button className={`segmented-btn ${mobileTab === "preview" ? "active" : ""}`} onClick={() => setMobileTab("preview")}>Preview Document</button>
          </div>

          {/* Desktop Dual Panel Layout */}
          <div className="document-workspace">
            {/* Left Panel Form details */}
            <div className={`details-panel ${mobileTab === "preview" ? "mobile-hidden-panel" : ""}`}>
              {/* Step 1: Switch between Invoice/Quotation */}
              <div>
                <div className="section-title-sm">Document Type</div>
                <div className="segmented-control">
                  <button className={`segmented-btn ${activeDoc.type === "Quotation" ? "active" : ""}`} onClick={() => {
                    handleUpdateField("type", "Quotation");
                    handleUpdateField("number", generateDocNumber("Quotation"));
                  }}>
                    Quotation
                  </button>
                  <button className={`segmented-btn ${activeDoc.type === "Invoice" ? "active" : ""}`} onClick={() => {
                    handleUpdateField("type", "Invoice");
                    handleUpdateField("number", generateDocNumber("Invoice"));
                  }}>
                    Invoice
                  </button>
                </div>
              </div>

              {/* Step 2: Client configuration */}
              <div>
                <div className="section-title-sm">Client Details</div>
                <div className="form-group mb-16">
                  <label>Select Client profile</label>
                  <CustomSelect
                    value={selectedClientId}
                    onChange={handleSelectClient}
                    options={[
                      { value: "custom", label: "[ + Enter New Client details ]" },
                      ...clients.map((c) => ({
                        value: String(c.id),
                        label: `${c.name || c.business} (${c.business || "No Company"})`,
                      })),
                    ]}
                  />
                </div>

                {showNewClientForm && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                    <div className="form-group">
                      <label>Client Contact Name *</label>
                      <input type="text" className="form-input" placeholder="e.g. Alice Miller" value={activeDoc.clientName} onChange={(e) => handleUpdateField("clientName", e.target.value)} />
                    </div>
                    <div className="form-row-grid">
                      <div className="form-group">
                        <label>Company/Business Name</label>
                        <input type="text" className="form-input" placeholder="e.g. Miller Group" value={activeDoc.companyName} onChange={(e) => handleUpdateField("companyName", e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>GSTIN (Optional)</label>
                        <input type="text" className="form-input" placeholder="e.g. 36AAAAA1111A1Z1" value={activeDoc.gstin || ""} onChange={(e) => handleUpdateField("gstin", e.target.value)} />
                      </div>
                    </div>
                    <div className="form-row-grid">
                      <div className="form-group">
                        <label>Billing Email</label>
                        <input type="email" className="form-input" placeholder="e.g. billing@miller.com" value={activeDoc.clientEmail} onChange={(e) => handleUpdateField("clientEmail", e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Billing Phone</label>
                        <input type="text" className="form-input" placeholder="e.g. +91 99662 39433" value={activeDoc.clientPhone} onChange={(e) => handleUpdateField("clientPhone", e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Billing Address</label>
                      <textarea className="form-input" rows={2} placeholder="Full physical billing address" value={activeDoc.billingAddress} onChange={(e) => handleUpdateField("billingAddress", e.target.value)} style={{ resize: "none" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Project Configuration */}
              <div>
                <div className="section-title-sm">Project & Timing</div>
                <div className="form-group mb-16">
                  <label>Project/Engagement Title *</label>
                  <input type="text" className="form-input" placeholder="e.g. Premium Short-form Reels Production" value={activeDoc.projectName} onChange={(e) => handleUpdateField("projectName", e.target.value)} />
                </div>
                
                <div className="form-row-grid mb-16">
                  <div className="form-group">
                    <label>Main Service Category</label>
                    <CustomSelect
                      value={activeDoc.service}
                      onChange={(val) => handleUpdateField("service", val)}
                      options={[
                        { value: "Premium Reels", label: "Premium Reels" },
                        { value: "Monthly Content Partnership", label: "Monthly Content Partnership" },
                        { value: "Brand Shoot", label: "Brand Shoot" },
                        { value: "Social Media Content", label: "Social Media Content" },
                        { value: "Video Production", label: "Video Production" },
                      ]}
                    />
                  </div>
                  <div className="form-group">
                    <label>Issue Date</label>
                    <input type="date" className="form-input" value={activeDoc.issueDate} onChange={(e) => handleUpdateField("issueDate", e.target.value)} />
                  </div>
                </div>

                <div className="form-row-grid">
                  <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" className="form-input" value={activeDoc.dueDate} onChange={(e) => handleUpdateField("dueDate", e.target.value)} />
                  </div>
                  {activeDoc.type === "Quotation" ? (
                    <div className="form-group">
                      <label>Validity Date (Quotation)</label>
                      <input type="date" className="form-input" value={activeDoc.validityDate} onChange={(e) => handleUpdateField("validityDate", e.target.value)} />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Doc Number (Auto)</label>
                      <input type="text" className="form-input" value={activeDoc.number} readOnly disabled style={{opacity:0.6}} />
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4: Line Items Table */}
              <div>
                <div className="section-title-sm">Line Items Breakdown</div>
                <div style={{ overflowX: "auto" }}>
                  <table className="line-items-editor-table">
                    <thead>
                      <tr>
                        <th style={{ width: "45%" }}>Description</th>
                        <th style={{ width: "12%" }}>Qty</th>
                        <th style={{ width: "15%" }}>Unit</th>
                        <th style={{ width: "15%" }}>Rate (₹)</th>
                        <th style={{ width: "13%", textAlign: "right" }}>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeDoc.lineItems.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <input type="text" value={item.description} onChange={(e) => handleUpdateLineItem(item.id, "description", e.target.value)} placeholder="Service description details" />
                          </td>
                          <td>
                            <input type="number" min="1" value={item.quantity} onChange={(e) => handleUpdateLineItem(item.id, "quantity", e.target.value)} style={{ textAlign: "center" }} />
                          </td>
                          <td>
                            <input type="text" value={item.unit} onChange={(e) => handleUpdateLineItem(item.id, "unit", e.target.value)} placeholder="Reels/month" style={{ textAlign: "center" }} />
                          </td>
                          <td>
                            <input type="number" min="0" value={item.rate} onChange={(e) => handleUpdateLineItem(item.id, "rate", e.target.value)} style={{ textAlign: "right" }} />
                          </td>
                          <td style={{ textAlign: "right", fontSize: "14px", fontWeight: "600", paddingRight: "8px" }}>
                            ₹{(item.quantity * item.rate).toLocaleString()}
                          </td>
                          <td className="actions-cell">
                            <button className="btn-icon-danger" title="Duplicate row" onClick={() => handleDuplicateLineItem(item.id)}>
                              🗐
                            </button>
                            <button className="btn-icon-danger" title="Delete row" onClick={() => handleDeleteLineItem(item.id)}>
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button className="btn-add-item" onClick={handleAddLineItem}>
                  + Add Service / Line Item
                </button>

                {/* Adjustments: Discount, Tax, Expenses */}
                <div className="totals-summary-block" style={{ marginTop: "24px" }}>
                  <div className="totals-row-item">
                    <span>Subtotal:</span>
                    <span style={{ fontWeight: 600, color: "var(--white)" }}>₹{activeDoc.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="totals-row-item">
                    <span>Discount (%):</span>
                    <input type="number" min="0" max="100" value={activeDoc.discount} onChange={(e) => handleUpdateField("discount", Number(e.target.value))} />
                  </div>
                  <div className="totals-row-item">
                    <span>GST Tax (%):</span>
                    <input type="number" min="0" max="100" value={activeDoc.tax} onChange={(e) => handleUpdateField("tax", Number(e.target.value))} />
                  </div>
                  <div className="totals-row-item">
                    <span>Travel / Additional Expenses (₹):</span>
                    <input type="number" min="0" value={activeDoc.expenses} onChange={(e) => handleUpdateField("expenses", Number(e.target.value))} />
                  </div>
                  <div className="totals-row-item grand-total">
                    <span>Grand Total:</span>
                    <span>{formatRupees(activeDoc.total)}</span>
                  </div>
                </div>
              </div>

              {/* Step 5: Bank details */}
              <div>
                <div className="section-title-sm">Payment Details</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="form-group">
                    <label>Account Name</label>
                    <input type="text" className="form-input" value={activeDoc.paymentDetails.accountName} onChange={(e) => {
                      const pay = { ...activeDoc.paymentDetails, accountName: e.target.value };
                      handleUpdateField("paymentDetails", pay);
                    }} />
                  </div>
                  <div className="form-row-grid">
                    <div className="form-group">
                      <label>Bank Name</label>
                      <input type="text" className="form-input" value={activeDoc.paymentDetails.bank} onChange={(e) => {
                        const pay = { ...activeDoc.paymentDetails, bank: e.target.value };
                        handleUpdateField("paymentDetails", pay);
                      }} />
                    </div>
                    <div className="form-group">
                      <label>Account Number</label>
                      <input type="text" className="form-input" value={activeDoc.paymentDetails.accountNumber} onChange={(e) => {
                        const pay = { ...activeDoc.paymentDetails, accountNumber: e.target.value };
                        handleUpdateField("paymentDetails", pay);
                      }} />
                    </div>
                  </div>
                  <div className="form-row-grid">
                    <div className="form-group">
                      <label>IFSC Code</label>
                      <input type="text" className="form-input" value={activeDoc.paymentDetails.ifsc} onChange={(e) => {
                        const pay = { ...activeDoc.paymentDetails, ifsc: e.target.value };
                        handleUpdateField("paymentDetails", pay);
                      }} />
                    </div>
                    <div className="form-group">
                      <label>UPI ID</label>
                      <input type="text" className="form-input" value={activeDoc.paymentDetails.upiId} onChange={(e) => {
                        const pay = { ...activeDoc.paymentDetails, upiId: e.target.value };
                        handleUpdateField("paymentDetails", pay);
                      }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 6: Terms and Notes */}
              <div>
                <div className="section-title-sm">Terms & Conditions</div>
                <div className="form-group mb-16">
                  <label>Document Terms / Notes</label>
                  <textarea className="form-input" rows={2} value={activeDoc.terms} onChange={(e) => handleUpdateField("terms", e.target.value)} style={{ resize: "none" }} />
                </div>
                <div className="form-group">
                  <label>Footer Personal Note</label>
                  <textarea className="form-input" rows={2} value={activeDoc.notes} onChange={(e) => handleUpdateField("notes", e.target.value)} style={{ resize: "none" }} />
                </div>
              </div>
            </div>

            {/* Right Panel Printable A4 Preview */}
            <div className={`preview-panel ${mobileTab === "details" ? "mobile-hidden-panel" : ""}`} id="print-sheet-anchor">
              <div className="a4-document-container">
                <div className="a4-document">
                  <div>
                    {/* Header: Logo & Title */}
                    <div className="a4-header">
                      <div className="a4-logo">
                        <img src="/assets/r_light.svg" alt="ReelScale Logo" style={{ height: "24px" }} />
                      </div>
                      <div className="a4-document-title">{activeDoc.type}</div>
                    </div>

                    {/* Metadata: Doc details and Client */}
                    <div className="a4-meta-grid">
                      <div>
                        <div className="a4-meta-col-title">Prepared For</div>
                        <div className="a4-meta-text" style={{ fontWeight: 600 }}>{activeDoc.clientName || "Client Representative"}</div>
                        {activeDoc.companyName && <div className="a4-meta-text">{activeDoc.companyName}</div>}
                        {activeDoc.clientEmail && <div className="a4-meta-text" style={{ fontSize: "12.5px", color: "#52525b" }}>{activeDoc.clientEmail}</div>}
                        {activeDoc.clientPhone && <div className="a4-meta-text" style={{ fontSize: "12.5px", color: "#52525b" }}>{activeDoc.clientPhone}</div>}
                        {activeDoc.billingAddress && <div className="a4-meta-text" style={{ marginTop: "6px", fontSize: "12px", color: "#71717a", whiteSpace: "pre-line" }}>{activeDoc.billingAddress}</div>}
                        {activeDoc.gstin && <div className="a4-meta-text" style={{ marginTop: "4px", fontSize: "12px", fontWeight: 500 }}>GSTIN: {activeDoc.gstin}</div>}
                      </div>

                      <div style={{ textAlign: "right", justifySelf: "end", width: "100%", maxWidth: "240px" }}>
                        <div className="a4-meta-col-title">Document Info</div>
                        <div className="a4-meta-label-value">
                          <span>Doc Number:</span>
                          <span>{activeDoc.number}</span>
                        </div>
                        <div className="a4-meta-label-value">
                          <span>Issue Date:</span>
                          <span>{formatDisplayDate(activeDoc.issueDate)}</span>
                        </div>
                        <div className="a4-meta-label-value">
                          <span>Due Date:</span>
                          <span>{formatDisplayDate(activeDoc.dueDate)}</span>
                        </div>
                        {activeDoc.type === "Quotation" && activeDoc.validityDate && (
                          <div className="a4-meta-label-value">
                            <span>Valid Until:</span>
                            <span>{formatDisplayDate(activeDoc.validityDate)}</span>
                          </div>
                        )}
                        <div className="a4-meta-label-value" style={{ borderTop: "1px solid #e4e4e7", paddingTop: "6px", marginTop: "6px" }}>
                          <span>Project:</span>
                          <span style={{ maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={activeDoc.projectName}>
                            {activeDoc.projectName || "Partnership"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Table items */}
                    <table className="a4-items-table">
                      <thead>
                        <tr>
                          <th style={{ width: "55%" }}>Service Description</th>
                          <th style={{ width: "12%", textAlign: "center" }}>Qty</th>
                          <th style={{ width: "13%", textAlign: "center" }}>Unit</th>
                          <th style={{ width: "20%", textAlign: "right" }}>Rate</th>
                          <th style={{ width: "20%", textAlign: "right" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeDoc.lineItems.map((item) => (
                          <tr key={item.id}>
                            <td>{item.description || "Video Editing Service"}</td>
                            <td style={{ textAlign: "center" }}>{item.quantity}</td>
                            <td style={{ textAlign: "center" }}>{item.unit}</td>
                            <td style={{ textAlign: "right" }}>₹{item.rate.toLocaleString()}</td>
                            <td style={{ textAlign: "right", fontWeight: 500 }}>₹{(item.quantity * item.rate).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals Summary */}
                    <div className="a4-totals-block">
                      <div className="a4-totals-row">
                        <span>Subtotal:</span>
                        <span>₹{activeDoc.subtotal.toLocaleString()}</span>
                      </div>
                      {activeDoc.discount > 0 && (
                        <div className="a4-totals-row">
                          <span>Discount ({activeDoc.discount}%):</span>
                          <span>- ₹{((activeDoc.subtotal * activeDoc.discount) / 100).toLocaleString()}</span>
                        </div>
                      )}
                      {activeDoc.tax > 0 && (
                        <div className="a4-totals-row">
                          <span>GST Tax ({activeDoc.tax}%):</span>
                          <span>+ ₹{(((activeDoc.subtotal - (activeDoc.subtotal * activeDoc.discount) / 100) * activeDoc.tax) / 100).toLocaleString()}</span>
                        </div>
                      )}
                      {activeDoc.expenses > 0 && (
                        <div className="a4-totals-row">
                          <span>Expenses:</span>
                          <span>+ ₹{activeDoc.expenses.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="a4-totals-row grand-total">
                        <span>Grand Total:</span>
                        <span>{formatRupees(activeDoc.total)}</span>
                      </div>
                    </div>

                    {/* Payment details Box */}
                    <div className="a4-payment-block">
                      <div style={{ fontWeight: 700, fontSize: "13px", textTransform: "uppercase", borderBottom: "1px solid #e4e4e7", paddingBottom: "6px", marginBottom: "8px" }}>
                        Payment Instructions & Details
                      </div>
                      <div>Beneficiary Account Transfer or UPI:</div>
                      <div className="a4-payment-grid">
                        <div>
                          <strong>Account Name:</strong> {activeDoc.paymentDetails.accountName}<br />
                          <strong>Bank Name:</strong> {activeDoc.paymentDetails.bank}<br />
                          <strong>Account Number:</strong> {activeDoc.paymentDetails.accountNumber}
                        </div>
                        <div>
                          <strong>IFSC Code:</strong> {activeDoc.paymentDetails.ifsc}<br />
                          <strong>UPI Virtual ID:</strong> {activeDoc.paymentDetails.upiId}<br />
                          <strong>Payment Terms:</strong> {activeDoc.paymentDetails.terms}
                        </div>
                      </div>
                    </div>

                    {/* Terms T&C */}
                    {activeDoc.terms && (
                      <div className="a4-promise-block" style={{ whiteSpace: "pre-line" }}>
                        <strong>Terms & Conditions:</strong><br />
                        {activeDoc.terms}
                      </div>
                    )}
                  </div>

                  {/* Signatures Footer */}
                  <div>
                    {activeDoc.notes && (
                      <div style={{ fontSize: "12px", color: "#52525b", textAlign: "center", borderTop: "1px solid #e4e4e7", paddingTop: "12px", marginBottom: "20px" }}>
                        {activeDoc.notes}
                      </div>
                    )}
                    <div className="a4-signatures-block">
                      <div className="a4-signature-line-col">
                        <div className="a4-signature-line"></div>
                        <div className="a4-signature-title">Authorized Partner</div>
                        <div className="a4-signature-subtitle">For ReelScale Co.</div>
                      </div>
                      <div className="a4-signature-line-col" style={{ textAlign: "right" }}>
                        <div className="a4-signature-line"></div>
                        <div className="a4-signature-title" style={{ textAlign: "right" }}>Client Partner Signoff</div>
                        <div className="a4-signature-subtitle" style={{ textAlign: "right" }}>{activeDoc.clientName || "Client Representative"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View: Document History Table list */}
      {view === "history" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button className="btn btn-ghost" style={{ padding: "8px 12px", minWidth: "auto" }} onClick={() => setView("overview")}>
                ← Back
              </button>
              <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Document History Tracker</h2>
            </div>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn btn-secondary" onClick={() => startDocumentGenerator("Quotation")}>+ New Quotation</button>
              <button className="btn btn-primary" onClick={() => startDocumentGenerator("Invoice")}>+ New Invoice</button>
            </div>
          </div>

          {/* Filter Row controls */}
          <div className="filter-row">
            <div className="filter-group-left">
              <div className="search-input-wrap">
                <input type="text" className="filter-input-search" placeholder="Search number, client, project..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              
              <CustomSelect
                value={typeFilter}
                onChange={setTypeFilter}
                className="filter-select"
                options={[
                  { value: "all", label: "All Types" },
                  { value: "Invoice", label: "Invoices" },
                  { value: "Quotation", label: "Quotations" },
                ]}
              />

              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                className="filter-select"
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "Draft", label: "Drafts" },
                  { value: "Generated", label: "Generated" },
                  { value: "Sent", label: "Sent" },
                  { value: "Paid", label: "Paid" },
                  { value: "Expired", label: "Expired" },
                  { value: "Cancelled", label: "Cancelled" },
                ]}
              />
            </div>
          </div>

          {/* Document list Table */}
          <div className="table-inner-scroll">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Type</th>
                  <th>Client</th>
                  <th>Project Name</th>
                  <th>Issue Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="th-actions" style={{ width: "200px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center" style={{ padding: "40px", color: "var(--muted)" }}>
                      No generated documents or drafts found. Select "Invoice/Quotation Generator" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => {
                    const statusClass =
                      doc.status === "Paid"
                        ? "badge-green"
                        : doc.status === "Draft"
                        ? "badge-default"
                        : doc.status === "Generated"
                        ? "badge-gold"
                        : "badge-red";
                        
                    return (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: 600, color: "var(--white)" }}>{doc.number}</td>
                        <td>
                          <span className={`badge ${doc.type === "Invoice" ? "badge-red" : "badge-gold"}`}>
                            {doc.type}
                          </span>
                        </td>
                        <td>
                          <div>{doc.clientName}</div>
                          {doc.companyName && <div style={{ fontSize: "11px", color: "var(--muted)" }}>{doc.companyName}</div>}
                        </td>
                        <td>{doc.projectName}</td>
                        <td>{formatDisplayDate(doc.issueDate)}</td>
                        <td style={{ fontWeight: 600 }}>{formatRupees(doc.total)}</td>
                        <td>
                          <span className={`badge ${statusClass}`}>{doc.status}</span>
                        </td>
                        <td className="th-actions">
                          <div className="action-btns">
                            <button className="edit-client" title="Edit/View Document" onClick={() => startDocumentGenerator(doc.type, doc)}>
                              <img src="/assets/icons/edit.svg" alt="Edit" width="14" />
                            </button>
                            <button className="call-sale" title="Duplicate Document" onClick={() => handleDuplicateDoc(doc)}>
                              🗐
                            </button>
                            <button className="del-client" title="Delete Document" onClick={() => handleDeleteDoc(doc.id, doc.number)}>
                              <img src="/assets/icons/delete.svg" alt="Delete" width="14" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View: Client Contracts list page */}
      {view === "contracts" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button className="btn btn-ghost" style={{ padding: "8px 12px", minWidth: "auto" }} onClick={() => setView("overview")}>
                ← Back
              </button>
              <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Client Contracts Tracker</h2>
            </div>
            
            <button className="btn btn-primary" onClick={() => {
              setNewContract({
                clientId: "custom",
                clientName: "",
                contractNumber: "RS-CON-" + new Date().getFullYear() + "-" + String(contracts.length + 1).padStart(4, "0"),
                contractType: "Content Retainer",
                startDate: toDateStr(new Date()),
                endDate: toDateStr(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)),
                status: "Active",
                amount: 80000,
                notes: "",
              });
              setIsContractModalOpen(true);
            }}>
              + Create Agreement / Contract
            </button>
          </div>

          {/* Search filter row */}
          <div className="filter-row">
            <div className="filter-group-left">
              <div className="search-input-wrap">
                <input type="text" className="filter-input-search" placeholder="Search number, client, type..." value={searchContract} onChange={(e) => setSearchContract(e.target.value)} />
              </div>
              <CustomSelect
                value={statusContract}
                onChange={setStatusContract}
                className="filter-select"
                options={[
                  { value: "all", label: "All Agreements" },
                  { value: "Active", label: "Active" },
                  { value: "Draft", label: "Drafts" },
                  { value: "Expired", label: "Expired" },
                  { value: "Cancelled", label: "Cancelled" },
                ]}
              />
            </div>
          </div>

          {/* Contracts table list */}
          <div className="table-inner-scroll">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Contract Num</th>
                  <th>Client Partner Name</th>
                  <th>Agreement Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Monthly Retainer</th>
                  <th>Status</th>
                  <th className="th-actions" style={{ width: "120px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center" style={{ padding: "40px", color: "var(--muted)" }}>
                      No active agreements or contract drafts tracked. Click "+ Create Agreement" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: "var(--white)" }}>{c.contractNumber}</td>
                      <td>{c.clientName}</td>
                      <td>
                        <span className="badge badge-gold">{c.contractType}</span>
                      </td>
                      <td>{formatDisplayDate(c.startDate)}</td>
                      <td>{formatDisplayDate(c.endDate)}</td>
                      <td style={{ fontWeight: 600 }}>{formatRupees(c.amount)}/mo</td>
                      <td>
                        <span className={`badge ${c.status === "Active" ? "badge-green" : c.status === "Draft" ? "badge-default" : "badge-red"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="th-actions">
                        <div className="action-btns">
                          <button className="del-client" title="Delete Agreement" onClick={() => handleDeleteContract(c.id, c.contractNumber)}>
                            <img src="/assets/icons/delete.svg" alt="Delete" width="14" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success Modal overlay for generated documents */}
      {showSuccessModal && activeDoc && (
        <div className="modal-overlay active">
          <div className="modal modal-sm" style={{ padding: "32px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-brand-10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>{activeDoc.type} Generated</h3>
            <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "24px" }}>
              Document <strong>{generatedDocNum}</strong> was generated successfully and added to history.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button className="btn btn-primary" onClick={() => {
                setShowSuccessModal(false);
                triggerBrowserPrint();
              }}>
                🖨️ Download PDF / Print Document
              </button>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => {
                  setShowSuccessModal(false);
                  setView("history");
                }}>
                  View History
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                  setShowSuccessModal(false);
                  startDocumentGenerator(activeDoc.type);
                }}>
                  Create Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Client Contract Dialog Modal */}
      {isContractModalOpen && (
        <div className="modal-overlay active">
          <div className="modal modal-sm" style={{ maxWidth: "480px" }}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div className="modal-title" style={{ fontSize: "18px", fontWeight: 700 }}>New Service Agreement</div>
              <button className="mobile-close-btn" style={{ background: "transparent", border: "none", cursor: "pointer" }} onClick={() => setIsContractModalOpen(false)}>
                <img src="/assets/icons/close.svg" alt="Close" width="16" />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="modal-body-text">
              <div className="form-group">
                <label>Contract / Agreement Number *</label>
                <input type="text" className="form-input" value={newContract.contractNumber} onChange={(e) => setNewContract({...newContract, contractNumber: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Select Client profile *</label>
                <CustomSelect
                  value={String(newContract.clientId || "custom")}
                  onChange={(val) => {
                    if (val === "custom") {
                      setNewContract({ ...newContract, clientId: "custom", clientName: "" });
                    } else {
                      const c = clients.find((cl) => String(cl.id) === val);
                      setNewContract({
                        ...newContract,
                        clientId: val,
                        clientName: c ? c.name || c.business : "",
                      });
                    }
                  }}
                  options={[
                    { value: "custom", label: "[ + Custom client representative name ]" },
                    ...clients.map((c) => ({
                      value: String(c.id),
                      label: c.name || c.business,
                    })),
                  ]}
                />
              </div>

              {newContract.clientId === "custom" && (
                <div className="form-group">
                  <label>Client Name *</label>
                  <input type="text" className="form-input" placeholder="e.g. Alice Miller (Miller Group)" value={newContract.clientName} onChange={(e) => setNewContract({...newContract, clientName: e.target.value})} />
                </div>
              )}

              <div className="form-row-grid">
                <div className="form-group">
                  <label>Agreement Type</label>
                  <CustomSelect
                    value={newContract.contractType || "Content Retainer"}
                    onChange={(val) => setNewContract({ ...newContract, contractType: val })}
                    options={[
                      { value: "Content Retainer", label: "Content Retainer" },
                      { value: "Production Retainer", label: "Production Retainer" },
                      { value: "Ad Campaign", label: "Ad Campaign" },
                      { value: "One-off Shoot", label: "One-off Shoot" },
                    ]}
                  />
                </div>
                <div className="form-group">
                  <label>Monthly Budget / Fee (₹)</label>
                  <input type="number" className="form-input" value={newContract.amount} onChange={(e) => setNewContract({...newContract, amount: Number(e.target.value)})} />
                </div>
              </div>

              <div className="form-row-grid">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" className="form-input" value={newContract.startDate} onChange={(e) => setNewContract({...newContract, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" className="form-input" value={newContract.endDate} onChange={(e) => setNewContract({...newContract, endDate: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label>Add Notes / Specific details</label>
                <textarea className="form-input" rows={2} value={newContract.notes} onChange={(e) => setNewContract({...newContract, notes: e.target.value})} style={{ resize: "none" }} />
              </div>
            </div>

            <div className="form-footer" style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="btn btn-ghost" onClick={() => setIsContractModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateContract}>Create Retainer Agreement</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
