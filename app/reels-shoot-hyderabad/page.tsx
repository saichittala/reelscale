import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import ServicePageTemplate from "../services/ServicePageTemplate";
import "../../styles.css";

export const metadata: Metadata = {
  title: "Reels Shoot in Hyderabad | Professional Instagram Reels Shoot",
  description: "Looking for a professional reels shoot in Hyderabad? ReelScale offers cinematic short-form video shoots, professional lighting, and scriptwriting in Madhapur, Gachibowli, and Jubilee Hills.",
  alternates: {
    canonical: "https://reelscale.in/reels-shoot-hyderabad",
  },
  openGraph: {
    title: "Reels Shoot in Hyderabad | Professional Instagram Reels Shoot",
    description: "Looking for a professional reels shoot in Hyderabad? ReelScale offers cinematic short-form video shoots, professional lighting, and scriptwriting in Madhapur, Gachibowli, and Jubilee Hills.",
    url: "https://reelscale.in/reels-shoot-hyderabad",
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
  "slug": "reels-shoot-hyderabad",
  "keyword": "reels shoot Hyderabad",
  "title": "Reels Shoot in Hyderabad | Professional Instagram Reels Shoot",
  "desc": "Looking for a professional reels shoot in Hyderabad? ReelScale offers cinematic short-form video shoots, professional lighting, and scriptwriting in Madhapur, Gachibowli, and Jubilee Hills.",
  "name": "Reels Shoot Hyderabad",
  "headline": "Professional Reels Shoot in Hyderabad",
  "subheadline": "Capture Attention & Grow Your Business with Cinematic Reels",
  "introText": "Ready to stand out on social media? We organize complete, premium reels shoots in Hyderabad. From scriptwriting to high-end filming in HITEC City, Gachibowli, and Jubilee Hills, we make sure every reel is engineered to go viral.",
  "benefits": [
    {
      "title": "Cinema-Grade Production",
      "desc": "Shot on 4K cameras with professional three-point lighting and isolated studio audio."
    },
    {
      "title": "Local Landmark Placement",
      "desc": "Integrating recognisable Hyderabad hotspots to boost local community engagement."
    },
    {
      "title": "Hook-Body-Payoff Scripts",
      "desc": "Custom written scripts by professional copywriters designed to capture attention in 1.5 seconds."
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Script & Concept Design",
      "desc": "Developing high-converting hooks tailored to your target Hyderabad audience."
    },
    {
      "step": "02",
      "title": "On-Site Filming Shoot",
      "desc": "Professional 2-3 hour shoot with wireless lapel microphones and multi-angle camera setups."
    },
    {
      "step": "03",
      "title": "Viral Pace Video Editing",
      "desc": "Fast-paced cuts, sound design, color correction, and visual subtitle placement."
    },
    {
      "step": "04",
      "title": "SEO Optimized Launch",
      "desc": "Deploying with optimized local hashtags, geo-locations, and publishing schedules."
    }
  ],
  "deliverables": [
    "12 Edited Cinematic Reels / Month",
    "Custom Copywritten Scripts",
    "Professional Lighting & Microphones",
    "Pattern Interrupt Sound Effects",
    "Vocal Enhancement & Color Grading"
  ],
  "pricingPlan": "Reels Pro Shoot",
  "pricingPrice": "₹19,999",
  "pricingFeatures": [
    "12 Custom Reels / Month",
    "On-site Direction (3 Hours)",
    "Professional Lighting & Audio",
    "High-End Video Editing",
    "Unlimited Revisions",
    "1 Strategy Call / Month"
  ],
  "faqs": [
    {
      "question": "Where do the shoots take place?",
      "answer": "We conduct shoots at your business location, studio, or scenic landmarks across Gachibowli, Madhapur, Jubilee Hills, and Banjara Hills."
    },
    {
      "question": "Do you provide the scripts?",
      "answer": "Yes! Our copywriters write 100% of your scripts before the shoot, complete with visual hooks and calls-to-action."
    },
    {
      "question": "How fast is the delivery?",
      "answer": "Our standard delivery is within 3-5 days. Priority editing options are available for same-week launches."
    }
  ],
  "locationKeywords": [
    "Madhapur",
    "Gachibowli",
    "Jubilee Hills",
    "Banjara Hills",
    "HITEC City"
  ]
};

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://reelscale.in/reels-shoot-hyderabad#webpage",
        "url": "https://reelscale.in/reels-shoot-hyderabad",
        "name": "Reels Shoot in Hyderabad | Professional Instagram Reels Shoot",
        "description": "Looking for a professional reels shoot in Hyderabad? ReelScale offers cinematic short-form video shoots, professional lighting, and scriptwriting in Madhapur, Gachibowli, and Jubilee Hills."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/reels-shoot-hyderabad#breadcrumbs",
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
            "name": "Reels Shoot Hyderabad",
            "item": "https://reelscale.in/reels-shoot-hyderabad"
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://reelscale.in/reels-shoot-hyderabad#localbusiness",
        "name": "ReelScale | Reels Shoot Hyderabad",
        "url": "https://reelscale.in/reels-shoot-hyderabad",
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
        "@id": "https://reelscale.in/reels-shoot-hyderabad#faq",
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
