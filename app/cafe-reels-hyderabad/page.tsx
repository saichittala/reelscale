import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import ServicePageTemplate from "../services/ServicePageTemplate";
import { getLocationPageBySlug } from "../lib/cms";
import "../../styles.css";

const SLUG = "cafe-reels-hyderabad";

export async function generateMetadata(): Promise<Metadata> {
  const cmsLocation = await getLocationPageBySlug(SLUG);
  const title = cmsLocation?.seo?.metaTitle || "Cafe Reels & Restaurant Video Production in Hyderabad | ReelScale";
  const description =
    cmsLocation?.seo?.metaDescription ||
    "Drive restaurant walk-ins with cinematic cafe reels in Hyderabad. Professional food shoots, cafe promos, and mouthwatering food reels production in Banjara Hills, Jubilee Hills, and Hitech City.";
  const canonical = cmsLocation?.seo?.canonicalUrl || "https://reelscale.in/cafe-reels-hyderabad";
  const ogImage = cmsLocation?.seo?.ogImageUrl || "https://reelscale.in/assets/logo.png";

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "ReelScale",
      images: [ogImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

export default async function SEOPage() {
  const { headerHtml, footerHtml } = getHeaderAndFooter();
  const cmsLocation = await getLocationPageBySlug(SLUG);

  const baseData = {
  "slug": "cafe-reels-hyderabad",
  "keyword": "cafe reels Hyderabad",
  "title": "Cafe Reels Production in Hyderabad | Cafe Video Marketing",
  "desc": "Create viral cafe reels in Hyderabad. ReelScale shoots aesthetic coffee pours, satisfying dessert plating, and cozy interior videos that drive weekend foot traffic.",
  "name": "Cafe Reels Hyderabad",
  "headline": "Cafe Reels Production in Hyderabad",
  "subheadline": "Cozy Aesthetics & Satisfying Coffee Pours that Drive Foot Traffic",
  "introText": "Cafes are about vibe, aesthetic, and taste. We shoot satisfying espresso extractions, latte art pours, and relaxing cafe interiors to make your venue the next viral weekend spot in Jubilee Hills, Madhapur, and Gachibowli.",
  "benefits": [
    {
      "title": "Cozy Visual Grading",
      "desc": "Warm, cozy color profiles that capture the unique atmosphere and comfort of your cafe."
    },
    {
      "title": "Coffee ASMR audio",
      "desc": "Crisp, isolated audio recording of coffee grinding, espresso dripping, and milk steaming."
    },
    {
      "title": "Weekend Vibe Highlights",
      "desc": "Positioning your space as the ideal workspace, date venue, or friendly meetup spot."
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Vibe Curation",
      "desc": "Identifying your signature drinks, popular desserts, and photogenic corners."
    },
    {
      "step": "02",
      "title": "Latte & Plating Shoot",
      "desc": "Recording macro details of coffee preparation, milk pours, and dessert toppings."
    },
    {
      "step": "03",
      "title": "Lo-Fi Chill Edits",
      "desc": "Editing with relaxing lo-fi background beats, smooth speed-ramps, and clean text."
    },
    {
      "step": "04",
      "title": "Weekend Promo Launch",
      "desc": "Releasing content before Friday to maximize weekend visits from local foodies."
    }
  ],
  "deliverables": [
    "Espresso Pour & Latte Art Clips",
    "Cafe Aesthetic Walkthroughs",
    "Signature Drink Promos",
    "Crisp Coffee Grinding ASMR Audio",
    "Local Geo-Targeted Hashtags"
  ],
  "pricingPlan": "Cafe Vibe",
  "pricingPrice": "₹19,999",
  "pricingFeatures": [
    "12 Cafe Reels / Month",
    "On-site Beverage Direction",
    "ASMR Microphones Included",
    "Cozy Warm Color Grading",
    "Signature Menu Highlights",
    "Unlimited Revisions"
  ],
  "faqs": [
    {
      "question": "When is the best time to shoot?",
      "answer": "We typically schedule shoots in the early morning before opening or during slower weekday hours to capture clean shots without disturbing guests."
    },
    {
      "question": "Do you create reels for seasonal menu launches?",
      "answer": "Yes! We can structure your monthly package around seasonal drinks, festival specials, or menu updates."
    }
  ],
  "locationKeywords": [
    "Jubilee Hills",
    "Madhapur",
    "Gachibowli",
    "Film Nagar",
    "Banjara Hills"
  ],
  "knowledgeHub": [
    {
      "heading": "How Cafe Reels Drive Restaurant Walk-ins in Hyderabad",
      "text": "For cafes in trendy hotspots like Jubilee Hills, Madhapur, and Banjara Hills, visual appeal is everything. Cinematic cafe reels highlighting coffee pours, aesthetic plating, and cozy decor build mouthwatering anticipation, encouraging foodies and weekend crowds to visit."
    },
    {
      "heading": "The ROI of Professional Food Videography",
      "text": "Using professional macro lenses and stabilized cameras, we capture steam, sizzles, and textures that smartphone cameras miss. Beat-synced food preparation transitions maximize viewer retention, leading to higher engagement and social shares."
    },
    {
      "heading": "Custom Menu Highlight & Signature Dish Shoots",
      "text": "We design and film specialized reel content around your signature dishes, seasonal menu upgrades, or festive specials. Every shoot includes optimized copywritten scripts, hooks, and local food blogger hashtags."
    }
  ]
};

  const data = cmsLocation
    ? {
        ...baseData,
        headline: cmsLocation.headline || baseData.headline,
        subheadline: cmsLocation.subheadline || baseData.subheadline,
        introText: cmsLocation.introText || baseData.introText,
        benefits: cmsLocation.benefits && cmsLocation.benefits.length > 0 ? cmsLocation.benefits : baseData.benefits,
        process: cmsLocation.process && cmsLocation.process.length > 0 ? cmsLocation.process : baseData.process,
        deliverables: cmsLocation.deliverables && cmsLocation.deliverables.length > 0 ? cmsLocation.deliverables : baseData.deliverables,
        pricingPlan: cmsLocation.pricingPlan || baseData.pricingPlan,
        pricingPrice: cmsLocation.pricingPrice || baseData.pricingPrice,
        pricingFeatures: cmsLocation.pricingFeatures && cmsLocation.pricingFeatures.length > 0 ? cmsLocation.pricingFeatures : baseData.pricingFeatures,
        faqs: cmsLocation.faqs && cmsLocation.faqs.length > 0 ? cmsLocation.faqs : baseData.faqs,
      }
    : baseData;

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://reelscale.in/cafe-reels-hyderabad#webpage",
        "url": "https://reelscale.in/cafe-reels-hyderabad",
        "name": "Cafe Reels Production in Hyderabad | Cafe Video Marketing",
        "description": "Create viral cafe reels in Hyderabad. ReelScale shoots aesthetic coffee pours, satisfying dessert plating, and cozy interior videos that drive weekend foot traffic."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/cafe-reels-hyderabad#breadcrumbs",
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
            "name": "Cafe Reels Hyderabad",
            "item": "https://reelscale.in/cafe-reels-hyderabad"
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://reelscale.in/cafe-reels-hyderabad#localbusiness",
        "name": "ReelScale | Cafe Reels Hyderabad",
        "url": "https://reelscale.in/cafe-reels-hyderabad",
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
        "@id": "https://reelscale.in/cafe-reels-hyderabad#faq",
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
