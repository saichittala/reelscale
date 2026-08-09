import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import PricingContent from "./PricingContent";
import "../../styles.css";

export const metadata: Metadata = {
  title: "Pricing | ReelScale — Simple. Scalable. No surprises.",
  description: "View our simple and scalable pricing plans for cinematic Instagram Reels and professional short-form video production services.",
  alternates: {
    canonical: "https://reelscale.in/pricing",
  },
  openGraph: {
    title: "Pricing | ReelScale — Simple. Scalable. No surprises.",
    description: "View our simple and scalable pricing plans for cinematic Instagram Reels and professional short-form video production services.",
    url: "https://reelscale.in/pricing",
    siteName: "ReelScale",
    images: ["https://reelscale.in/assets/logo.png"],
    type: "website",
  },
};

let cachedHeaderHtml: string | null = null;
let cachedPricingHtml: string | null = null;
let cachedFooterHtml: string | null = null;

function getPricingPageData() {
  if (process.env.NODE_ENV === "production" && cachedHeaderHtml && cachedPricingHtml && cachedFooterHtml) {
    return {
      headerHtml: cachedHeaderHtml,
      pricingHtml: cachedPricingHtml,
      footerHtml: cachedFooterHtml,
    };
  }

  const html = readFileSync(join(process.cwd(), "index.html"), "utf8");

  // Extract Header
  const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
  let headerHtml = headerMatch ? headerMatch[0] : "";

  // Extract Pricing Section
  const pricingMatch = html.match(/<section id="pricing"[^>]*>([\s\S]*?)<\/section>/i);
  let pricingHtml = pricingMatch ? pricingMatch[0] : "";

  // Extract Footer
  const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
  let footerHtml = footerMatch ? footerMatch[0] : "";

  // Adjust relative links and assets
  headerHtml = headerHtml
    .replace(/href="#"/g, 'href="/"')
    .replace(/href="#work"/g, 'href="/works"')
    .replace(/href="#pricing"/g, 'href="/pricing"');

  pricingHtml = pricingHtml
    .replace(/\.\/assets\//g, '/assets/');

  footerHtml = footerHtml
    .replace(/href="#"/g, 'href="/"')
    .replace(/href="#work"/g, 'href="/works"')
    .replace(/href="#pricing"/g, 'href="/pricing"');

  cachedHeaderHtml = headerHtml;
  cachedPricingHtml = pricingHtml;
  cachedFooterHtml = footerHtml;

  return { headerHtml, pricingHtml, footerHtml };
}

export default function PricingPage() {
  const { headerHtml, pricingHtml, footerHtml } = getPricingPageData();

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://reelscale.in/pricing#webpage",
        "url": "https://reelscale.in/pricing",
        "name": "Pricing | ReelScale — Simple. Scalable. No surprises.",
        "description": "View our simple and scalable pricing plans for cinematic Instagram Reels and professional short-form video production services."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/pricing#breadcrumbs",
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
            "name": "Pricing",
            "item": "https://reelscale.in/pricing"
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <PricingContent headerHtml={headerHtml} pricingHtml={pricingHtml} footerHtml={footerHtml} />
    </>
  );
}
