import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import GrowthContent from "./GrowthContent";
import "../../styles.css";

export const metadata: Metadata = {
  title: "Social Media Marketing & Digital Marketing Agency | ReelScale Growth",
  description: "Scale your business with ReelScale Growth, a premier digital marketing agency. We specialize in complete social media management, organic brand growth, high-converting Meta & Instagram ad campaigns, and cinematic reel production.",
  alternates: {
    canonical: "https://reelscale.in/growth",
  },
  openGraph: {
    title: "Social Media Marketing & Digital Marketing Agency | ReelScale Growth",
    description: "Scale your business with ReelScale Growth, a premier digital marketing agency. We specialize in complete social media management, organic brand growth, high-converting Meta & Instagram ad campaigns, and cinematic reel production.",
    url: "https://reelscale.in/growth",
    siteName: "ReelScale",
    images: ["https://reelscale.in/assets/logo.png"],
    type: "website",
  },
};

let cachedHeaderHtml: string | null = null;
let cachedFooterHtml: string | null = null;
let cachedTestimonialsHtml: string | null = null;
let cachedFaqHtml: string | null = null;

function getGrowthPageData() {
  if (process.env.NODE_ENV === "production" && cachedHeaderHtml && cachedFooterHtml && cachedTestimonialsHtml && cachedFaqHtml) {
    return {
      headerHtml: cachedHeaderHtml,
      footerHtml: cachedFooterHtml,
      testimonialsHtml: cachedTestimonialsHtml,
      faqHtml: cachedFaqHtml
    };
  }

  const html = readFileSync(join(process.cwd(), "index.html"), "utf8");

  // Extract Header
  const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
  let headerHtml = headerMatch ? headerMatch[0] : "";

  // Extract Testimonials
  const testimonialsMatch = html.match(/<section id="testimonials"[^>]*>([\s\S]*?)<\/section>/i);
  let testimonialsHtml = testimonialsMatch ? testimonialsMatch[0] : "";

  // Extract FAQ
  const faqMatch = html.match(/<section id="faq"[^>]*>([\s\S]*?)<\/section>/i);
  let faqHtml = faqMatch ? faqMatch[0] : "";

  // Extract Footer
  const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
  let footerHtml = footerMatch ? footerMatch[0] : "";

  // Adjust relative links for Next routing
  headerHtml = headerHtml
    .replace(/\/assets\/logo\.svg/g, '/assets/logo-green.svg')
    .replace(/href="#"/g, 'href="/"')
    .replace(/href="#work"/g, 'href="/works"')
    .replace(/href="#pricing"/g, 'href="/pricing"');

  testimonialsHtml = testimonialsHtml
    .replace(/\.\/assets\//g, '/assets/');

  faqHtml = faqHtml
    .replace(/\.\/assets\//g, '/assets/');

  footerHtml = footerHtml
    .replace(/\/assets\/logo\.svg/g, '/assets/logo-green.svg')
    .replace(/href="#"/g, 'href="/"')
    .replace(/href="#work"/g, 'href="/works"')
    .replace(/href="#pricing"/g, 'href="/pricing"');

  cachedHeaderHtml = headerHtml;
  cachedTestimonialsHtml = testimonialsHtml;
  cachedFaqHtml = faqHtml;
  cachedFooterHtml = footerHtml;

  return { headerHtml, footerHtml, testimonialsHtml, faqHtml };
}

export default function GrowthPage() {
  const { headerHtml, footerHtml, testimonialsHtml, faqHtml } = getGrowthPageData();

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://reelscale.in/growth#webpage",
        "url": "https://reelscale.in/growth",
        "name": "Social Media Marketing & Digital Marketing Agency | ReelScale Growth",
        "description": "Scale your business with ReelScale Growth, a premier digital marketing agency. We specialize in complete social media management, organic brand growth, high-converting Meta & Instagram ad campaigns, and cinematic reel production."
      },
      {
        "@type": "ProfessionalService",
        "@id": "https://reelscale.in/#service",
        "name": "ReelScale Growth",
        "image": "https://reelscale.in/assets/logo.png",
        "url": "https://reelscale.in/growth",
        "telephone": "+919966239433",
        "priceRange": "$$",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Hyderabad",
          "addressRegion": "Telangana",
          "addressCountry": "IN"
        },
        "sameAs": [
          "https://www.instagram.com/reelscale.in"
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/growth#breadcrumbs",
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
            "name": "Growth",
            "item": "https://reelscale.in/growth"
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
      <GrowthContent
        headerHtml={headerHtml}
        footerHtml={footerHtml}
      />
    </>
  );
}
