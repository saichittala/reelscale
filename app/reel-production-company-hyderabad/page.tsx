import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import ServicePageTemplate from "../services/ServicePageTemplate";
import "../../styles.css";

export const metadata: Metadata = {
  title: "Reel Production Company in Hyderabad | Professional Video Agency",
  description: "Partner with the premium reel production company in Hyderabad. End-to-end filming, editing, and sound design for brands and businesses in Hitech City, Jubilee Hills, and Gachibowli.",
  alternates: {
    canonical: "https://reelscale.in/reel-production-company-hyderabad",
  },
  openGraph: {
    title: "Reel Production Company in Hyderabad | Professional Video Agency",
    description: "Partner with the premium reel production company in Hyderabad. End-to-end filming, editing, and sound design for brands and businesses in Hitech City, Jubilee Hills, and Gachibowli.",
    url: "https://reelscale.in/reel-production-company-hyderabad",
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
  "slug": "reel-production-company-hyderabad",
  "keyword": "reel production company Hyderabad",
  "title": "Reel Production Company in Hyderabad | ReelScale",
  "desc": "ReelScale is the leading reel production company in Hyderabad. We deliver end-to-end cinematic corporate reels, commercial video ads, and short-form content scaling.",
  "name": "Reel Production Company",
  "headline": "Leading Reel Production Company in Hyderabad",
  "subheadline": "The End-to-End Content Agency for High-Retention Video Marketing",
  "introText": "We help ambitious brands, salons, restaurants, and real estate developers scale organically. As the premier reel production agency in Hyderabad, we coordinate strategy, crew, editing, and deployment under one premium roof.",
  "benefits": [
    {
      "title": "Full Production Pipeline",
      "desc": "No outsourcing. We manage scriptwriters, videographers, directors, and professional editors internally."
    },
    {
      "title": "Productised Delivery",
      "desc": "Reliable weekly deliverables, constant communication, and priority delivery options."
    },
    {
      "title": "High-Retention Formatting",
      "desc": "Pacing, subtitles, sound design, and hooks optimized for Instagram and YouTube algorithms."
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Strategy & Mapping",
      "desc": "Auditing your niche, competitors, and defining high-performing hooks."
    },
    {
      "step": "02",
      "title": "Cinematic Filming",
      "desc": "Directing shoots using premium camera kits, stabilizer rigs, and sound gear."
    },
    {
      "step": "03",
      "title": "Visual Post-Production",
      "desc": "Editing with professional transitions, text graphics, and background scores."
    },
    {
      "step": "04",
      "title": "Performance Analysis",
      "desc": "Tracking views, click-through rates, and optimizing the next batch of concepts."
    }
  ],
  "deliverables": [
    "Professional Brand Video Production",
    "Social Media Pacing & Subtitles",
    "Advanced Audio EQ & Mixing",
    "Competitor Video Analysis",
    "Publishing Strategy & Hashtag Audits"
  ],
  "pricingPlan": "Agency Scale",
  "pricingPrice": "₹24,999",
  "pricingFeatures": [
    "16 Professional Reels / Month",
    "Full On-site Crew & Videography",
    "Premium Storytelling Scripts",
    "Advanced Sound Effects & Motion Graphics",
    "Priority Support & Unlimited Revisions",
    "2 Monthly Strategy Calls"
  ],
  "faqs": [
    {
      "question": "Why choose ReelScale over a freelance editor?",
      "answer": "We handle everything from strategy and scriptwriting to camera direction, lighting, and performance audits, saving your team 15+ hours weekly."
    },
    {
      "question": "What video formats do you support?",
      "answer": "We specialize in vertical short-form (9:16) for Instagram Reels, YouTube Shorts, and TikTok, alongside horizontal corporate video assets."
    }
  ],
  "locationKeywords": [
    "Hyderabad",
    "HITEC City",
    "Kondapur",
    "Begumpet",
    "Secunderabad"
  ],
  "knowledgeHub": [
    {
      "heading": "Why Work with a Dedicated Reel Production Company in Hyderabad",
      "text": "Short-form video is highly strategic. As the leading reel production company in Hyderabad, we merge copywriting, professional direction, cinematic lighting, and custom sound design to turn views into active business leads in Gachibowli, Madhapur, and Hitech City."
    },
    {
      "heading": "End-to-End Vertical and Horizontal Video Production",
      "text": "While we specialize in high-retention vertical short-form content (9:16) for Instagram Reels and YouTube Shorts, we also produce premium horizontal corporate video assets, founder interviews, and commercial video ads."
    },
    {
      "heading": "Topical Authority & Video SEO for Social Algorithms",
      "text": "Every video is optimized with clean subtitle placements, correct pacing to maximize average watch time, and local hashtags, ensuring your brand establishes dominant topical authority across search and social platforms."
    }
  ]
};

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://reelscale.in/reel-production-company-hyderabad#webpage",
        "url": "https://reelscale.in/reel-production-company-hyderabad",
        "name": "Reel Production Company in Hyderabad | ReelScale",
        "description": "ReelScale is the leading reel production company in Hyderabad. We deliver end-to-end cinematic corporate reels, commercial video ads, and short-form content scaling."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/reel-production-company-hyderabad#breadcrumbs",
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
            "name": "Reel Production Company",
            "item": "https://reelscale.in/reel-production-company-hyderabad"
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://reelscale.in/reel-production-company-hyderabad#localbusiness",
        "name": "ReelScale | Reel Production Company",
        "url": "https://reelscale.in/reel-production-company-hyderabad",
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
        "@id": "https://reelscale.in/reel-production-company-hyderabad#faq",
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
