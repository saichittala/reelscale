"use client";

import { useEffect, useState, Suspense } from "react";
import QRCode from "qrcode";
import "../../styles.css";
import "./pay.css";

function PaymentContent() {
  // Query parameters state with defaults
  const [amount, setAmount] = useState("2500");
  const [service, setService] = useState("Reel Production");
  const [recipient, setRecipient] = useState("Chittala Sai Durga Surya Prakash");
  const [upiId, setUpiId] = useState("saichittala7@ybl");

  // Device detection state: 'desktop' | 'android' | 'ios'
  const [deviceType, setDeviceType] = useState<"desktop" | "android" | "ios">("desktop");

  // Interactive states
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [loadingApp, setLoadingApp] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isFallbackOpen, setIsFallbackOpen] = useState(false);

  // Parse query parameters and classify device type client-side to prevent Next.js SSR mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const amountParam = params.get("amount");
      const serviceParam = params.get("service");
      const recipientParam = params.get("recipient");
      const upiParam = params.get("upi");

      // Sanitize amount to clean numeric decimal digits
      if (amountParam) {
        const cleaned = amountParam.replace(/[^0-9.]/g, "");
        if (cleaned) setAmount(cleaned);
      }
      if (serviceParam) setService(serviceParam);
      if (recipientParam) setRecipient(recipientParam);
      if (upiParam) setUpiId(upiParam);

      // Platform / Device detection logic
      const userAgent = window.navigator.userAgent || window.navigator.vendor;
      if (/iPhone|iPad|iPod/i.test(userAgent)) {
        setDeviceType("ios");
      } else if (/Android/i.test(userAgent)) {
        setDeviceType("android");
      } else {
        setDeviceType("desktop");
        setIsFallbackOpen(true); // Automatically show QR on desktop
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

  // Helper to extract clean numeric digits for UPI deep link amount parameter
  const getNumericAmount = (val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, "");
    return cleaned || "0";
  };

  // UPI Url scheme builder using standardized, official upi://pay URI
  const getUpiUrl = () => {
    const numericAmount = getNumericAmount(amount);
    // Ensure all parameters are correctly validated and URL encoded
    const encodedUpiId = encodeURIComponent(upiId.trim());
    const encodedRecipient = encodeURIComponent(recipient.trim());
    const encodedAmount = encodeURIComponent(numericAmount);
    return `upi://pay?pa=${encodedUpiId}&pn=${encodedRecipient}&cu=INR&am=${encodedAmount}`;
  };

  // Generate QR code locally on parameter change
  useEffect(() => {
    const upiUrl = getUpiUrl();
    QRCode.toDataURL(upiUrl, {
      margin: 1,
      width: 250,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error("QR Code generation error", err);
      });
  }, [amount, service, recipient, upiId]);

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

  // Trigger standardized upi://pay deep link redirect on mobile, with timeout fallback
  const triggerUpiPayment = (appName: string) => {
    // Copy UPI ID to clipboard silently in the background as a fallback measure
    copyToClipboard(upiId, () => {});

    const upiUrl = getUpiUrl();
    setLoadingApp(appName);

    const start = Date.now();

    // Trigger redirect using official standard UPI URI
    window.location.href = upiUrl;

    // Timeout fallback handler
    setTimeout(() => {
      // If the browser tab remains active after 2 seconds, the redirect failed or was blocked.
      if (Date.now() - start < 2200) {
        setLoadingApp(null);
        setIsFallbackOpen(true);

        // Smooth scroll to the fallback QR code instructions
        const element = document.getElementById("qr-fallback-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }, 2000);
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
          <p className="pay-subtitle">
            {deviceType === "desktop"
              ? "Scan the QR code or copy the details to make your payment securely."
              : "Choose your preferred UPI app to continue securely."}
          </p>
        </section>

        {/* PAYMENT CARD */}
        <article className="payment-card">
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
          </div>
        </article>

        {/* PAYMENT OPTIONS (Mobile Only) */}
        {deviceType !== "desktop" && (
          <section className="payment-options">
            <h2 className="section-title">Pay Directly</h2>

            {/* PhonePe Button */}
            <button
              className="payment-btn"
              onClick={() => triggerUpiPayment("PhonePe")}
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
            </button>

            {/* Google Pay Button */}
            <button
              className="payment-btn"
              onClick={() => triggerUpiPayment("Google Pay")}
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
            </button>

            {/* General UPI Apps Button */}
            <button
              className="payment-btn"
              onClick={() => triggerUpiPayment("UPI")}
              disabled={loadingApp !== null}
            >
              <div className="btn-left-content">
                <div className="upi-icon-container">
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" rx="8" fill="var(--white-10)" />
                    <path d="M7 10L14 13.5L21 10L14 6.5L7 10Z" fill="var(--white)" />
                    <path d="M7 22L14 25.5L21 22V15L14 18.5L7 15V22Z" fill="var(--white)" fillOpacity="0.8" />
                    <path d="M25 13L21 15L25 17L29 15L25 13Z" fill="var(--red)" />
                  </svg>
                </div>
                <div className="payment-btn-text">
                  <span className="payment-btn-title">Pay via other UPI Apps</span>
                  <span className="payment-btn-subtitle">Pay with BHIM, Paytm, CRED etc.</span>
                </div>
              </div>
              <div className="btn-right-content">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          </section>
        )}

        {/* Mobile direct QR toggle link */}
        {deviceType !== "desktop" && !isFallbackOpen && (
          <button
            className="qr-toggle-link"
            onClick={() => setIsFallbackOpen(true)}
          >
            Can't open UPI app? Scan QR or Pay Manually
          </button>
        )}

        {/* FALLBACK QR & MANUAL PAYMENT SECTION */}
        {(deviceType === "desktop" || isFallbackOpen) && (
          <section id="qr-fallback-section" className="qr-fallback-container">
            <div className="qr-fallback-card">
              <h2 className="fallback-title">
                {deviceType === "desktop" ? "Scan to Pay" : "Scan or Pay Manually"}
              </h2>
              <p className="fallback-subtitle">
                {deviceType === "desktop"
                  ? "Scan this QR code using any UPI app on your phone to complete your payment."
                  : "If your UPI app didn't open automatically, scan the QR code or copy the details to pay manually."}
              </p>

              <div className="qr-image-wrapper">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Payment QR Code"
                    className="qr-image"
                  />
                ) : (
                  <div className="qr-spinner-placeholder">
                    <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--white)' }} />
                  </div>
                )}
              </div>

              {/* Step-by-step instructions */}
              <div className="instructions-list">
                <div className="instruction-step">
                  <span className="step-number">1</span>
                  <span className="step-text">Scan the QR code OR copy the UPI details below.</span>
                </div>
                <div className="instruction-step">
                  <span className="step-number">2</span>
                  <span className="step-text">Open PhonePe, GPay, Paytm, or any UPI app.</span>
                </div>
                <div className="instruction-step">
                  <span className="step-number">3</span>
                  <span className="step-text">Paste the copied UPI ID and exact amount to complete your payment.</span>
                </div>
              </div>

              {/* Copy Actions Group */}
              <div className="fallback-copy-actions">
                <button
                  className="fallback-action-btn"
                  onClick={() => copyToClipboard(upiId, setCopiedUpi)}
                  title="Copy UPI ID"
                >
                  <div className="btn-inner-wrap">
                    <span className="action-btn-label">Recipient UPI ID</span>
                    <span className="action-btn-value">{upiId}</span>
                  </div>
                  {copiedUpi ? (
                    <span className="copied-toast-badge text-green">Copied!</span>
                  ) : (
                    <svg className="copy-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>

                <button
                  className="fallback-action-btn"
                  onClick={() => copyToClipboard(getNumericAmount(amount), setCopiedAmount)}
                  title="Copy Amount"
                >
                  <div className="btn-inner-wrap">
                    <span className="action-btn-label">Exact Amount</span>
                    <span className="action-btn-value">{formatCurrency(amount)}</span>
                  </div>
                  {copiedAmount ? (
                    <span className="copied-toast-badge text-green">Copied!</span>
                  ) : (
                    <svg className="copy-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>

            </div>
          </section>
        )}

        {/* THANK YOU BANNER */}
        <div className="pay-thank-you-card">
          <p className="thank-you-text">
            💛 Thanks for choosing ReelScale. We can't wait to<br />create your next masterpiece. See you soon! 🎬
          </p>
        </div>

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

      </div>

      {loadingApp && (
        <div className="page-loading-overlay" role="alert" aria-busy="true">
          <div className="spinner" />
          <span className="loading-text">
            Opening {loadingApp}...
          </span>
        </div>
      )}
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
