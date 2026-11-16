import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import AboutContent from "./AboutContent";
import { getPageSeo } from "../lib/cms";
import "../../styles.css";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("about");
  const title = seo.metaTitle || "About Us | ReelScale — Short-Form Video Production Agency in Hyderabad";
  const description =
    seo.metaDescription ||
    "Discover the team behind ReelScale, a leading reel shoot and video editing agency in Hyderabad. We write, film, and edit cinematic Instagram Reels and commercial videos that build authority and drive leads organically.";
  const canonical = seo.canonicalUrl || "https://reelscale.in/about";
  const ogImage = seo.ogImageUrl || "https://reelscale.in/assets/logo.png";

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      url: canonical,
      siteName: "ReelScale",
      images: [ogImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      images: [ogImage],
    },
  };
}

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

export default function AboutPage() {
  const { headerHtml, footerHtml } = getHeaderAndFooter();

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://reelscale.in/about#webpage",
        "url": "https://reelscale.in/about",
        "name": "About ReelScale — Building Brands People Remember",
        "description": "ReelScale creates premium short-form cinematic content engineered to generate attention, trust, and revenue for growing businesses."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/about#breadcrumbs",
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
            "name": "About Us",
            "item": "https://reelscale.in/about"
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
      <AboutContent headerHtml={headerHtml} footerHtml={footerHtml} />
    </>
  );
}
