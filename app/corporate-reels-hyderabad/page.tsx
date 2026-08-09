import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import ServicePageTemplate from "../services/ServicePageTemplate";
import "../../styles.css";

export const metadata: Metadata = {
  title: "Corporate Reels Shoot in Hyderabad | Business Video Production",
  description: "Enhance your brand authority with corporate reels shoot in Hyderabad. Professional business videos, company profiles, team highlights, and founder interviews in HITEC City.",
  alternates: {
    canonical: "https://reelscale.in/corporate-reels-hyderabad",
  },
  openGraph: {
    title: "Corporate Reels Shoot in Hyderabad | Business Video Production",
    description: "Enhance your brand authority with corporate reels shoot in Hyderabad. Professional business videos, company profiles, team highlights, and founder interviews in HITEC City.",
    url: "https://reelscale.in/corporate-reels-hyderabad",
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
    .replace(/href="#"/g, 'href="/"')
    .replace(/href="#work"/g, 'href="/works"')
    .replace(/href="#pricing"/g, 'href="/pricing"');

  footerHtml = footerHtml
    .replace(/href="#"/g, 'href="/"')
    .replace(/href="#work"/g, 'href="/works"')
    .replace(/href="#pricing"/g, 'href="/pricing"');

  cachedHeaderHtml = headerHtml;
  cachedFooterHtml = footerHtml;

  return { headerHtml, footerHtml };
}

export default function SEOPage() {
  const { headerHtml, footerHtml } = getHeaderAndFooter();

  const data = {
  "slug": "corporate-reels-hyderabad",
  "keyword": "corporate reels Hyderabad",
  "title": "Corporate Reels Shoot in Hyderabad | Business Video Production",
  "desc": "Enhance your brand authority with corporate reels shoot in Hyderabad. Professional business videos, company profiles, team highlights, and founder interviews in HITEC City.",
  "name": "Corporate Reels",
  "headline": "Corporate Reels Shoot in Hyderabad",
  "subheadline": "Establish B2B Trust & Brand Authority with Business Reels",
  "introText": "Corporate identity is about authority, values, and professionalism. We produce clean, cinematic corporate video reels, founder interviews, team culture spotlights, and workplace office tours in HITEC City and Gachibowli.",
  "benefits": [
    {
      "title": "Crisp Interview Audio",
      "desc": "Using wireless lapel lavaliers and studio mics to ensure absolute vocal clarity."
    },
    {
      "title": "Polished Brand Graphics",
      "desc": "Adding custom lower thirds, company colors, brand typography, and slick transition graphics."
    },
    {
      "title": "B2B Client Funnels",
      "desc": "Crafting authority-driven educational scripts that appeal to B2B decision-makers and recruits."
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Storyboard & Hook Design",
      "desc": "Aligning corporate messages, values, and client testimonials into short hooks."
    },
    {
      "step": "02",
      "title": "Workplace Film Shoot",
      "desc": "Professional office shoots, b-roll capture, founder interviews, and team interaction shots."
    },
    {
      "step": "03",
      "title": "Polished Corporate Edit",
      "desc": "Adding company branding assets, clean lower thirds, captions, and balanced audio."
    },
    {
      "step": "04",
      "title": "LinkedIn & Social Setup",
      "desc": "Deploying with professional B2B hashtags and optimized publication schedules."
    }
  ],
  "deliverables": [
    "Founder Interview Clips",
    "Office Vibe & B-Roll Highlights",
    "Slick Lower-Third Brand Names",
    "Noise-Isolated Vocal Audios",
    "Corporate Color Grading LUTs"
  ],
  "pricingPlan": "Corporate Scale",
  "pricingPrice": "₹19,999",
  "pricingFeatures": [
    "12 Corporate Reels / Month",
    "Professional Lighting & Mic Gear",
    "Founder Interview Focus",
    "Clean Branding Color Assets",
    "LinkedIn Safe Pacing & Editing",
    "Unlimited Revisions"
  ],
  "faqs": [
    {
      "question": "Do you shoot testimonials?",
      "answer": "Yes! Recording authentic customer reviews and client success interviews is one of our most popular corporate video formats."
    },
    {
      "question": "Can you work around office hours?",
      "answer": "Absolutely. We coordinate with your HR team to film B-roll and interviews with minimal disruption to your active operations."
    }
  ],
  "locationKeywords": [
    "HITEC City",
    "Gachibowli",
    "Financial District",
    "Madhapur",
    "Banjara Hills"
  ]
};

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://reelscale.in/corporate-reels-hyderabad#webpage",
        "url": "https://reelscale.in/corporate-reels-hyderabad",
        "name": "Corporate Reels Shoot in Hyderabad | Business Video Production",
        "description": "Enhance your brand authority with corporate reels shoot in Hyderabad. Professional business videos, company profiles, team highlights, and founder interviews in HITEC City."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/corporate-reels-hyderabad#breadcrumbs",
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
            "name": "Corporate Reels",
            "item": "https://reelscale.in/corporate-reels-hyderabad"
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://reelscale.in/corporate-reels-hyderabad#localbusiness",
        "name": "ReelScale | Corporate Reels",
        "url": "https://reelscale.in/corporate-reels-hyderabad",
        "logo": "https://reelscale.in/assets/logo.png",
        "image": "https://reelscale.in/assets/logo.png",
        "telephone": "+919966239433",
        "priceRange": "₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Madhapur, HITEC City",
          "addressLocality": "Hyderabad",
          "addressRegion": "Telangana",
          "postalCode": "500081",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "17.4483",
          "longitude": "78.3741"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://reelscale.in/corporate-reels-hyderabad#faq",
        "mainEntity": data.faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <ServicePageTemplate headerHtml={headerHtml} footerHtml={footerHtml} data={data} isMainVideoProduction={true} />
    </>
  );
}
