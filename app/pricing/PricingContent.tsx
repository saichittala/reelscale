"use client";

import LandingInteractions from "../(landing)/components/LandingInteractions";

interface PricingContentProps {
  headerHtml: string;
  pricingHtml: string;
  footerHtml: string;
}

export default function PricingContent({ headerHtml, pricingHtml, footerHtml }: PricingContentProps) {
  return (
    <div className="pricing-page-wrapper">
      <LandingInteractions />

      {/* Dynamic Header */}
      <div dangerouslySetInnerHTML={{ __html: headerHtml }} suppressHydrationWarning />

      <main id="main-content" style={{ padding: "0" }}>

        {/* Page Hero Header */}
        <section id="hero" style={{ minHeight: "auto", padding: "200px 0 80px 0" }}>
          <div className="hero-bg"></div>
          <div className="display-flex fd-c width-100" style={{ zIndex: 1, position: "relative" }}>
            <div className="hero-lines"></div>
            <div className="hero-eyebrow" style={{ alignSelf: "center", marginBottom: "32px" }}>Pricing Plans</div>
            <h1 className="hero-title" style={{ fontSize: "clamp(30px, 4vw, 42px)", margin: "0 auto", lineHeight: "1.2", maxWidth: "800px" }}>
              Transparent pricing.<br />Built for <em>scalability.</em>
            </h1>
          </div>
        </section>

        {/* SECTION 1: REEL PRODUCTION PLANS (Extracted from index.html) */}
        <section style={{ padding: "100px 0" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }} suppressHydrationWarning>
            <div className="reveal" style={{ marginBottom: "60px" }}>
              <div className="section-eyebrow">Production Division</div>
              <h2 className="section-title" style={{ margin: "12px 0 0 0" }}>Reel Production <em>Plans</em></h2>
            </div>

            {/* We render the pricingHtml but strip out its section wrappers since we wrap it cleanly */}
            <div dangerouslySetInnerHTML={{
              __html: pricingHtml
                .replace(/<section id="pricing"[^>]*>/i, '')
                .replace(/<\/section>/i, '')
                .replace(/<div class="pricing-inner">/i, '')
                // Remove the first header inside pricingHtml to avoid duplicate titles
                .replace(/<div class="reveal">[\s\S]*?<\/h2>\s*<\/div>/i, '')
            }} suppressHydrationWarning />
          </div>
        </section>

        {/* SECTION 2: SOCIAL GROWTH PLANS */}
        <section id="growth-pricing" style={{ padding: "100px 0" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

            <div className="reveal" style={{ marginBottom: "80px" }}>
              <div className="section-eyebrow">Growth Division</div>
              <h2 className="section-title" style={{ margin: "12px 0 0 0" }}>Social Growth <em>Plans</em></h2>
              <p className="section-sub" style={{ fontSize: "18px", marginTop: "16px", maxWidth: "600px" }}>
                Complete social media management, organic content strategies, page scheduling, and optimized Meta ad campaigns.
              </p>
            </div>

            <div className="pricing-grid reveal" style={{ gap: "32px" }}>

              {/* Card 1: Presence */}
              <div className="pricing-card" style={{ display: "flex", flexDirection: "column", padding: "48px 36px" }}>
                <div>
                  <div className="plan-name">Presence</div>
                  <div className="plan-price"><sup>₹</sup>14,999</div>
                  <div className="plan-cadence">per month</div>
                  <div className="plan-divider"></div>
                  <ul className="plan-features">
                    <li>4 Premium Reels / Month</li>
                    <li>4 Social Media Posts</li>
                    <li>1 Content Shoot / Month</li>
                    <li>Content Planning</li>
                    <li>Professional Reel Editing</li>
                    <li>Captions + CTAs</li>
                    <li>Instagram Posting</li>
                    <li>Basic Monthly Report</li>
                    <li className="disabled">Ads Management</li>
                  </ul>
                </div>
                <a href="https://wa.me/919966239433?text=Hello%20ReelScale%20Growth%2C%20I%27d%20like%20to%20get%20started%20with%20the%20Presence%20plan."
                  target="_blank" className="btn-plan btn-plan-outline" style={{ marginTop: "auto" }}>
                  Select Presence Plan
                </a>
                <div className="plan-page-highlight" style={{ fontSize: "13px", color: "var(--muted)", margin: "16px 0 0 0", textAlign: "center" }}>For businesses that want to stay consistently visible.</div>
              </div>

              {/* Card 2: Growth (Featured) */}
              <div className="pricing-card featured" style={{ display: "flex", flexDirection: "column", padding: "48px 36px" }}>
                <div>
                  <div className="plan-name">Growth</div>
                  <div className="plan-price"><sup>₹</sup>24,999</div>
                  <div className="plan-cadence">per month</div>
                  <div className="plan-divider"></div>
                  <ul className="plan-features">
                    <li>6 Premium Reels / Month</li>
                    <li>6 Social Media Posts</li>
                    <li>1 Content Shoot / Month</li>
                    <li>Content Strategy</li>
                    <li>Professional Reel Editing</li>
                    <li>Hooks + Captions + CTAs</li>
                    <li>Instagram Page Management</li>
                    <li>Posting & Scheduling</li>
                    <li>Profile Optimization</li>
                    <li>Meta Ads Management</li>
                    <li>Campaign Optimization</li>
                    <li>Monthly Performance Report</li>
                  </ul>
                </div>
                <a href="https://wa.me/919966239433?text=Hello%20ReelScale%20Growth%2C%20I%27d%20like%20to%20get%20started%20with%20the%20Growth%20plan."
                  target="_blank" className="btn-plan btn-plan-red" style={{ marginTop: "auto" }}>
                  Select Growth Plan
                </a>
                <div className="plan-page-highlight" style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "16px 0 0 0", textAlign: "center" }}>For businesses ready to turn content into enquiries.</div>
              </div>

              {/* Card 3: Scale */}
              <div className="pricing-card luxe" style={{ display: "flex", flexDirection: "column", padding: "48px 36px" }}>
                <div>
                  <div className="plan-name">Scale</div>
                  <div className="plan-price"><sup>₹</sup>34,999</div>
                  <div className="plan-cadence">per month</div>
                  <div className="plan-divider"></div>
                  <ul className="plan-features">
                    <li>10 Premium Reels / Month</li>
                    <li>8 Social Media Posts</li>
                    <li>2 Content Shoots / Month</li>
                    <li>Advanced Content Strategy</li>
                    <li>Professional Editing</li>
                    <li>Hooks + Captions + CTAs</li>
                    <li>Complete Instagram Management</li>
                    <li>Content Calendar</li>
                    <li>Meta Ads Management</li>
                    <li>Multiple Campaign Management</li>
                    <li>Creative Testing</li>
                    <li>Monthly Growth Report</li>
                    <li>Priority Support</li>
                  </ul>
                </div>
                <a href="https://wa.me/919966239433?text=Hello%20ReelScale%20Growth%2C%20I%27d%20like%20to%20get%20started%20with%20the%20Scale%20plan."
                  target="_blank" className="btn-plan btn-plan-outline btn-plan-luxe" style={{ marginTop: "auto" }}>
                  Select Scale Plan
                </a>
                <div className="plan-page-highlight" style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "16px 0 0 0", textAlign: "center" }}>For businesses ready to increase content volume and reach.</div>
              </div>

            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginTop: "48px",
              fontSize: "var(--text-sm)",
              color: "var(--muted)",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              padding: "12px 24px",
              borderRadius: "99px",
              width: "fit-content",
              margin: "48px auto 0 auto"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>Ad spend budget for Meta Campaigns is separate and paid directly to Meta platforms.</span>
            </div>

          </div>
        </section>

      </main>

      {/* Dynamic Footer */}
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} suppressHydrationWarning />
    </div>
  );
}
