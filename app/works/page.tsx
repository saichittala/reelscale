import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import WorksContent from "./WorksContent";
import "../../styles.css";

export const metadata: Metadata = {
  title: "Our Portfolio & Reels Case Studies | ReelScale Hyderabad",
  description: "Watch premium cinematic Instagram Reels, brand videos, and commercial campaigns created by ReelScale in Hyderabad. View our high-retention video production portfolio.",
  alternates: {
    canonical: "https://reelscale.in/works",
  },
  openGraph: {
    title: "Our Portfolio & Reels Case Studies | ReelScale Hyderabad",
    description: "Watch premium cinematic Instagram Reels, brand videos, and commercial campaigns created by ReelScale in Hyderabad. View our high-retention video production portfolio.",
    url: "https://reelscale.in/works",
    siteName: "ReelScale",
    images: ["https://reelscale.in/assets/logo.png"],
    type: "website",
  },
};

let cachedHeaderHtml: string | null = null;
let cachedWorksHtml: string | null = null;
let cachedFooterHtml: string | null = null;

function getWorksPageData() {
  if (process.env.NODE_ENV === "production" && cachedHeaderHtml && cachedWorksHtml && cachedFooterHtml) {
    return {
      headerHtml: cachedHeaderHtml,
      worksHtml: cachedWorksHtml,
      footerHtml: cachedFooterHtml,
    };
  }

  const html = readFileSync(join(process.cwd(), "index.html"), "utf8");

  // Extract Header
  const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
  let headerHtml = headerMatch ? headerMatch[0] : "";

  // Extract Works/Portfolio Section
  const worksMatch = html.match(/<section id="work"[^>]*>([\s\S]*?)<\/section>/i);
  let worksHtml = worksMatch ? worksMatch[0] : "";

  // Extract Footer
  const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
  let footerHtml = footerMatch ? footerMatch[0] : "";

  // Adjust relative links and assets
  headerHtml = headerHtml
    .replace(/href="#"/g, 'href="/"')
    .replace(/href="#work"/g, 'href="/works"')
    .replace(/href="#pricing"/g, 'href="/pricing"');

  worksHtml = worksHtml
    .replace(/\.\/assets\//g, '/assets/')
    .replace(/<a href="[^"]*" class="btn-secondary">View All Work<\/a>/gi, "")
    .replace(/<div class="work-header reveal">/gi, '<div class="work-header reveal" style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%; justify-content: center; margin-bottom: 48px;">');

  footerHtml = footerHtml
    .replace(/href="#"/g, 'href="/"')
    .replace(/href="#work"/g, 'href="/works"')
    .replace(/href="#pricing"/g, 'href="/pricing"');

  cachedHeaderHtml = headerHtml;
  cachedWorksHtml = worksHtml;
  cachedFooterHtml = footerHtml;

  return { headerHtml, worksHtml, footerHtml };
}

export default function WorksPage() {
  const { headerHtml, worksHtml, footerHtml } = getWorksPageData();

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://reelscale.in/works#webpage",
        "url": "https://reelscale.in/works",
        "name": "Portfolio | ReelScale — Reels that perform.",
        "description": "Explore our portfolio of high-retention cinematic Reels and professional video production work in Hyderabad."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/works#breadcrumbs",
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
            "name": "Works",
            "item": "https://reelscale.in/works"
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
      <WorksContent headerHtml={headerHtml} worksHtml={worksHtml} footerHtml={footerHtml} />
    </>
  );
}
