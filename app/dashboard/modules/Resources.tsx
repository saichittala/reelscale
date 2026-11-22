import { useState, useEffect, useRef } from "react";
import { Client, BusinessDocument, DocumentLineItem } from "../types";
import { toDateStr, formatDisplayDate } from "../utils/format";
import { CustomSelect } from "../components/CustomSelect";
import { Button, Tabs, TabsList, TabsTrigger, DatePicker } from "@/components/ui";
import {
  Receipt,
  FileText,
  Mail,
  Printer,
  Copy,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";

interface ResourcesProps {
  clients: Client[];
  showToast: (msg: string, type?: "success" | "error" | "loading") => void;
  setConfirmModal?: (modal: {
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null) => void;
  onHeaderChange?: (left: React.ReactNode, right: React.ReactNode) => void;
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

function formatRupees(num: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

// Builds formatted file/document slug: invoiceno_clientname_date
function getDocumentSlug(doc: BusinessDocument): string {
  const invoiceNo = (doc.number || (doc.type === "Invoice" ? "RS-INV" : "RS-Q")).trim().replace(/[/\\?%*:|"<> ]/g, "-");
  const rawClient = (doc.clientName || doc.companyName || "Client").trim();
  const clientName = rawClient ? rawClient.replace(/\s+/g, "_").replace(/[/\\?%*:|"<>]/g, "") : "Client";
  const date = (doc.issueDate || toDateStr(new Date())).trim().replace(/\//g, "-");
  return `${invoiceNo}_${clientName}_${date}`;
}

// Generate an in-memory document template (never saved to DB)
function createFreshDocument(type: "Invoice" | "Quotation"): BusinessDocument {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const prefix = type === "Invoice" ? "RS-INV" : "RS-Q";

  return {
    id: "temp-" + Math.random().toString(36).substring(2, 9),
    number: `${prefix}-${year}-${randomSuffix}`,
    type,
    status: "Generated",
    clientId: "custom",
    clientName: "",
    companyName: "",
    clientEmail: "",
    clientPhone: "",
    billingAddress: "",
    projectName: "Monthly Content Partnership",
    service: "Monthly Content Partnership",
    issueDate: toDateStr(new Date()),
    dueDate: "",
    validityDate: toDateStr(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    lineItems: [
      {
        id: "item-" + Math.random().toString(36).substring(2, 5),
        description: "12 Premium Reels (Hook testing, Scripting, Editing & Color Grading)",
        quantity: 1,
        unit: "Package",
        rate: 22000,
        amount: 22000,
      },
    ],
    subtotal: 22000,
    discount: 0,
    tax: 0,
    expenses: 0,
    total: 22000,
    paymentDetails: DEFAULT_PAYMENT_DETAILS,
    terms: "100% upfront payment is due instantly to secure booking.",
    notes: "Thank you for collaborating with ReelScale! We create reels that retain, convert and scale.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function Resources({
  clients,
  showToast,
  setConfirmModal,
  onHeaderChange,
}: ResourcesProps) {
  const [mounted, setMounted] = useState(false);
  // Ephemeral in-memory state — zero database persistence
  const [activeDoc, setActiveDoc] = useState<BusinessDocument>(() => createFreshDocument("Invoice"));
  const [selectedClientId, setSelectedClientId] = useState<string>("custom");
  const [showNewClientForm, setShowNewClientForm] = useState<boolean>(true);
  const [showPaymentTerms, setShowPaymentTerms] = useState<boolean>(false);

  // Clean legacy traces and query parameters on mount
  useEffect(() => {
    setMounted(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("reelscale_documents");
        localStorage.removeItem("reelscale_contracts");
        const url = new URL(window.location.href);
        if (url.searchParams.has("sub")) {
          url.searchParams.delete("sub");
          window.history.replaceState(null, "", url.toString());
        }
      }
    } catch { }
  }, []);

  // Totals auto calculator helper
  const calculateTotals = (items: DocumentLineItem[], discPercent: number, taxPercent: number, extraExp: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const discountAmount = (subtotal * discPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxPercent) / 100;
    const total = taxableAmount + taxAmount + extraExp;
    return { subtotal, total };
  };

  const handleUpdateField = (key: keyof BusinessDocument, value: any) => {
    setActiveDoc((prev) => {
      const updated = { ...prev, [key]: value } as BusinessDocument;

      if (key === "lineItems" || key === "discount" || key === "tax" || key === "expenses") {
        const lineItems = key === "lineItems" ? (value as DocumentLineItem[]) : prev.lineItems;
        const discount = key === "discount" ? Number(value) : prev.discount;
        const tax = key === "tax" ? Number(value) : prev.tax;
        const expenses = key === "expenses" ? Number(value) : prev.expenses;

        const { subtotal, total } = calculateTotals(lineItems, discount, tax, expenses);
        updated.subtotal = subtotal;
        updated.total = total;
      }

      return updated;
    });
  };

  // Switch between Invoice and Quotation
  const handleSwitchType = (type: "Invoice" | "Quotation") => {
    setActiveDoc((prev) => {
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const prefix = type === "Invoice" ? "RS-INV" : "RS-Q";

      return {
        ...prev,
        type,
        number: `${prefix}-${year}-${randomSuffix}`,
        terms:
          type === "Quotation"
            ? "Quotation validity: 30 days. Delivery within 10 working days from production date."
            : DEFAULT_PAYMENT_DETAILS.terms,
      };
    });
  };

  // Client autocompletion selector
  const handleSelectClient = (cId: string) => {
    setSelectedClientId(cId);
    if (cId === "custom") {
      setShowNewClientForm(true);
      setActiveDoc((prev) => ({
        ...prev,
        clientId: "custom",
        clientName: "",
        companyName: "",
        clientEmail: "",
        clientPhone: "",
        billingAddress: "",
        gstin: "",
        projectName: `Custom Client - ${prev.issueDate}`,
      }));
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
          const updated = {
            ...prev,
            clientId: cId,
            clientName,
            companyName,
            clientEmail,
            clientPhone,
            billingAddress,
            gstin: "",
            projectName: `${clientName} - ${prev.issueDate}`,
          };

          const reelsCount = existingClient.reels || 12;
          const packagePrice =
            existingClient.revenue ||
            (existingClient.ppr && existingClient.reels
              ? existingClient.ppr * existingClient.reels
              : 22000);

          const prepopulatedItems = [
            {
              id: "item-init",
              description: `${reelsCount} Premium Content Partnership Reels`,
              quantity: 1,
              unit: "Package",
              rate: packagePrice,
              amount: packagePrice,
            },
          ];
          const { subtotal, total } = calculateTotals(prepopulatedItems, prev.discount, 0, prev.expenses);
          updated.tax = 0;
          updated.lineItems = prepopulatedItems;
          updated.subtotal = subtotal;
          updated.total = total;
          return updated;
        });
      }
    }
  };

  // Line item manipulation
  const handleAddLineItem = () => {
    const newItem: DocumentLineItem = {
      id: "item-" + Math.random().toString(36).substring(2, 5),
      description: "Additional Deliverables / Video Production",
      quantity: 1,
      unit: "Package",
      rate: 10000,
      amount: 10000,
    };
    handleUpdateField("lineItems", [...activeDoc.lineItems, newItem]);
  };

  const handleUpdateLineItem = (itemId: string, field: keyof DocumentLineItem, value: any) => {
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

  const handleDuplicateLineItem = (itemId: string) => {
    const itemToClone = activeDoc.lineItems.find((i) => i.id === itemId);
    if (!itemToClone) return;
    const newItem: DocumentLineItem = {
      ...itemToClone,
      id: "item-" + Math.random().toString(36).substring(2, 5),
    };
    handleUpdateField("lineItems", [...activeDoc.lineItems, newItem]);
    showToast("Line item duplicated", "success");
  };

  const handleDeleteLineItem = (itemId: string) => {
    if (activeDoc.lineItems.length <= 1) {
      showToast("Document must contain at least one line item", "error");
      return;
    }
    handleUpdateField("lineItems", activeDoc.lineItems.filter((i) => i.id !== itemId));
  };

  const handleResetDocument = () => {
    setActiveDoc(createFreshDocument(activeDoc.type));
    setSelectedClientId("custom");
    setShowNewClientForm(true);
    setShowPaymentTerms(false);
    showToast(`New ${activeDoc.type} draft ready`, "success");
  };

  const handleResetPaymentTerms = () => {
    setActiveDoc((prev) => ({
      ...prev,
      paymentDetails: DEFAULT_PAYMENT_DETAILS,
      terms:
        prev.type === "Quotation"
          ? "Quotation validity: 30 days. Delivery within 10 working days from production date."
          : DEFAULT_PAYMENT_DETAILS.terms,
      notes: "Thank you for collaborating with ReelScale! We create reels that retain, convert and scale.",
    }));
    showToast("Reset to ReelScale defaults", "success");
  };

  // Native print execution for clean A4 output
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      const originalTitle = document.title;
      // Format: invoiceno_clientname_date (controls the saved PDF file name)
      document.title = getDocumentSlug(activeDoc);
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.title = originalTitle;
        }, 1500);
      }, 100);
    }
  };

  // Text builder for direct WhatsApp & Email actions
  const buildDocumentShareText = (): string => {
    const isInvoice = activeDoc.type === "Invoice";
    const headerTitle = isInvoice ? "🧾 INVOICE FROM REELSCALE" : "📄 QUOTATION FROM REELSCALE";
    const clientDesc = activeDoc.clientName
      ? `${activeDoc.clientName}${activeDoc.companyName ? ` (${activeDoc.companyName})` : ""}`
      : "Client Partner";

    const lines = activeDoc.lineItems
      .map((item, idx) => {
        const qtyPrefix = item.quantity > 1 ? `${item.quantity} ${item.unit} @ ₹${item.rate.toLocaleString()} = ` : "";
        return `${idx + 1}. ${item.description}: ${qtyPrefix}₹${(item.quantity * item.rate).toLocaleString()}`;
      })
      .join("\n");

    const adjustments = [];
    if (activeDoc.discount > 0) {
      adjustments.push(`Discount (${activeDoc.discount}%): -₹${((activeDoc.subtotal * activeDoc.discount) / 100).toLocaleString()}`);
    }
    if (activeDoc.tax > 0) {
      adjustments.push(
        `GST (${activeDoc.tax}%): +₹${(((activeDoc.subtotal - (activeDoc.subtotal * activeDoc.discount) / 100) * activeDoc.tax) / 100).toLocaleString()}`
      );
    }
    if (activeDoc.expenses > 0) {
      adjustments.push(`Additional Expenses: +₹${activeDoc.expenses.toLocaleString()}`);
    }

    const adjustmentsText = adjustments.length > 0 ? `\n${adjustments.join("\n")}` : "";

    const paymentSection = isInvoice
      ? `\n💳 *Payment Details:*
• Account Name: ${activeDoc.paymentDetails.accountName}
• Bank: ${activeDoc.paymentDetails.bank}
• Account No: ${activeDoc.paymentDetails.accountNumber}
• IFSC Code: ${activeDoc.paymentDetails.ifsc}
• UPI ID: ${activeDoc.paymentDetails.upiId}
• Terms: ${activeDoc.paymentDetails.terms}`
      : `\n📋 *Quotation Terms:*
${activeDoc.terms}`;

    const validityLine = activeDoc.type === "Quotation" && activeDoc.validityDate ? `\n*Valid Until:* ${formatDisplayDate(activeDoc.validityDate)}` : "";

    return `${headerTitle}
━━━━━━━━━━━━━━━━━━━━
*Document No:* ${activeDoc.number}
*Client:* ${clientDesc}
*Project:* ${activeDoc.projectName || "Video Production & Content"}
*Date:* ${formatDisplayDate(activeDoc.issueDate)}${validityLine}

*Line Items:*
${lines}
${adjustmentsText}
*Subtotal:* ₹${activeDoc.subtotal.toLocaleString()}
*Grand Total:* ${formatRupees(activeDoc.total)}
${paymentSection}
${activeDoc.notes ? `\n*Note:* ${activeDoc.notes}` : ""}

Thank you for choosing ReelScale!
https://reelscale.in`;
  };

  // Direct 1-Click Email
  const handleSendEmail = () => {
    const targetEmail = (activeDoc.clientEmail || "").trim();
    const docSlug = getDocumentSlug(activeDoc);
    const subject = encodeURIComponent(`${activeDoc.type}: ${docSlug}`);
    const body = encodeURIComponent(buildDocumentShareText());
    const mailtoUrl = targetEmail
      ? `mailto:${targetEmail}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;

    if (typeof window !== "undefined") {
      window.open(mailtoUrl, "_blank");
      showToast("Opening Email...", "success");
    }
  };

  const leftHeaderContent = (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", minWidth: 0 }}>
      <Tabs
        value={activeDoc.type}
        onValueChange={(val) => handleSwitchType(val as "Invoice" | "Quotation")}
        className="resources-topbar-tabs"
      >
        <TabsList
          shellStyle={{
            minHeight: "38px",
            height: "38px",
            maxHeight: "38px",
            boxSizing: "border-box",
            padding: "2px",
          }}
          style={{ height: "100%", alignItems: "center" }}
        >
          <TabsTrigger
            value="Invoice"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              minHeight: "32px",
              height: "32px",
              padding: "0 14px",
            }}
          >
            <Receipt size={15} />
            <span>Invoice</span>
          </TabsTrigger>
          <TabsTrigger
            value="Quotation"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              minHeight: "32px",
              height: "32px",
              padding: "0 14px",
            }}
          >
            <FileText size={15} />
            <span>Quotation</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap", minWidth: 0 }}>
        <span
          style={{
            fontSize: "13px",
            color: "var(--muted)",
            fontWeight: 500,
            maxWidth: "240px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={getDocumentSlug(activeDoc)}
        >
          {getDocumentSlug(activeDoc)}
        </span>
        <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--green)" }}>
          {formatRupees(activeDoc.total)}
        </span>
      </div>
    </div>
  );

  const rightHeaderContent = (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <Button
        variant="secondary"
        onClick={handleSendEmail}
        title={activeDoc.clientEmail ? `Send email to ${activeDoc.clientEmail}` : "Send via Email"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          minHeight: "38px",
          height: "38px",
          background: "transparent",
          border: "1px solid var(--border)",
        }}
      >
        <Mail size={16} />
        <span>Email</span>
      </Button>

      <Button
        variant="primary"
        onClick={handlePrint}
        title="Print or Save PDF"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          minHeight: "38px",
          height: "38px",
        }}
      >
        <Printer size={16} />
        <span>Print PDF</span>
      </Button>
    </div>
  );

  // Keep topbar header synced via props callback safely with ref
  const onHeaderChangeRef = useRef(onHeaderChange);
  useEffect(() => {
    onHeaderChangeRef.current = onHeaderChange;
  });

  useEffect(() => {
    onHeaderChangeRef.current?.(leftHeaderContent, rightHeaderContent);
  }, [
    activeDoc.type,
    activeDoc.total,
    activeDoc.number,
    activeDoc.clientName,
    activeDoc.companyName,
    activeDoc.clientEmail,
    activeDoc.issueDate,
  ]);

  useEffect(() => {
    return () => {
      onHeaderChangeRef.current?.(null, null);
    };
  }, []);

  return (
    <>
      {/* Fallback in-page header if onHeaderChange not provided */}
      {!onHeaderChange && (
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          {leftHeaderContent}
          {rightHeaderContent}
        </div>
      )}

      {/* Dual Panel Workspace Layout */}
      <div className="document-workspace">
        {/* Left Panel: Streamlined Form Inputs in Cards */}
        <div className="details-panel">
          {/* Card 1: Client & Recipient */}
          <div className="glass-card">
            <div
              className="glass-card-label"
              style={{
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                fontSize: "12px",
                marginBottom: "14px",
                color: "var(--muted)",
              }}
            >
              Client Recipient
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="form-group">
                <label>Select Existing Client or Custom</label>
                <CustomSelect
                  value={selectedClientId}
                  onChange={handleSelectClient}
                  fullWidth
                  size="md"
                  options={[
                    { value: "custom", label: "[ + Custom Client Details ]" },
                    ...clients.map((c) => ({
                      value: String(c.id),
                      label: `${c.name || c.business} (${c.business || "No Company"})`,
                    })),
                  ]}
                />
              </div>

              {showNewClientForm && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className="form-group">
                    <label>Client Contact Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Alice Miller"
                      value={activeDoc.clientName}
                      onChange={(e) => handleUpdateField("clientName", e.target.value)}
                    />
                  </div>
                  <div className="form-row-grid">
                    <div className="form-group">
                      <label>Company / Brand Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Miller Group"
                        value={activeDoc.companyName}
                        onChange={(e) => handleUpdateField("companyName", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>GSTIN (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 36AAAAA1111A1Z1"
                        value={activeDoc.gstin || ""}
                        onChange={(e) => handleUpdateField("gstin", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-row-grid">
                    <div className="form-group">
                      <label>WhatsApp / Phone</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="+91 99662 39433"
                        value={activeDoc.clientPhone}
                        onChange={(e) => handleUpdateField("clientPhone", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Billing Email</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="billing@miller.com"
                        value={activeDoc.clientEmail}
                        onChange={(e) => handleUpdateField("clientEmail", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Billing Address</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Physical address or city"
                      value={activeDoc.billingAddress}
                      onChange={(e) => handleUpdateField("billingAddress", e.target.value)}
                      style={{ resize: "none" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Project & Timeline */}
          <div className="glass-card">
            <div
              className="glass-card-label"
              style={{
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                fontSize: "12px",
                marginBottom: "14px",
                color: "var(--muted)",
              }}
            >
              Project & Schedule
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="form-group">
                <label>Project Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Monthly Content Partnership Reels"
                  value={activeDoc.projectName}
                  onChange={(e) => handleUpdateField("projectName", e.target.value)}
                />
              </div>

              <div className="form-row-grid">
                <div className="form-group">
                  <label>Service Category</label>
                  <CustomSelect
                    value={activeDoc.service}
                    onChange={(val) => handleUpdateField("service", val)}
                    fullWidth
                    size="md"
                    options={[
                      { value: "Monthly Content Partnership", label: "Monthly Content Partnership" },
                      { value: "Premium Reels", label: "Premium Reels" },
                      { value: "Brand Shoot", label: "Brand Shoot" },
                      { value: "Social Media Content", label: "Social Media Content" },
                      { value: "Video Production", label: "Video Production" },
                    ]}
                  />
                </div>
                <div className="form-group">
                  <label>Issue Date</label>
                  <DatePicker
                    value={activeDoc.issueDate}
                    onChange={(e: any) => handleUpdateField("issueDate", e.target?.value || e)}
                  />
                </div>
              </div>

              <div className="form-row-grid">
                {activeDoc.type === "Quotation" ? (
                  <div className="form-group">
                    <label>Validity Date (Quotation)</label>
                    <DatePicker
                      value={activeDoc.validityDate}
                      onChange={(e: any) => handleUpdateField("validityDate", e.target?.value || e)}
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Doc Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={activeDoc.number}
                      onChange={(e) => handleUpdateField("number", e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Line Items & Pricing */}
          <div className="glass-card">
            <div
              className="glass-card-label"
              style={{
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                fontSize: "12px",
                marginBottom: "14px",
                color: "var(--muted)",
              }}
            >
              Line Items & Deliverables
            </div>
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
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateLineItem(item.id, "description", e.target.value)}
                          placeholder="e.g. 12 Reels Package"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateLineItem(item.id, "quantity", e.target.value)}
                          style={{ textAlign: "center" }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleUpdateLineItem(item.id, "unit", e.target.value)}
                          placeholder="Package"
                          style={{ textAlign: "center" }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) => handleUpdateLineItem(item.id, "rate", e.target.value)}
                          style={{ textAlign: "right" }}
                        />
                      </td>
                      <td style={{ textAlign: "right", fontSize: "14px", fontWeight: "600", paddingRight: "8px" }}>
                        ₹{(item.quantity * item.rate).toLocaleString()}
                      </td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="btn-icon-danger"
                          title="Duplicate item"
                          onClick={() => handleDuplicateLineItem(item.id)}
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-danger"
                          title="Delete item"
                          onClick={() => handleDeleteLineItem(item.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="btn-add-item"
              onClick={handleAddLineItem}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <Plus size={14} />
              <span>Add Line Item</span>
            </button>

            {/* Adjustments: Discount, Tax, Expenses */}
            <div className="totals-summary-block" style={{ marginTop: "16px" }}>
              <div className="totals-row-item">
                <span>Subtotal:</span>
                <span style={{ fontWeight: 600, color: "var(--white)" }}>₹{activeDoc.subtotal.toLocaleString()}</span>
              </div>
              <div className="totals-row-item">
                <span>Discount (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={activeDoc.discount}
                  onChange={(e) => handleUpdateField("discount", Number(e.target.value))}
                />
              </div>
              <div className="totals-row-item">
                <span>GST Tax (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={activeDoc.tax}
                  onChange={(e) => handleUpdateField("tax", Number(e.target.value))}
                />
              </div>
              <div className="totals-row-item">
                <span>Travel / Expenses (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={activeDoc.expenses}
                  onChange={(e) => handleUpdateField("expenses", Number(e.target.value))}
                />
              </div>
              <div className="totals-row-item grand-total">
                <span>Grand Total:</span>
                <span>{formatRupees(activeDoc.total)}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Payment Details & Terms */}
          <div className="glass-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: showPaymentTerms ? "14px" : "0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  className="glass-card-label"
                  style={{
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontSize: "12px",
                    margin: 0,
                    color: "var(--muted)",
                  }}
                >
                  Payment Details & Terms
                </div>
                {!showPaymentTerms && (
                  <span className="badge badge-default" style={{ fontSize: "10.5px" }}>
                    ReelScale Defaults
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {!showPaymentTerms ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowPaymentTerms(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      height: "30px",
                      border: "1px solid var(--border)",
                    }}
                    title="Click to edit payment details or terms"
                  >
                    <SlidersHorizontal size={13} />
                    <span>Edit</span>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetPaymentTerms}
                      title="Reset to ReelScale defaults"
                      style={{
                        fontSize: "11px",
                        padding: "4px 8px",
                        height: "28px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <RotateCcw size={12} />
                      <span>Reset</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowPaymentTerms(false)}
                      style={{
                        fontSize: "12px",
                        padding: "4px 10px",
                        height: "28px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <ChevronUp size={13} />
                      <span>Done</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {!showPaymentTerms ? (
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4, marginTop: "8px" }}>
                {activeDoc.type === "Invoice" ? (
                  <>
                    {activeDoc.paymentDetails.bank} ({activeDoc.paymentDetails.accountNumber}) · UPI:{" "}
                    {activeDoc.paymentDetails.upiId} · {activeDoc.paymentDetails.terms}
                  </>
                ) : (
                  <>{activeDoc.terms || "Standard 30-day quotation validity"}</>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                {activeDoc.type === "Invoice" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div className="form-group">
                      <label>Account Beneficiary Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={activeDoc.paymentDetails.accountName}
                        onChange={(e) => {
                          const pay = { ...activeDoc.paymentDetails, accountName: e.target.value };
                          handleUpdateField("paymentDetails", pay);
                        }}
                      />
                    </div>
                    <div className="form-row-grid">
                      <div className="form-group">
                        <label>Bank Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={activeDoc.paymentDetails.bank}
                          onChange={(e) => {
                            const pay = { ...activeDoc.paymentDetails, bank: e.target.value };
                            handleUpdateField("paymentDetails", pay);
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Account Number</label>
                        <input
                          type="text"
                          className="form-input"
                          value={activeDoc.paymentDetails.accountNumber}
                          onChange={(e) => {
                            const pay = { ...activeDoc.paymentDetails, accountNumber: e.target.value };
                            handleUpdateField("paymentDetails", pay);
                          }}
                        />
                      </div>
                    </div>
                    <div className="form-row-grid">
                      <div className="form-group">
                        <label>IFSC Code</label>
                        <input
                          type="text"
                          className="form-input"
                          value={activeDoc.paymentDetails.ifsc}
                          onChange={(e) => {
                            const pay = { ...activeDoc.paymentDetails, ifsc: e.target.value };
                            handleUpdateField("paymentDetails", pay);
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>UPI ID</label>
                        <input
                          type="text"
                          className="form-input"
                          value={activeDoc.paymentDetails.upiId}
                          onChange={(e) => {
                            const pay = { ...activeDoc.paymentDetails, upiId: e.target.value };
                            handleUpdateField("paymentDetails", pay);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Terms & Conditions</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={activeDoc.terms}
                    onChange={(e) => handleUpdateField("terms", e.target.value)}
                    style={{ resize: "none" }}
                  />
                </div>
                <div className="form-group">
                  <label>Footer Personal Note</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={activeDoc.notes}
                    onChange={(e) => handleUpdateField("notes", e.target.value)}
                    style={{ resize: "none" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Live A4 Printable Preview */}
        <div className="preview-panel">
          <div className="a4-document-container">
            <div className="a4-document">
              <div>
                {/* Header: Logo & Title */}
                <div className="a4-header">
                  <div className="a4-logo">
                    <img src="/assets/r_light.svg" alt="ReelScale Logo" style={{ height: "24px" }} />
                  </div>
                  <div
                    className="a4-document-title"
                    style={{
                      fontFamily: "'Instrument Serif', Georgia, serif",
                      fontSize: "44px",
                      fontWeight: 400,
                    }}
                  >
                    {activeDoc.type}
                  </div>
                </div>

                {/* Metadata: Doc details and Client */}
                <div className="a4-meta-grid">
                  <div>
                    <div className="a4-meta-col-title">Prepared For</div>
                    <div className="a4-meta-text" style={{ fontWeight: 600 }}>
                      {activeDoc.clientName || "Client Partner"}
                    </div>
                    {activeDoc.companyName && <div className="a4-meta-text">{activeDoc.companyName}</div>}
                    {activeDoc.clientEmail && <div className="a4-meta-text" style={{ fontSize: "12.5px", color: "#52525b" }}>{activeDoc.clientEmail}</div>}
                    {activeDoc.clientPhone && <div className="a4-meta-text" style={{ fontSize: "12.5px", color: "#52525b" }}>{activeDoc.clientPhone}</div>}
                    {activeDoc.billingAddress && (
                      <div className="a4-meta-text" style={{ marginTop: "6px", fontSize: "12px", color: "#71717a", whiteSpace: "pre-line" }}>
                        {activeDoc.billingAddress}
                      </div>
                    )}
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
                    {activeDoc.type === "Quotation" && activeDoc.validityDate && (
                      <div className="a4-meta-label-value">
                        <span>Valid Until:</span>
                        <span>{formatDisplayDate(activeDoc.validityDate)}</span>
                      </div>
                    )}
                    <div className="a4-meta-label-value" style={{ borderTop: "1px solid #e4e4e7", paddingTop: "6px", marginTop: "6px" }}>
                      <span>Project:</span>
                      <span style={{ maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={activeDoc.projectName}>
                        {activeDoc.projectName || (activeDoc.clientName ? `${activeDoc.clientName} - ${activeDoc.issueDate}` : "Partnership")}
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
                {activeDoc.type === "Invoice" && (
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
                )}

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
    </>
  );
}