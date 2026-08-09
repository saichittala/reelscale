"use client";

import Link from "next/link";
import LandingInteractions from "../(landing)/components/LandingInteractions";

export interface Benefit {
  title: string;
  desc: string;
}

export interface ProcessStep {
  step: string;
  title: string;
  desc: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ServicePageData {
  name: string;
  headline: string;
  subheadline: string;
  introText: string;
  benefits: Benefit[];
  process: ProcessStep[];
  deliverables: string[];
  pricingPlan: string;
  pricingPrice: string;
  pricingFeatures: string[];
  faqs: FAQItem[];
  locationKeywords: string[];
}

interface ServicePageTemplateProps {
  headerHtml: string;
  footerHtml: string;
  data: ServicePageData;
  isMainVideoProduction?: boolean;
}

export default function ServicePageTemplate({ headerHtml, footerHtml, data, isMainVideoProduction = false }: ServicePageTemplateProps) {
  return (
    <div className="service-page-wrapper">
      <LandingInteractions />

      {/* Dynamic Header */}
      <div dangerouslySetInnerHTML={{ __html: headerHtml }} />

      <main id="main-content">
        
        {/* Hero Section */}
        <section className="service-hero-section">
          <div className="section-eyebrow">{data.name}</div>
          <h1 className="section-title">
            {data.headline}
          </h1>
          <p className="section-sub">
            {data.subheadline} — {data.introText}
          </p>

          <div className="service-hero-ctas">
            <a href="https://wa.me/919966239433?text=Hello%20ReelScale%2C%20I%27d%20like%20to%20schedule%20a%20content%20shoot.%20Please%20let%20me%20know%20your%20next%20availability." target="_blank" rel="noopener noreferrer" className="btn-primary btn-padded">
              Start your Reel
            </a>
            <Link href="/works" className="btn-secondary btn-padded">
              View Our Work
            </Link>
          </div>

          {/* Trust Signal Metrics */}
          <div className="metrics-list" style={{ marginTop: '120px', marginBottom: '120px' }}>
            <div className="metric-row">
              <div className="metric-num">
                <span className="metric-digit">100+</span> million
              </div>
              <div className="metric-label">total views delivered</div>
            </div>
            <div className="metric-row">
              <div className="metric-num">
                <span className="metric-digit">100+</span> reels
              </div>
              <div className="metric-label">expertly created</div>
            </div>
            <div className="metric-row">
              <div className="metric-num">
                <span className="metric-digit">2-4x</span> growth
              </div>
              <div className="metric-label">average engagement lift</div>
            </div>
          </div>

          {/* Location Keywords Pills */}
          <div className="service-location-pills">
            <span className="service-location-pills-label">Available in:</span>
            {data.locationKeywords.map((loc, idx) => (
              <span key={idx} className="service-location-pill">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="service-benefits-section">
          <div className="service-container-1200">
            <div className="service-section-header-centered">
              <div className="section-eyebrow">Key Benefits</div>
              <h2 className="section-title">Why Choose ReelScale?</h2>
            </div>
            <div className="services-grid service-page-grid">
              {data.benefits.map((b, idx) => (
                <div key={idx} className="service-card service-page-card">
                  <div className="service-num">0{idx + 1}</div>
                  <div className="service-name">{b.title}</div>
                  <p className="service-desc">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Deliverables & Process Split Section */}
        <section className="service-split-section">
          <div className="service-split-grid">
            <div>
              <div className="section-eyebrow">What You Get</div>
              <h2 className="section-title">Deliverables</h2>
              <ul className="service-deliverables-list">
                {data.deliverables.map((item, idx) => (
                  <li key={idx} className="service-deliverable-item">
                    <span className="service-deliverable-item-bullet">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="section-eyebrow">Our Workflow</div>
              <h2 className="section-title">The Production Process</h2>
              <div className="service-workflow-list">
                {data.process.map((p, idx) => (
                  <div key={idx} className="service-workflow-item">
                    <div className="service-workflow-step-num">{p.step}</div>
                    <div>
                      <h3 className="service-workflow-step-title">{p.title}</h3>
                      <p className="service-workflow-step-desc">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Pricing Highlight */}
        <section className="service-benefits-section">
          <div className="service-pricing-container-640">
            <div className="service-pricing-header">
              <div className="section-eyebrow">Pricing Package</div>
              <h2 className="section-title">Dedicated Plan</h2>
            </div>
            <div className="pricing-card featured service-pricing-card-override">
              <div className="plan-name">{data.pricingPlan}</div>
              <div className="plan-price"><sup>₹</sup>{data.pricingPrice.replace("₹", "")}</div>
              <div className="plan-cadence">per month</div>
              <div className="plan-divider"></div>
              <ul className="plan-features">
                {data.pricingFeatures.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
              <a href="https://wa.me/919966239433?text=Hello%20ReelScale%2C%20I%27d%20like%20to%20schedule%20a%20content%20shoot.%20Please%20let%20me%20know%20your%20next%20availability." target="_blank" rel="noopener noreferrer" className="btn-plan btn-plan-red btn-padded">
                Start your Reel
              </a>
            </div>
          </div>
        </section>

        {/* FAQs Accordion */}
        <section className="faq-section service-faq-section">
          <div className="service-faq-header">
            <span className="section-eyebrow">FAQ</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className="faq-list service-faq-list">
            {data.faqs.map((faq, idx) => (
              <div key={idx} className="faq-item">
                <button className="faq-question" aria-expanded="false" aria-controls={`faq-ans-${idx}`}>
                  <span>{faq.question}</span>
                  <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="faq-answer" id={`faq-ans-${idx}`}>
                  <div className="faq-answer-content">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dedicated Bottom Conversion CTA Section */}
        <section className="service-bottom-cta-section">
          <div className="service-bottom-cta-inner">
            <h2 className="service-bottom-cta-heading">
              Ready to <em>Scale</em> Your Brand?
            </h2>
            <a href="https://wa.me/919966239433?text=Hello%20ReelScale%2C%20I%27d%20like%20to%20schedule%20a%20content%20shoot.%20Please%20let%20me%20know%20your%20next%20availability." target="_blank" rel="noopener noreferrer" className="btn-primary btn-padded-cta">
              Book a Shoot on WhatsApp
            </a>
          </div>
        </section>

        {isMainVideoProduction && (
          <section id="knowledge-hub">
            <div className="kh-container-flat">
              <h3 className="kh-flat-heading">ReelScale Knowledge Hub</h3>
              <p className="kh-flat-paragraph">
                ReelScale is the best video production company in Hyderabad, providing premium end-to-end video production services to brands, creators, and corporate companies. Our services help local and national brands drive social media growth and build deep brand authority.
              </p>

              <h3 className="kh-flat-heading">Professional Video Production Services in Hyderabad</h3>
              <p className="kh-flat-paragraph">
                Our professional videography services in Hyderabad encompass high-concept brand films, detailed product shoots, and corporate video production. We serve companies across major micro-markets including Gachibowli, Madhapur, HITEC City, Jubilee Hills, and Banjara Hills.
              </p>

              <h3 className="kh-flat-heading">Commercial Video Production & Corporate Video Production</h3>
              <p className="kh-flat-paragraph">
                We produce commercial video ads and corporate films that establish E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness). Our team offers professional drone videography, event coverage, and multi-cam podcast production services to deliver outstanding brand exposure.
              </p>

              <h3 className="kh-flat-heading">Organic Social Media Growth & Reel Marketing</h3>
              <p className="kh-flat-paragraph">
                As a leading short form content agency, we act as a dedicated Instagram reels agency and content creation agency. Our specialized reel makers and video editors handle pacing, color grading, sound design, and subtitle styling centered in visual safe zones.
              </p>

              <h3 className="kh-flat-heading">Why Professional Reels Outperform DIY Content</h3>
              <p className="kh-flat-paragraph">
                Unlike DIY recordings, professional video editing and production offer cinema-grade dynamic range, studio lighting, and audio isolation. These factors prevent viewer bounces, maximize average watch time, and satisfy search algorithms to boost organic reach.
              </p>
            </div>
          </section>
        )}

      </main>

      {/* Dynamic Footer */}
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
}
