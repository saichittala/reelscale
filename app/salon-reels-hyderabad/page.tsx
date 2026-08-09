import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import ServicePageTemplate from "../services/ServicePageTemplate";
import "../../styles.css";

export const metadata: Metadata = {
  title: "Salon Reels Production in Hyderabad | Beauty & Hair Styling Reels",
  description: "Looking for premium salon reels shoot in Hyderabad? ReelScale creates aesthetic transformation videos, before/after hair styling reels, and beauty promos.",
  alternates: {
    canonical: "https://reelscale.in/salon-reels-hyderabad",
  },
  openGraph: {
    title: "Salon Reels Production in Hyderabad | Beauty & Hair Styling Reels",
    description: "Looking for premium salon reels shoot in Hyderabad? ReelScale creates aesthetic transformation videos, before/after hair styling reels, and beauty promos.",
    url: "https://reelscale.in/salon-reels-hyderabad",
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
  "slug": "salon-reels-hyderabad",
  "keyword": "salon reels Hyderabad",
  "title": "Salon Reels Production in Hyderabad | Beauty & Hair Styling Reels",
  "desc": "Looking for premium salon reels shoot in Hyderabad? ReelScale creates aesthetic transformation videos, before/after hair styling reels, and beauty promos.",
  "name": "Salon Reels Hyderabad",
  "headline": "Premium Salon Reels Production in Hyderabad",
  "subheadline": "Fill Booking Calendars with Aesthetic Beauty & Transformation Reels",
  "introText": "In the beauty and styling industry, quality is everything. We produce stunning hair styling transformations, glowing skin therapy sessions, and premium salon walkthroughs in Jubilee Hills and Banjara Hills.",
  "benefits": [
    {
      "title": "Flawless Beauty Lighting",
      "desc": "Studio-grade soft ring lighting that highlights skin texture and hair shine perfectly."
    },
    {
      "title": "Satisfying Before/Afters",
      "desc": "Paced reveal transitions that capture the instant transformation and keep viewers scrolling."
    },
    {
      "title": "Stylist Authority",
      "desc": "Showcasing the expertise of your master stylists to make your salon the premium local choice."
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Transformation Strategy",
      "desc": "Mapping client makeovers, hair colors, and nail designs to highlight."
    },
    {
      "step": "02",
      "title": "Macro Detail Shoot",
      "desc": "Capturing close-up styling shots, scissor snips, color blending, and makeup brushes."
    },
    {
      "step": "03",
      "title": "Aesthetic Pacing",
      "desc": "Selecting soft, premium audio tracks and applying skin-glowing color correction."
    },
    {
      "step": "04",
      "title": "Booking Integration",
      "desc": "Launching reels with clear guidelines on how to book appointments on WhatsApp or DM."
    }
  ],
  "deliverables": [
    "Aesthetic Transformation Clips",
    "Before & After Reveal Reels",
    "Macro Product & Detail Shots",
    "Aesthetic Color Correction",
    "Stylist Feature Videos"
  ],
  "pricingPlan": "Salon Glow",
  "pricingPrice": "₹19,999",
  "pricingFeatures": [
    "12 Aesthetic Reels / Month",
    "On-site Beauty Direction",
    "Transformation Transition FX",
    "Color Grading & Skin Smoothing",
    "Stylist Features",
    "Unlimited Revisions"
  ],
  "faqs": [
    {
      "question": "Can you film real clients?",
      "answer": "Yes! Filming actual customer makeovers with their consent is the highest-converting form of social proof."
    },
    {
      "question": "Do you bring lighting equipment?",
      "answer": "Yes. We bring specialized softboxes and professional ring lights to ensure hair tones and styling details are perfectly lit."
    }
  ],
  "locationKeywords": [
    "Jubilee Hills",
    "Banjara Hills",
    "Madhapur",
    "Gachibowli",
    "Begumpet"
  ]
};

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://reelscale.in/salon-reels-hyderabad#webpage",
        "url": "https://reelscale.in/salon-reels-hyderabad",
        "name": "Salon Reels Production in Hyderabad | Beauty & Hair Styling Reels",
        "description": "Looking for premium salon reels shoot in Hyderabad? ReelScale creates aesthetic transformation videos, before/after hair styling reels, and beauty promos."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/salon-reels-hyderabad#breadcrumbs",
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
            "name": "Salon Reels Hyderabad",
            "item": "https://reelscale.in/salon-reels-hyderabad"
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://reelscale.in/salon-reels-hyderabad#localbusiness",
        "name": "ReelScale | Salon Reels Hyderabad",
        "url": "https://reelscale.in/salon-reels-hyderabad",
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
        "@id": "https://reelscale.in/salon-reels-hyderabad#faq",
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
