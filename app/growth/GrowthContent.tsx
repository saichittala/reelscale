"use client";

import { useEffect, useState, useRef } from "react";
import LandingInteractions from "../(landing)/components/LandingInteractions";

interface GrowthContentProps {
  headerHtml: string;
  footerHtml: string;
}

function CountUp({ end, duration = 2000, decimals = 0, suffix = "" }: { end: number; duration?: number; decimals?: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime: number | null = null;
          
          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            // Cubic bezier deceleration (ease out)
            const easeOut = 1 - Math.pow(1 - percentage, 3);
            const current = easeOut * end;
            
            setValue(current);
            
            if (percentage < 1) {
              requestAnimationFrame(animate);
            } else {
              setValue(end);
            }
          };
          
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (nodeRef.current) {
      observer.observe(nodeRef.current);
    }

    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={nodeRef}>{value.toFixed(decimals)}{suffix}</span>;
}

export default function GrowthContent({ headerHtml, footerHtml }: Omit<GrowthContentProps, "testimonialsHtml" | "faqHtml">) {
  const scrollToPricing = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById("pricing");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="growth-page-wrapper">
      <LandingInteractions />

      {/* Dynamic Header with custom CTA for Growth page */}
      <div
        dangerouslySetInnerHTML={{
          __html: headerHtml
            .replace(/Start\s+your\s+Reel/gi, 'Grow my brand')
            .replace(/href="https:\/\/wa\.me\/[^"]*"/g, 'href="https://wa.me/919966239433?text=Hello%20ReelScale%20Growth%2C%20I%27d%20like%20to%20grow%20my%20brand."')
        }}
        suppressHydrationWarning
      />

      <main id="main-content">

        {/* 1. HERO SECTION (Replicates Homepage Hero Structure Exactly with spacious luxury padding) */}
        <section id="hero">
          <div className="hero-bg"></div>
          <div className="display-flex fd-c width-100" style={{ zIndex: 1, position: "relative" }}>
            <div className="hero-lines"></div>



            <h1 className="hero-title" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", margin: "0 auto 48px auto", lineHeight: "1.2", maxWidth: "800px" }}>
              We <em>create and grow</em><br />brands on social.
            </h1>
            <div className="hero-ctas">
              <a
                href="https://wa.me/919966239433?text=Hey%2C%20I%20visited%20the%20ReelScale%20Growth%20page%20and%20I%27d%20like%20to%20grow%20my%20brand."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Grow my brand
              </a>
              <a
                href="/works"
                className="btn-secondary"
              >
                View our work
              </a>
            </div>

            <div className="growth-hero-image-container">
              <img
                src="/assets/growth/growth-hero.png"
                alt="ReelScale Growth Dashboard Mockup"
                className="growth-hero-image"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* METRICS (Conversion, retention-focused, and highly credible metrics) */}
        <section id="metrics">
          <div className="metrics-list reveal">
            <div className="metric-row">
              <div className="metric-num">
                <span className="metric-digit">
                  <CountUp end={84.6} decimals={1} suffix="%" />
                </span>{" "}
                retention
              </div>
              <div className="metric-label">average video retention rate</div>
            </div>
            <div className="metric-row">
              <div className="metric-num">
                <span className="metric-digit">
                  <CountUp end={3.8} decimals={1} suffix="x" />
                </span>{" "}
                conversion
              </div>
              <div className="metric-label">average sales conversion lift</div>
            </div>
            <div className="metric-row">
              <div className="metric-num">
                <span className="metric-digit">
                  <CountUp end={50} suffix="M+" />
                </span>{" "}
                views
              </div>
              <div className="metric-label">high-intent organic views delivered</div>
            </div>
          </div>
        </section>

        {/* 2. SERVICES ECOSYSTEM (Spacious padding & elegant font highlights) */}
        <section id="services">
          <div className="services-inner">
            <div className="services-header reveal" style={{ marginBottom: "100px" }}>
              <div>
                <div className="section-eyebrow">Services Ecosystem</div>
                <h2 className="section-title">Three Pillars of <em>Growth.</em></h2>
              </div>
              <p className="section-sub" style={{ fontSize: "18px", lineHeight: "1.6" }}>
                Stop coordinating multiple video editors, copywriters, and ad managers. ReelScale Growth aligns your production, organic presence, and paid acquisition into a single, unified engine.
              </p>
            </div>

            <div className="services-grid services-grid-3 reveal">

              {/* Pillar 1 */}
              <div className="service-card" style={{ padding: "36px 32px" }}>
                <div className="service-card-header">
                  <div className="service-icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                      <line x1="15" y1="3" x2="15" y2="21" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="3" y1="15" x2="21" y2="15" />
                    </svg>
                  </div>
                  <div className="service-name">Page Management</div>
                </div>
                <div className="service-card-divider"></div>
                <p className="service-desc">
                  Instagram page management, content calendar mapping, scheduling, captions, hashtag research, interactive stories, profile optimization, and community moderation.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="service-card" style={{ padding: "36px 32px" }}>
                <div className="service-card-header">
                  <div className="service-icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <div className="service-name">Content & Creative</div>
                </div>
                <div className="service-card-divider"></div>
                <p className="service-desc">
                  End-to-end cinematic reel production, premium video editing, hooks & scriptwriting, creative viral direction, ready-to-post exports, and audio design.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="service-card" style={{ padding: "36px 32px" }}>
                <div className="service-card-header">
                  <div className="service-icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <div className="service-name">Growth & Ads</div>
                </div>
                <div className="service-card-divider"></div>
                <p className="service-desc">
                  Complete Meta Ads campaign configuration, targeting setups, lead generation flows, creative ad asset testing, performance metrics, and monthly reports.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* 3. CUSTOMER JOURNEY (Spacious padding & elegant headings) */}
        <section id="process">
          <div style={{ textAlign: "center", marginBottom: "80px" }} className="reveal">
            <div className="section-eyebrow">Customer Journey</div>
            <h2 className="section-title">Four steps to <em>full growth.</em></h2>
          </div>
          <div className="process-steps reveal">
            <div className="process-step">
              <div className="step-dot">01</div>
              <h3 className="step-title">Reel Production</h3>
              <p className="step-desc">Cinematic visual assets built for retention, hook optimization, and premium aesthetic alignment.</p>
            </div>
            <div className="process-step">
              <div className="step-dot">02</div>
              <h3 className="step-title">Social Management</h3>
              <p className="step-desc">Scheduled publishing, curated post templates, captions, hashtags, and story sequences.</p>
            </div>
            <div className="process-step">
              <div className="step-dot">03</div>
              <h3 className="step-title">Social + Ads</h3>
              <p className="step-desc">Meta Ads campaign management using highest-performing organic content as test creatives.</p>
            </div>
            <div className="process-step">
              <div className="step-dot">04</div>
              <h3 className="step-title">Full Growth</h3>
              <p className="step-desc">Complete organic dominance and scaling performance metrics driving direct buyer inquiries.</p>
            </div>
          </div>
        </section>

        {/* 4. PRICING SECTIONS (Spacious padding & class highlights) */}
        <section id="pricing">
          <div className="pricing-inner">
            <div className="reveal" style={{ marginBottom: "80px" }}>
              <div className="section-eyebrow">Growth Packages</div>
              <h2 className="section-title">Simple. Scalable.<br />No <em>surprises.</em></h2>
            </div>

            <div className="pricing-grid reveal" style={{ gap: "32px" }}>

              {/* Card 1: Presence */}
              <div className="pricing-card" style={{ display: "flex", flexDirection: "column", padding: "48px 36px" }}>
                <div>
                  <div className="plan-name">Presence</div>
                  <div className="plan-price"><sup>₹</sup>14,999</div>
                  <div className="plan-cadence">per month</div>
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

              {/* Card 2: Growth (Featured / Recommended) */}
              <div className="pricing-card featured" style={{ display: "flex", flexDirection: "column", padding: "48px 36px" }}>
                <div>
                  <div className="plan-name">Growth</div>
                  <div className="plan-price"><sup>₹</sup>24,999</div>
                  <div className="plan-cadence">per month</div>
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

        {/* 5. TESTIMONIALS SECTION (Custom Social Proof specifically targeted to Social Growth) */}
        <section id="testimonials">
          <div style={{ textAlign: "center", marginBottom: "80px" }} className="reveal">
            <div className="section-eyebrow">Client Results</div>
            <h2 className="section-title">Real brands.<br />Real <em>growth.</em></h2>
          </div>
          <div className="testi-grid reveal" style={{ gap: "32px" }}>

            {/* Testimonial 1 */}
            <div className="testi-card">
              <div className="testi-stars">
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
              </div>

              <p className="testi-quote">
                "We went from getting views but zero leads to booking 45+ gym consultations every month. ReelScale Growth's ad funnel and page management completely changed our business."
              </p>

              <div className="testi-result">+180%</div>
              <div className="testi-result-label">Enquiries Lift</div>

              <div className="testi-divider"></div>

              <div className="testi-author">
                <div className="testi-avatar">RK</div>
                <div>
                  <div className="testi-name">Rahul K.</div>
                  <div className="testi-role">Founder, FitAcademy</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="testi-card">
              <div className="testi-stars">
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
              </div>

              <p className="testi-quote">
                "Coordinating shoots, video editors, and Meta ad managers was a nightmare. ReelScale Growth took over everything—from content shoots in Hyderabad to post scheduling and campaign scaling. Inquiries tripled."
              </p>

              <div className="testi-result">3.4x</div>
              <div className="testi-result-label">ROI on Ads</div>

              <div className="testi-divider"></div>

              <div className="testi-author">
                <div className="testi-avatar">MN</div>
                <div>
                  <div className="testi-name">Meera Nair</div>
                  <div className="testi-role">Director, CasaDecor</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="testi-card">
              <div className="testi-stars">
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
                <img src="/assets/icons/star-green.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />
              </div>

              <p className="testi-quote">
                "They don't just post content; they build a customer acquisition engine. The strategy call alone gave us more insights than our previous agency. Highly recommended."
              </p>

              <div className="testi-result">12k+</div>
              <div className="testi-result-label">Leads Generated</div>

              <div className="testi-divider"></div>

              <div className="testi-author">
                <div className="testi-avatar">AV</div>
                <div>
                  <div className="testi-name">Anirudh V.</div>
                  <div className="testi-role">CMO, TechSpace</div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 6. FAQ SECTION (Custom objections handled for Social Growth) */}
        <section id="faq">
          <div className="faq-container">
            <div style={{ textAlign: "center", marginBottom: "80px" }} className="reveal">
              <div className="section-eyebrow">Got Questions?</div>
              <h2 className="section-title">Frequently Asked <em>Questions</em></h2>
            </div>

            <div className="faq-list reveal">

              {/* FAQ 1 */}
              <div className="faq-item">
                <button className="faq-question" aria-expanded="false">
                  <span>What is included in Instagram Page Management?</span>
                  <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-content">
                    <p>
                      We handle everything: post and reel scheduling, writing highly persuasive captions, targeting local hashtags, creating daily stories, bio optimization, and community management (replying to inquiries and comments).
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ 2 */}
              <div className="faq-item">
                <button className="faq-question" aria-expanded="false">
                  <span>How does Meta Ads management work?</span>
                  <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-content">
                    <p>
                      We use the high-performing organic reels we shoot for your brand as the primary ad creatives. We set up targeting, build lead capture funnels, and manage your Meta Ad account to drive customer inquiries directly to your WhatsApp or DM.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ 3 */}
              <div className="faq-item">
                <button className="faq-question" aria-expanded="false">
                  <span>Are content shoots in Hyderabad included in the growth plans?</span>
                  <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-content">
                    <p>
                      Yes! All our growth packages include professional, high-end content shoots at your location in Hyderabad. We bring our cinematic production gear, write the scripts, and film ready-to-use hooks.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ 4 */}
              <div className="faq-item">
                <button className="faq-question" aria-expanded="false">
                  <span>Is the ad spend budget included in the monthly fee?</span>
                  <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-content">
                    <p>
                      No, ad spend is separate. You pay Meta directly for the ad placement, allowing you to control and scale your budget at your own pace while we handle the strategy and optimization.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ 5 */}
              <div className="faq-item">
                <button className="faq-question" aria-expanded="false">
                  <span>How soon can we expect to see results?</span>
                  <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-content">
                    <p>
                      Organic optimization and consistency build up over the first 30 days. Paid Meta Ads campaigns can start generating direct buyer inquiries within the first 7 to 10 days of going live.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 7. HIGH CONVERTING ENDING CTA SECTION (Luxury spacious padding & layout) */}
        <section id="cta" style={{ background: "linear-gradient(180deg, var(--bg-dark) 0%, var(--bg-black) 100%)" }}>
          <div className="cta-inner reveal" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
            <h2 className="cta-title" style={{ fontSize: "clamp(28px, 4.5vw, 44px)", lineHeight: "1.1", marginBottom: "24px" }}>
              Turn content into <em>growth.</em>
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "var(--text-lg)", fontWeight: 300, lineHeight: 1.7, maxWidth: "680px", margin: "0 auto 48px auto" }}>
              We create, manage, and grow your brand on social.
            </p>
            <a href="https://wa.me/919966239433?text=Hey%2C%20I%20visited%20the%20ReelScale%20Growth%20page%20and%20I%27d%20like%20to%20grow%20my%20brand."
              target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: "20px 48px", fontSize: "16px" }}>
              Grow My Brand
            </a>
          </div>
        </section>

      </main>

      {/* Dynamic Footer */}
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
}
