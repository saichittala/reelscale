"use client";

import LandingInteractions from "../(landing)/components/LandingInteractions";
import type { PricingPlan } from "../sanity/types";

interface PricingContentProps {
  headerHtml: string;
  pricingHtml: string;
  footerHtml: string;
  productionPlans?: PricingPlan[];
  growthPlans?: PricingPlan[];
}

export default function PricingContent({
  headerHtml,
  pricingHtml,
  footerHtml,
  productionPlans,
  growthPlans,
}: PricingContentProps) {
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

        {/* SECTION 1: REEL PRODUCTION PLANS */}
        <section style={{ padding: "100px 0" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }} suppressHydrationWarning>
            <div className="reveal" style={{ marginBottom: "60px" }}>
              <div className="section-eyebrow">Production Division</div>
              <h2 className="section-title" style={{ margin: "12px 0 0 0" }}>Reel Production <em>Plans</em></h2>
            </div>

            {productionPlans && productionPlans.length > 0 ? (
              <div className="pricing-grid reveal">
                {productionPlans.map((plan) => {
                  const isFeatured = plan.featured || plan.tier === "growth" || plan.title.toLowerCase() === "pro";
                  const isLuxe = plan.tier === "scale" || plan.title.toLowerCase() === "luxe";
                  const cardClass = isFeatured ? "pricing-card featured" : isLuxe ? "pricing-card luxe" : "pricing-card";
                  const btnClass = isFeatured ? "btn-plan btn-plan-red" : isLuxe ? "btn-plan btn-plan-outline btn-plan-luxe" : "btn-plan btn-plan-outline";

                  return (
                    <div key={plan._id} className={cardClass}>
                      <div className="plan-name">{plan.title}</div>
                      <div className="plan-price"><sup>{plan.currency || "₹"}</sup>{plan.price}</div>
                      <div className="plan-cadence">{plan.cadence || "per month"}</div>
                      <div className="plan-divider"></div>

                      <ul className="plan-features">
                        {plan.features?.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>

                      <a
                        href={plan.ctaLink || `https://wa.me/919966239433?text=Hello%20ReelScale%2C%20I%27d%20like%20to%20schedule%20a%20content%20shoot%20for%20${encodeURIComponent(plan.title)}%20plan.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={btnClass}
                      >
                        {plan.ctaText || "Start Your Reel"}
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{
                __html: pricingHtml
                  .replace(/<section id="pricing"[^>]*>/i, '')
                  .replace(/<\/section>/i, '')
                  .replace(/<div class="reveal">[\s\S]*?<\/h2>\s*<\/div>/i, '')
              }} suppressHydrationWarning />
            )}
          </div>
        </section>

        {/* SECTION 2: SOCIAL GROWTH PLANS (Only displayed if growthPlans exist) */}
        {growthPlans && growthPlans.length > 0 && (
          <section id="growth-pricing" className="growth-page-wrapper" style={{ padding: "100px 0" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

              <div className="reveal" style={{ marginBottom: "80px" }}>
                <div className="section-eyebrow">Growth Division</div>
                <h2 className="section-title" style={{ margin: "12px 0 0 0" }}>Social Growth <em>Plans</em></h2>
                <p className="section-sub" style={{ fontSize: "18px", marginTop: "16px", maxWidth: "600px" }}>
                  Complete social media management, organic content strategies, page scheduling, and optimized Meta ad campaigns.
                </p>
              </div>

              <div className="pricing-grid reveal" style={{ gap: "32px" }}>
                {growthPlans.map((plan, idx) => {
                  const isFeatured = plan.featured || plan.tier === "growth" || plan.title.toLowerCase().includes("growth");
                  const isLuxe = plan.tier === "scale" || plan.title.toLowerCase().includes("scale");
                  const cardClass = isFeatured ? "pricing-card featured" : isLuxe ? "pricing-card luxe" : "pricing-card";
                  const btnClass = isFeatured ? "btn-plan btn-plan-red" : isLuxe ? "btn-plan btn-plan-outline btn-plan-luxe" : "btn-plan btn-plan-outline";
                  const highlightColor = isFeatured ? "rgba(255,255,255,0.7)" : isLuxe ? "rgba(255,255,255,0.7)" : "var(--muted)";
                  const highlightText =
                    idx === 0
                      ? "For businesses that want to stay consistently visible."
                      : idx === 1
                      ? "For businesses ready to turn content into enquiries."
                      : "For businesses ready to increase content volume and reach.";

                  return (
                    <div key={plan._id || idx} className={cardClass} style={{ display: "flex", flexDirection: "column", padding: "48px 36px" }}>
                      <div>
                        <div className="plan-name">{plan.title}</div>
                        <div className="plan-price"><sup>{plan.currency || "₹"}</sup>{plan.price}</div>
                        <div className="plan-cadence">{plan.cadence || "per month"}</div>
                        <div className="plan-divider"></div>
                        <ul className="plan-features">
                          {plan.features?.map((feat, fIdx) => (
                            <li key={fIdx} className={feat.toLowerCase().includes("disabled") ? "disabled" : ""}>
                              {feat.replace(/^disabled:\s*/i, "")}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <a
                        href={plan.ctaLink || `https://wa.me/919966239433?text=Hello%20ReelScale%20Growth%2C%20I%27d%20like%20to%20get%20started%20with%20the%20${encodeURIComponent(plan.title)}%20plan.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={btnClass}
                        style={{ marginTop: "auto" }}
                      >
                        {plan.ctaText || `Select ${plan.title} Plan`}
                      </a>
                      <div className="plan-page-highlight" style={{ fontSize: "13px", color: highlightColor, margin: "16px 0 0 0", textAlign: "center" }}>
                        {highlightText}
                      </div>
                    </div>
                  );
                })}
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
        )}

      </main>

      {/* Dynamic Footer */}
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} suppressHydrationWarning />
    </div>
  );
}
