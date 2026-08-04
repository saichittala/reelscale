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

  // UPI Url scheme builder
  const getUpiUrl = () => {
    const cleanAmount = amount.replace(/,/g, "");
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(recipient)}&cu=INR&am=${cleanAmount}`;
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
    const cleanAmount = amount.replace(/,/g, "");
    const upiUrl = getUpiUrl();
    setLoadingApp(app);

    // Deep link variables
    let deepLink = upiUrl;
    
    if (app === "PhonePe") {
      if (isIos) {
        deepLink = `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(recipient)}&cu=INR&am=${cleanAmount}`;
      } else {
        deepLink = `intent://pay?pa=${upiId}&pn=${encodeURIComponent(recipient)}&cu=INR&am=${cleanAmount}#Intent;scheme=phonepe;package=com.phonepe.app;end`;
      }
    } else if (app === "GPay") {
      if (isIos) {
        deepLink = `gpay://upi/pay?pa=${upiId}&pn=${encodeURIComponent(recipient)}&cu=INR&am=${cleanAmount}`;
      } else {
        deepLink = `intent://pay?pa=${upiId}&pn=${encodeURIComponent(recipient)}&cu=INR&am=${cleanAmount}#Intent;scheme=gpay;package=com.google.android.apps.nbu.paisa.user;end`;
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
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getUpiUrl())}&color=090909&bgcolor=ffffff&qzone=1`;
  };

  return (
    <main className="pay-page-wrapper">
      <div className="pay-container">
        
        {/* TOP: Logo & Verified badge */}
        <div className="pay-header animate-item animate-delay-0" role="banner">
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
        <section className="pay-title-section animate-item animate-delay-1">
          <h1 className="pay-title">Complete your payment</h1>
          <p className="pay-subtitle">Choose your preferred UPI app to continue securely.</p>
        </section>

        {/* PAYMENT CARD */}
        <article className="payment-card animate-item animate-delay-2">
          <div className="card-amount-label">Amount to Pay</div>
          <div className="card-amount">{formatCurrency(amount)}</div>
          
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
          </div>
        </article>

        {/* PAYMENT OPTIONS */}
        <section className="payment-options animate-item animate-delay-3">
          
          {/* PhonePe Button */}
          <button 
            className="payment-btn" 
            onClick={() => triggerPayment("PhonePe")}
            disabled={loadingApp !== null}
          >
            <div className="btn-left-content">
              <div className="upi-icon-container">
                {/* PhonePe Stylized SVG */}
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="8" fill="#5F259F"/>
                  <path d="M16 6C10.48 6 6 10.48 6 16C6 21.52 10.48 26 16 26C21.52 26 26 21.52 26 16C26 10.48 21.52 6 16 6ZM18.25 19.33H16V22.5H13.75V19.33H12V17.08H13.75V15.08H12V12.83H13.75V9.5H16V12.83H18.25C19.7 12.83 20.88 13.83 20.88 15.08C20.88 16.33 19.7 17.08 18.25 17.08H16V19.33H18.25C18.66 19.33 19 19.67 19 20.08C19 20.5 18.66 20.83 18.25 20.83H18.25V19.33ZM18.25 15.08C18.25 15.08 16 15.08 16 15.08V12.83H18.25C18.88 12.83 19.38 13.33 19.38 13.96C19.38 14.58 18.88 15.08 18.25 15.08Z" fill="white"/>
                </svg>
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
                {/* Google Pay Stylized Multi-Color G */}
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="8" fill="#FFFFFF"/>
                  <path d="M12.5 12.5C12.5 11.12 13.62 10 15 10H18C18.55 10 19 9.55 19 9C19 8.45 18.55 8 18 8H15C12.24 8 10 10.24 10 13V19C10 21.76 12.24 24 15 24H18C18.55 24 19 23.55 19 23C19 22.45 18.55 22 18 22H15C13.62 22 12.5 20.88 12.5 19.5V12.5Z" fill="#4285F4"/>
                  <path d="M19 13C19 12.45 18.55 12 18 12C17.45 12 17 12.45 17 13V19C17 19.55 17.45 20 18 20C18.55 20 19 19.55 19 19V13Z" fill="#34A853"/>
                  <path d="M22 12.5V19.5C22 20.88 20.88 22 19.5 22C19.5 22 19.5 22 19.5 22C18.95 22 18.5 22.45 18.5 23C18.5 23.55 18.95 24 19.5 24C21.98 24 24 21.98 24 19.5V12.5C24 10.02 21.98 8 19.5 8C18.95 8 18.5 8.45 18.5 9C18.5 9.55 18.95 10 19.5 10C20.88 10 22 11.12 22 12.5Z" fill="#FBBC05"/>
                  <path d="M14.5 17C14.5 17.55 14.95 18 15.5 18C16.05 18 16.5 17.55 16.5 17V15C16.5 14.45 16.05 14 15.5 14C14.95 14 14.5 14.45 14.5 15V17Z" fill="#EA4335"/>
                </svg>
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
          className={`qr-accordion animate-item animate-delay-4 ${isQrOpen ? "open" : ""}`}
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
        <footer className="pay-trust-footer animate-item animate-delay-5">
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
