"use client";

import { useEffect, useState, Suspense } from "react";
import "../../styles.css";
import "./pay.css";

function PaymentContent() {
  // Query parameters state with defaults
  const [amount, setAmount] = useState("2500");
  const [service, setService] = useState("Reel Production");
  const [recipient, setRecipient] = useState("Sai Chittala");
  const [upiId, setUpiId] = useState("saichittala7@ybl");

  // Interactive states
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [loadingApp, setLoadingApp] = useState<string | null>(null);
  const [showIosBottomSheet, setShowIosBottomSheet] = useState(false);
  const [isIos, setIsIos] = useState(false);

  // Parse query parameters entirely client-side to prevent Next.js SSR mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const amountParam = params.get("amount");
      const serviceParam = params.get("service");
      const recipientParam = params.get("recipient");
      const upiParam = params.get("upi");

      if (amountParam) setAmount(amountParam);
      if (serviceParam) setService(serviceParam);
      if (recipientParam) setRecipient(recipientParam);
      if (upiParam) setUpiId(upiParam);

      // Detect iOS / iPhone
      const userAgent = window.navigator.userAgent || window.navigator.vendor;
      if (/iPhone|iPad|iPod/i.test(userAgent)) {
        setIsIos(true);
      }
    }
  }, []);

  // Format currency value safely (e.g. 2500 -> ₹2,500)
  const formatCurrency = (val: string) => {
    const num = parseFloat(val.replace(/,/g, ""));
    if (isNaN(num)) return `₹${val}`;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only digits and decimal point
    const sanitized = val.replace(/[^0-9.]/g, "");
    setAmount(sanitized);

    // Update URL dynamically
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (sanitized) {
        params.set("amount", sanitized);
      } else {
        params.delete("amount");
      }
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  // Helper to extract clean numeric digits for UPI deep link amount parameter
  const getNumericAmount = (val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, "");
    return cleaned || "0";
  };

  // UPI Url scheme builder
  const getUpiUrl = () => {
    const numericAmount = getNumericAmount(amount);
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(recipient)}&cu=INR&am=${numericAmount}`;
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, setCopied: (c: boolean) => void) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Fallback copy failed", err);
      }
      document.body.removeChild(textArea);
    }
  };

  // Launch payment with device and platform redirections
  const triggerPayment = (app: string) => {
    const numericAmount = getNumericAmount(amount);
    const upiUrl = getUpiUrl();
    setLoadingApp(app);

    // Deep link variables
    let deepLink = upiUrl;
    
    if (app === "PhonePe") {
      if (isIos) {
        deepLink = `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(recipient)}&cu=INR&am=${numericAmount}`;
      } else {
        deepLink = `intent://pay?pa=${upiId}&pn=${encodeURIComponent(recipient)}&cu=INR&am=${numericAmount}#Intent;scheme=phonepe;package=com.phonepe.app;end`;
      }
    } else if (app === "GPay") {
      if (isIos) {
        deepLink = `gpay://upi/pay?pa=${upiId}&pn=${encodeURIComponent(recipient)}&cu=INR&am=${numericAmount}`;
      } else {
        deepLink = `intent://pay?pa=${upiId}&pn=${encodeURIComponent(recipient)}&cu=INR&am=${numericAmount}#Intent;scheme=gpay;package=com.google.android.apps.nbu.paisa.user;end`;
      }
    }

    // Set a timer to check if focus left the browser
    const start = Date.now();
    
    // Attempt redirect
    window.location.href = deepLink;

    setTimeout(() => {
      // If user is still in the browser after 2 seconds (redirect might have failed or been blocked)
      if (Date.now() - start < 2200) {
        setLoadingApp(null);
        if (isIos) {
          setShowIosBottomSheet(true);
        } else {
          // On non-iOS, automatically expand QR code fallback
          setIsQrOpen(true);
          // Scroll to QR code
          const element = document.getElementById("qr-section");
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    }, 2000);
  };

  // QR Code URL builder using API
  const getQrCodeUrl = () => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getUpiUrl())}&color=000000&bgcolor=ffffff&qzone=1`;
  };

  return (
    <main className="pay-page-wrapper">
      <div className="pay-container">
        
        {/* TOP: Logo & Verified badge */}
        <div className="pay-header" role="banner">
          <img 
            src="/assets/logo.svg" 
            alt="ReelScale Logo" 
            className="payment-logo" 
            width={120} 
            height={20} 
          />
          <div className="verified-badge">
            <span className="verified-dot" />
            Verified Merchant
          </div>
        </div>

        {/* TITLE SECTION */}
        <section className="pay-title-section">
          <h1 className="pay-title">Complete your payment</h1>
          <p className="pay-subtitle">Choose your preferred UPI app to continue securely.</p>
        </section>

        {/* PAYMENT CARD */}
        <article className="payment-card">
          <div className="card-amount-label">Amount to Pay (Tap to edit)</div>
          <div className="card-amount-input-wrapper">
            <span className="card-amount-symbol">₹</span>
            <input 
              type="text" 
              className="card-amount-input" 
              value={amount} 
              onChange={handleAmountChange} 
              placeholder="0"
              aria-label="Payment Amount"
            />
          </div>
          
          <div className="card-details-grid">
            <div className="card-detail-item">
              <span className="card-detail-label">Service</span>
              <span className="card-detail-value">{service}</span>
            </div>
            <div className="card-detail-item">
              <span className="card-detail-label">Recipient</span>
              <span className="card-detail-value">{recipient}</span>
            </div>
            
            <div className="card-upi-item">
              <div className="upi-text-wrap">
                <span className="card-detail-label">UPI ID</span>
                <span className="upi-id-value">{upiId}</span>
              </div>
              <button 
                className="copy-btn" 
                onClick={() => copyToClipboard(upiId, setCopiedUpi)}
                title="Copy UPI ID"
                aria-label="Copy UPI ID"
              >
                {copiedUpi ? (
                  <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>

            <div className="card-detail-item" style={{ gridColumn: "span 2" }}>
              <button 
                className="share-link-btn" 
                onClick={() => {
                  if (typeof window !== "undefined") {
                    copyToClipboard(window.location.href, setCopiedLink);
                  }
                }}
              >
                {copiedLink ? (
                  <>
                    <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "14px", height: "14px" }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Payment link copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "14px", height: "14px" }}>
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    <span>Copy Payment Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </article>

        {/* PAYMENT OPTIONS */}
        <section className="payment-options">
          
          {/* PhonePe Button */}
          <button 
            className="payment-btn" 
            onClick={() => triggerPayment("PhonePe")}
            disabled={loadingApp !== null}
          >
            <div className="btn-left-content">
              <div className="upi-icon-container">
                <img src="/assets/phonepe.svg" alt="PhonePe" />
              </div>
              <div className="payment-btn-text">
                <span className="payment-btn-title">PhonePe</span>
                <span className="payment-btn-subtitle">Pay using PhonePe app</span>
              </div>
            </div>
            <div className="btn-right-content">
              <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            {loadingApp === "PhonePe" && (
              <div className="btn-loading-overlay">
                <span className="loading-text">Opening PhonePe...</span>
                <div className="spinner" />
              </div>
            )}
          </button>

          {/* Google Pay Button */}
          <button 
            className="payment-btn" 
            onClick={() => triggerPayment("GPay")}
            disabled={loadingApp !== null}
          >
            <div className="btn-left-content">
              <div className="upi-icon-container">
                <img src="/assets/gpay.svg" alt="Google Pay" />
              </div>
              <div className="payment-btn-text">
                <span className="payment-btn-title">Google Pay</span>
                <span className="payment-btn-subtitle">Pay using Google Pay app</span>
              </div>
            </div>
            <div className="btn-right-content">
              <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            {loadingApp === "GPay" && (
              <div className="btn-loading-overlay">
                <span className="loading-text">Opening Google Pay...</span>
                <div className="spinner" />
              </div>
            )}
          </button>

          {/* Other UPI Apps Button */}
          <button 
            className="payment-btn" 
            onClick={() => triggerPayment("Other")}
            disabled={loadingApp !== null}
          >
            <div className="btn-left-content">
              <div className="upi-icon-container">
                {/* Custom generic UPI Logo */}
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="8" fill="var(--white-10)"/>
                  <path d="M7 10L14 13.5L21 10L14 6.5L7 10Z" fill="var(--white)"/>
                  <path d="M7 22L14 25.5L21 22V15L14 18.5L7 15V22Z" fill="var(--white)" fillOpacity="0.8"/>
                  <path d="M25 13L21 15L25 17L29 15L25 13Z" fill="var(--red)"/>
                </svg>
              </div>
              <div className="payment-btn-text">
                <span className="payment-btn-title">Other UPI Apps</span>
                <span className="payment-btn-subtitle">Pay with BHIM, Paytm, CRED etc.</span>
              </div>
            </div>
            <div className="btn-right-content">
              <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            {loadingApp === "Other" && (
              <div className="btn-loading-overlay">
                <span className="loading-text">Opening UPI Apps...</span>
                <div className="spinner" />
              </div>
            )}
          </button>

        </section>

        {/* DYNAMIC QR SECTION (ACCORDION) */}
        <section 
          id="qr-section"
          className={`qr-accordion ${isQrOpen ? "open" : ""}`}
        >
          <button 
            className="qr-header-btn" 
            onClick={() => setIsQrOpen(!isQrOpen)}
            aria-expanded={isQrOpen}
            aria-controls="qr-accordion-content"
          >
            <span>Can't open a payment app? Show QR Code</span>
            <svg className="qr-header-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          
          <div id="qr-accordion-content" className="qr-content">
            <div className="qr-inner">
              <div className="qr-image-wrapper">
                <img 
                  src={getQrCodeUrl()} 
                  alt="Payment QR Code" 
                  className="qr-image"
                  loading="lazy"
                />
              </div>
              <p className="qr-instructions">
                Scan this QR code using any UPI app (PhonePe, GPay, Paytm, BHIM) to complete your payment of {formatCurrency(amount)}.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM: Trust badges */}
        <footer className="pay-trust-footer">
          <div className="secure-label-wrap">
            <svg className="shield-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            100% Secure UPI Payment
          </div>
          
          <div className="trust-badge-row">
            <div className="trust-item">
              <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>No card details stored</span>
            </div>
            
            <div className="trust-item">
              <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
              <span>Protected by UPI app</span>
            </div>
          </div>
        </footer>

        {/* IOS BACKDROP BOTTOM SHEET */}
        <div 
          className={`bottom-sheet-backdrop ${showIosBottomSheet ? "open" : ""}`}
          onClick={() => setShowIosBottomSheet(false)}
        />
        <div className={`bottom-sheet ${showIosBottomSheet ? "open" : ""}`}>
          <div className="sheet-handle" />
          <h2 className="sheet-title">Launch Payment</h2>
          <p className="sheet-description">
            Tap Open below to continue with your installed UPI app.
          </p>
          <button 
            className="sheet-btn"
            onClick={() => {
              window.location.href = getUpiUrl();
              setShowIosBottomSheet(false);
            }}
          >
            Open UPI App
          </button>
        </div>

      </div>
    </main>
  );
}

// Suspense Boundary Wrapper for Next.js Client Route Compilation
export default function PayPage() {
  return (
    <Suspense fallback={
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        color: "var(--white)",
        fontFamily: "var(--font)"
      }}>
        <div className="spinner" style={{ width: "32px", height: "32px", borderWidth: "3px" }} />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
