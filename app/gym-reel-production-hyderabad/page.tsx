import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import ServicePageTemplate from "../services/ServicePageTemplate";
import "../../styles.css";

export const metadata: Metadata = {
  title: "Gym Reel Production in Hyderabad | Fitness Video Agency",
  description: "Boost gym memberships with premium gym reel production in Hyderabad. High-energy fitness video production for fitness centers, gyms, and personal trainers.",
  alternates: {
    canonical: "https://reelscale.in/gym-reel-production-hyderabad",
  },
  openGraph: {
    title: "Gym Reel Production in Hyderabad | Fitness Video Agency",
    description: "Boost gym memberships with premium gym reel production in Hyderabad. High-energy fitness video production for fitness centers, gyms, and personal trainers.",
    url: "https://reelscale.in/gym-reel-production-hyderabad",
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
  "slug": "gym-reel-production-hyderabad",
  "keyword": "gym reel production Hyderabad",
  "title": "Gym Reel Production in Hyderabad | Fitness Video Agency",
  "desc": "Boost gym memberships with premium gym reel production in Hyderabad. High-energy fitness video production for fitness centers, gyms, and personal trainers.",
  "name": "Gym Reel Production",
  "headline": "Gym & Fitness Reel Production in Hyderabad",
  "subheadline": "Drive Gym Memberships with High-Energy Fitness Content",
  "introText": "Fitness is visual and motivational. We capture the sweat, the heavy lifts, and the raw energy of your gym to turn casual viewers into gym members in HITEC City, Gachibowli, and Kondapur.",
  "benefits": [
    {
      "title": "High-Energy Pacing",
      "desc": "Dynamic timing matched to hard-hitting audio tracks that fire up viewers."
    },
    {
      "title": "Premium Gear & Lighting",
      "desc": "Using specialized cameras and dynamic stabilizers to capture athletic motion smoothly."
    },
    {
      "title": "Trainer Spotlights",
      "desc": "Positioning your trainers as local authority figures to build trust with prospects."
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Creative Fit Audit",
      "desc": "Selecting core workouts, high-intensity exercises, and trainers to highlight."
    },
    {
      "step": "02",
      "title": "High-Speed Shoot",
      "desc": "Capturing cinematic slow-motion lifts, group energy classes, and facility walkthroughs."
    },
    {
      "step": "03",
      "title": "Hard-Cut Video Edit",
      "desc": "Fast-paced edits, beat syncing, deep bass boosts, and clean fitness typography."
    },
    {
      "step": "04",
      "title": "Membership Call",
      "desc": "Deploying with optimized call-to-actions to drive signups and local inquiries."
    }
  ],
  "deliverables": [
    "High-Intensity Gym Action Videos",
    "Slow-Motion Transition Effects",
    "Beat-Synced Professional Edits",
    "Trainer Highlight Reels",
    "Local Fitness SEO Hashtags"
  ],
  "pricingPlan": "Fitness Scale",
  "pricingPrice": "₹19,999",
  "pricingFeatures": [
    "12 Gym Reels / Month",
    "On-site Fitness Direction",
    "Cinema Paced Pacing",
    "ASMR Gym Sound Editing",
    "Trainer Spotlights",
    "Unlimited Revisions"
  ],
  "faqs": [
    {
      "question": "Do you shoot real members or models?",
      "answer": "We can shoot either. Highlighting your real gym members and coaches builds authentic community trust, but we can work with models if preferred."
    },
    {
      "question": "How much space do you need to film?",
      "answer": "We are experienced in working in active gym environments. We use compact, mobile gear to prevent any disruption to your members."
    }
  ],
  "locationKeywords": [
    "Gachibowli",
    "Kondapur",
    "Madhapur",
    "Jubilee Hills",
    "Kukatpally"
  ]
};

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://reelscale.in/gym-reel-production-hyderabad#webpage",
        "url": "https://reelscale.in/gym-reel-production-hyderabad",
        "name": "Gym Reel Production in Hyderabad | Fitness Video Agency",
        "description": "Boost gym memberships with premium gym reel production in Hyderabad. High-energy fitness video production for fitness centers, gyms, and personal trainers."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/gym-reel-production-hyderabad#breadcrumbs",
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
            "name": "Gym Reel Production",
            "item": "https://reelscale.in/gym-reel-production-hyderabad"
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://reelscale.in/gym-reel-production-hyderabad#localbusiness",
        "name": "ReelScale | Gym Reel Production",
        "url": "https://reelscale.in/gym-reel-production-hyderabad",
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
        "@id": "https://reelscale.in/gym-reel-production-hyderabad#faq",
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
