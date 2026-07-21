import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import LandingInteractions from "../(landing)/components/LandingInteractions";
import "../../styles.css";

export const metadata: Metadata = {
  title: "About Us | ReelScale — Content That Grows Businesses",
  description: "We don't just create reels. We combine strategy, cinematic production, and 1-2 hour editing to build content that makes your business impossible to ignore.",
  alternates: {
    canonical: "https://reelscale.in/about",
  },
  openGraph: {
    title: "About ReelScale | Premium Reel & Video Production",
    description: "Discover how ReelScale helps restaurants, salons, gyms, real estate brands, and startups turn everyday moments into revenue-generating content.",
    url: "https://reelscale.in/about",
    siteName: "ReelScale",
    images: ["https://reelscale.in/assets/logo.png"],
    type: "website",
  },
};

let cachedHeaderHtml: string | null = null;
let cachedFooterHtml: string | null = null;

function getHeaderAndFooter() {
  if (process.env.NODE_ENV === "production" && cachedHeaderHtml && cachedFooterHtml) {
    return { headerHtml: cachedHeaderHtml, footerHtml: cachedFooterHtml };
  }

  const html = readFileSync(join(process.cwd(), "index.html"), "utf8");

  // Extract Header
  const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
  let headerHtml = headerMatch ? headerMatch[0] : "";

  // Extract Footer
  const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
  let footerHtml = footerMatch ? footerMatch[0] : "";

  // Adjust relative links for Next routing
  headerHtml = headerHtml
    .replace(/href="#work"/g, 'href="/#work"')
    .replace(/href="#pricing"/g, 'href="/#pricing"');

  footerHtml = footerHtml
    .replace(/href="#work"/g, 'href="/#work"')
    .replace(/href="#pricing"/g, 'href="/#pricing"');

  cachedHeaderHtml = headerHtml;
  cachedFooterHtml = footerHtml;

  return { headerHtml, footerHtml };
}

export default function AboutPage() {
  const { headerHtml, footerHtml } = getHeaderAndFooter();

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://reelscale.in/about#webpage",
        "url": "https://reelscale.in/about",
        "name": "About ReelScale — Content That Grows Businesses",
        "description": "ReelScale combines strategy, premium production, and 1-2 hour editing to help businesses convert content into revenue."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/about#breadcrumbs",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://reelscale.in"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "About Us",
            "item": "https://reelscale.in/about"
          }
        ]
      }
    ]
  };

  return (
    <div className="about-page-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <LandingInteractions />

      {/* Dynamic Header */}
      <div dangerouslySetInnerHTML={{ __html: headerHtml }} />

      <main id="main-content" style={{ paddingTop: "100px" }}>

        {/* HERO SECTION */}
        <section className="about-hero-section">
          <div className="about-hero-backdrop"></div>
          <div className="about-hero-content reveal">
            <div className="section-eyebrow" style={{ marginBottom: "24px" }}>
              About ReelScale
            </div>
            
            <h1 className="about-hero-headline">
              We Don't Just Create Reels.<br />
              We Create Content That <em>Grows Businesses.</em>
            </h1>

            <p className="about-hero-sub" style={{ opacity: 0.9 }}>
              Every business knows content matters. The problem isn't posting more—it's creating content that people actually stop, watch, trust, and buy from.
            </p>

            {/* Problem & Solution Narrative Split */}
            <div className="about-story-grid">
              <div className="about-story-card problem-card">
                <div className="about-story-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  The Content Dilemma
                </div>
                <h3 className="about-story-title">Posting More Doesn't Equal Growth</h3>
                <p className="about-story-desc">
                  Most brands post constantly without a strategy. Views stay low, engagement drops, and videos fail to generate real customer inquiries or revenue.
                </p>
              </div>

              <div className="about-story-card solution-card">
                <div className="about-story-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  The ReelScale Advantage
                </div>
                <h3 className="about-story-title">Strategy + Speed + Cinema</h3>
                <p className="about-story-desc">
                  We combine business strategy, premium lighting, cinematic visuals, and lightning-fast 1–2 hour editing to turn everyday moments into high-performing lead engines.
                </p>
              </div>
            </div>

            {/* Target Industry Pills */}
            <div className="about-industry-badges">
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)", display: "flex", alignItems: "center", marginRight: "4px" }}>
                Built specifically for:
              </span>
              {["Restaurants", "Salons", "Gyms", "Real Estate", "Clinics", "Cafés", "Startups"].map((ind, i) => (
                <span key={i} className="about-industry-pill">
                  {ind}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* WHY BUSINESSES CHOOSE REELSCALE (NEON STYLE 4-COL GRID) */}
        <section className="about-why-section">
          <div className="about-section-container">
            <div className="about-section-header reveal" style={{ textAlign: "center" }}>
              <div className="section-eyebrow">Why ReelScale</div>
              <h2 className="section-title">
                Why Businesses Choose <em>ReelScale</em>
              </h2>
            </div>

            <div className="about-why-grid reveal">
              
              {/* Feature 1 */}
              <div className="about-why-card">
                <div className="about-why-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3 className="about-why-card-title">Strategy Before Camera</h3>
                <p className="about-why-card-desc">
                  Every reel starts with a plan focused on your business goals—not random trends. We engineer hooks that reach your exact target audience.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="about-why-card">
                <div className="about-why-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <h3 className="about-why-card-title">Premium Production</h3>
                <p className="about-why-card-desc">
                  Cinematic visuals, professional studio lighting, crisp audio, and storytelling that instantly builds authority and client trust.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="about-why-card">
                <div className="about-why-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h3 className="about-why-card-title">Fast Delivery</h3>
                <p className="about-why-card-desc">
                  Professionally edited reels delivered within 1–2 hours, so you stay consistent without bottlenecking your operational schedule.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="about-why-card">
                <div className="about-why-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <h3 className="about-why-card-title">Built for Growth</h3>
                <p className="about-why-card-desc">
                  Every piece of content is created to expand reach, amplify engagement, generate qualified inquiries, and drive measurable sales.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* OUR MISSION (HIGH-CONTRAST MINT/EMERALD HERO BLOCK) */}
        <section className="about-mission-section">
          <div className="about-mission-box reveal">
            <div>
              <div className="about-mission-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
                Our Core Mission
              </div>
              <h2 className="about-mission-title">
                To make world-class content accessible to <em>every growing business.</em>
              </h2>
              <p className="about-mission-desc">
                We believe great content shouldn't be expensive, slow, or complicated. It should become your business's single strongest sales asset.
              </p>
            </div>

            <div className="about-mission-stats">
              <div className="about-mission-stat-card">
                <div className="about-mission-stat-num">100M+</div>
                <div className="about-mission-stat-label">Organic Views Delivered</div>
              </div>
              <div className="about-mission-stat-card">
                <div className="about-mission-stat-num">1–2 Hours</div>
                <div className="about-mission-stat-label">Average Edit Delivery</div>
              </div>
              <div className="about-mission-stat-card">
                <div className="about-mission-stat-num">2–4x</div>
                <div className="about-mission-stat-label">Average Engagement Lift</div>
              </div>
            </div>
          </div>
        </section>

        {/* OUR PROCESS (5-STEP STEPPER TIMELINE) */}
        <section className="about-process-section">
          <div className="about-section-container">
            <div className="about-section-header reveal" style={{ textAlign: "center" }}>
              <div className="section-eyebrow">Our Process</div>
              <h2 className="section-title">
                Five Steps to <em>Scale Your Brand</em>
              </h2>
            </div>

            <div className="about-timeline reveal">
              
              <div className="about-timeline-step">
                <div className="about-step-num">01</div>
                <h3 className="about-step-title">Understand Your Business</h3>
                <p className="about-step-desc">
                  We identify your ideal audience, business targets, and highest-converting content opportunities.
                </p>
              </div>

              <div className="about-timeline-step">
                <div className="about-step-num">02</div>
                <h3 className="about-step-title">Plan the Content</h3>
                <p className="about-step-desc">
                  We write hooks and create concepts that people actually want to watch and share.
                </p>
              </div>

              <div className="about-timeline-step">
                <div className="about-step-num">03</div>
                <h3 className="about-step-title">Produce Premium Reels</h3>
                <p className="about-step-desc">
                  Professional on-site filming with meticulous attention to lighting, angles, and sound.
                </p>
              </div>

              <div className="about-timeline-step">
                <div className="about-step-num">04</div>
                <h3 className="about-step-title">Edit at Speed</h3>
                <p className="about-step-desc">
                  Lightning-fast, polished edits engineered with viral captions and sound design ready for social media.
                </p>
              </div>

              <div className="about-timeline-step">
                <div className="about-step-num">05</div>
                <h3 className="about-step-title">Help You Grow</h3>
                <p className="about-step-desc">
                  Consistent, high-retention content that continuously attracts attention, leads, and paying customers.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* MORE THAN A VIDEO AGENCY (MANIFESTO) */}
        <section className="about-manifesto-section">
          <div className="about-manifesto-box reveal">
            <div className="section-eyebrow">More Than a Video Agency</div>
            <h2 className="about-manifesto-quote">
              We're your long-term content partner.<br />
              Our goal isn't to deliver videos. Our goal is to help your business become the brand people <strong>remember, trust, and choose.</strong>
            </h2>
          </div>
        </section>

        {/* BOTTOM CTA SECTION (NEON STYLE) */}
        <section className="about-cta-section">
          <div className="about-cta-glow"></div>
          <div style={{ position: "relative", zIndex: 1 }} className="reveal">
            <div className="section-eyebrow" style={{ marginBottom: "20px" }}>Ready To Scale?</div>
            <h2 className="about-cta-title">
              Ready to turn your business into a brand people <em>can't ignore?</em>
            </h2>
            <p className="about-cta-sub">
              Let's create content that works as hard as you do.
            </p>
            <div>
              <a
                href="https://wa.me/919966239433?text=Hey%2C%20I%20saw%20your%20About%20page%20and%20I%27m%20ready%20to%20book%20our%20first%20shoot."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ padding: "18px 42px", fontSize: "var(--text-md)" }}
              >
                Book Your First Shoot →
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* Dynamic Footer */}
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
}
