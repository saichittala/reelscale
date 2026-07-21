"use client";

import LandingInteractions from "../(landing)/components/LandingInteractions";

interface AboutContentProps {
  headerHtml: string;
  footerHtml: string;
}

export default function AboutContent({ headerHtml, footerHtml }: AboutContentProps) {
  return (
    <div className="ed-about-wrapper">
      <LandingInteractions />

      {/* Dynamic Header — Kept identical to original */}
      <div dangerouslySetInnerHTML={{ __html: headerHtml }} />

      <main id="main-content">

        {/* 1. HERO SECTION */}
        <section className="ed-hero-section">
          <div className="ed-container">
            <div className="ed-hero-grid reveal">
              <div>
                <h1 className="ed-hero-headline">
                  Building brands<br />
                  people <em>remember.</em>
                </h1>
              </div>
              <div>
                <p className="ed-hero-sub">
                  At ReelScale, we combine strategy, cinematic production, and rapid editing to help ambitious businesses turn everyday moments into high-performing reels that attract attention, build credibility, and generate revenue.
                </p>
              </div>
            </div>

            {/* Large Cinematic Hero Image */}
            <div className="ed-hero-image-wrap reveal">
              <img
                src="/assets/about/main.webp"
                alt="ReelScale Cinematic Video Production Setup"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* 2. PHILOSOPHY & PROVEN IMPACT SECTION */}
        <section className="ed-story-section">
          <div className="ed-container">
            <div className="ed-story-header-grid reveal">
              <div>
                <h2 className="section-title" style={{ fontSize: "clamp(28px, 4vw, 38px)", margin: 0 }}>
                  Attention is rented.<br />
                  <em>Trust is earned.</em>
                </h2>
              </div>
              <div>
                <p style={{ fontSize: "var(--text-md)", color: "var(--muted)", fontWeight: 300, lineHeight: 1.7, margin: 0 }}>
                  Businesses don't fail from a lack of quality—they fail from a lack of attention. At ReelScale, we don't just deliver videos; we build your brand's strongest sales asset with high-retention storytelling, cinematic production, and reliable 24-hour turnaround.
                </p>
              </div>
            </div>

            {/* Track Record Stats */}
            <div className="ed-stats-grid reveal">
              <div className="ed-stat-card">
                <div className="ed-stat-label">Businesses Served</div>
                <div className="ed-stat-val">20+</div>
              </div>
              <div className="ed-stat-card">
                <div className="ed-stat-label">Reels Produced</div>
                <div className="ed-stat-val">250+</div>
              </div>
              <div className="ed-stat-card">
                <div className="ed-stat-label">Views Generated</div>
                <div className="ed-stat-val">10M+</div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. METHODOLOGY SECTION */}
        <section className="ed-approach-section">
          <div className="ed-container">
            <div style={{ marginBottom: "48px" }} className="reveal">
              <h2 className="section-title">Four Steps to <em>Scale Your Brand</em></h2>
            </div>

            <div className="ed-approach-grid reveal">

              <div className="ed-approach-card">
                <div className="ed-approach-card-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ed-card-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <h3 className="ed-approach-title">Strategy</h3>
                </div>
                <p className="ed-approach-desc">
                  Hook-driven concepts aligned with real business goals and customer intent.
                </p>
              </div>

              <div className="ed-approach-card">
                <div className="ed-approach-card-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ed-card-icon">
                    <path d="M23 7l-7 5 7 5V7z"></path>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                  <h3 className="ed-approach-title">Production</h3>
                </div>
                <p className="ed-approach-desc">
                  Cinematic on-site shoots with professional lighting, audio, and framing.
                </p>
              </div>

              <div className="ed-approach-card">
                <div className="ed-approach-card-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ed-card-icon">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  <h3 className="ed-approach-title">Editing</h3>
                </div>
                <p className="ed-approach-desc">
                  Fast, high-retention post-production optimized for social platform algorithms.
                </p>
              </div>

              <div className="ed-approach-card">
                <div className="ed-approach-card-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ed-card-icon">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                  <h3 className="ed-approach-title">Growth</h3>
                </div>
                <p className="ed-approach-desc">
                  High-converting visual assets engineered to generate inquiries and revenue.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* 4. READY TO SCALE CTA */}
        <section className="ed-cta-section reveal">
          <div className="ed-container">
            <h2 className="ed-cta-headline">
              Ready to create content<br />
              <em>people remember?</em>
            </h2>

            <div>
              <a
                href="https://wa.me/919966239433?text=Hey%2C%20I%20visited%20the%20ReelScale%20About%20page%20and%20I%27d%20like%20to%20book%20a%20strategy%20call."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ padding: "16px 38px", fontSize: "var(--text-md)" }}
              >
                Start your Reel
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* Dynamic Footer — Kept identical to original */}
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
}
