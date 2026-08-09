import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import ServicePageTemplate from "../services/ServicePageTemplate";
import "../../styles.css";

export const metadata: Metadata = {
  title: "Interior Design Reels in Hyderabad | Luxury Home Walkthroughs",
  description: "Showcase your architectural design work with premium interior reels in Hyderabad. Real estate and interior design walkthrough videos by ReelScale.",
  alternates: {
    canonical: "https://reelscale.in/interior-reels-hyderabad",
  },
  openGraph: {
    title: "Interior Design Reels in Hyderabad | Luxury Home Walkthroughs",
    description: "Showcase your architectural design work with premium interior reels in Hyderabad. Real estate and interior design walkthrough videos by ReelScale.",
    url: "https://reelscale.in/interior-reels-hyderabad",
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
  "slug": "interior-reels-hyderabad",
  "keyword": "interior reels Hyderabad",
  "title": "Interior Design Reels in Hyderabad | Luxury Home Walkthroughs",
  "desc": "Showcase your architectural design work with premium interior reels in Hyderabad. Real estate and interior design walkthrough videos by ReelScale.",
  "name": "Interior Reels Hyderabad",
  "headline": "Interior Design Reels in Hyderabad",
  "subheadline": "Stunning Home Walkthroughs that Showcase Architectural Craftsmanship",
  "introText": "Interior design is about detail, space, and premium materials. We produce cinematic, smooth walkthrough reels that highlight your design choices, custom furniture, and spatial planning in Madhapur and Jubilee Hills.",
  "benefits": [
    {
      "title": "Ultra-Smooth Stabilisation",
      "desc": "Using professional gimbal systems to deliver sweepingly smooth, architectural room tours."
    },
    {
      "title": "Material Detail Highlights",
      "desc": "Macro focus on premium textures, wood grains, custom marble, and soft lighting fixtures."
    },
    {
      "title": "Designer Portfolio Scale",
      "desc": "Transforming finished project handovers into high-end marketing assets that attract premium clients."
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Layout Walkthrough",
      "desc": "Planning the best angles, natural light windows, and key rooms to highlight."
    },
    {
      "step": "02",
      "title": "Cinematic Gimbal Shoot",
      "desc": "Capturing clean, slow-panned room entries, transit corridors, and detail close-ups."
    },
    {
      "step": "03",
      "title": "Premium Music Sync",
      "desc": "Editing with elegant background music, seamless transitions, and clean project stats."
    },
    {
      "step": "04",
      "title": "Client Conversion launch",
      "desc": "Deploying reels targeting high-net-worth homeowners and real estate developers."
    }
  ],
  "deliverables": [
    "Cinematic Room Tour Walkthroughs",
    "Macro Material Texture Clips",
    "Smooth Gimbal Interior Tours",
    "Elegant Subtitle Annotations",
    "Premium Color Correction (LUTs)"
  ],
  "pricingPlan": "Design Showcase",
  "pricingPrice": "₹19,999",
  "pricingFeatures": [
    "12 Interior Walkthroughs / Month",
    "Ultra-Smooth Gimbal Videography",
    "Aesthetic Architectural Editing",
    "Elegant Font Styling",
    "Natural Light LUT Grading",
    "Unlimited Revisions"
  ],
  "faqs": [
    {
      "question": "Should the site be staged before filming?",
      "answer": "Absolutely. For the best visual results, rooms should be fully staged, cleaned, and decluttered, with all lighting elements working."
    },
    {
      "question": "Do you offer voiceover options?",
      "answer": "Yes! We can record a clean voiceover describing your design process, choices, and material selections to add educational value."
    }
  ],
  "locationKeywords": [
    "Madhapur",
    "Jubilee Hills",
    "Gachibowli",
    "Banjara Hills",
    "Financial District"
  ]
};

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://reelscale.in/interior-reels-hyderabad#webpage",
        "url": "https://reelscale.in/interior-reels-hyderabad",
        "name": "Interior Design Reels in Hyderabad | Luxury Home Walkthroughs",
        "description": "Showcase your architectural design work with premium interior reels in Hyderabad. Real estate and interior design walkthrough videos by ReelScale."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/interior-reels-hyderabad#breadcrumbs",
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
            "name": "Interior Reels Hyderabad",
            "item": "https://reelscale.in/interior-reels-hyderabad"
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://reelscale.in/interior-reels-hyderabad#localbusiness",
        "name": "ReelScale | Interior Reels Hyderabad",
        "url": "https://reelscale.in/interior-reels-hyderabad",
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
        "@id": "https://reelscale.in/interior-reels-hyderabad#faq",
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
