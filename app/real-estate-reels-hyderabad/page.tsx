import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import ServicePageTemplate from "../services/ServicePageTemplate";
import "../../styles.css";

export const metadata: Metadata = {
  title: "Real Estate Reels & Property Video Production in Hyderabad | ReelScale",
  description: "Sell properties faster with cinematic real estate reels in Hyderabad. Professional villa walkthroughs, property reels shoots, and broker branding in Gachibowli, Kondapur, and Financial District.",
  alternates: {
    canonical: "https://reelscale.in/real-estate-reels-hyderabad",
  },
  openGraph: {
    title: "Real Estate Reels & Property Video Production in Hyderabad | ReelScale",
    description: "Sell properties faster with cinematic real estate reels in Hyderabad. Professional villa walkthroughs, property reels shoots, and broker branding in Gachibowli, Kondapur, and Financial District.",
    url: "https://reelscale.in/real-estate-reels-hyderabad",
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
  "slug": "real-estate-reels-hyderabad",
  "keyword": "real estate reels Hyderabad",
  "title": "Real Estate Reels in Hyderabad | Luxury Property Video Agency",
  "desc": "Sell properties faster with cinematic real estate reels in Hyderabad. Luxury property walkthroughs, apartment promos, and villa videography in Gachibowli and Financial District.",
  "name": "Real Estate Reels",
  "headline": "Real Estate Reels in Hyderabad",
  "subheadline": "Cinematic Property Walkthroughs that Sell Villas & Apartments Faster",
  "introText": "Real estate is about luxury, layout, and lifestyle. We capture sweepingly smooth apartment tours, premium villa elevation shots, and community amenities to attract high-intent property buyers in Gachibowli, Kokapet, and Financial District.",
  "benefits": [
    {
      "title": "Drone Elevation Views",
      "desc": "Capturing stunning aerial perspective shots of the property elevation and community layouts."
    },
    {
      "title": "Highlighting Amenities",
      "desc": "Filming clubhouses, swimming pools, fitness zones, and green spaces to sell the lifestyle."
    },
    {
      "title": "High-Intent CTAs",
      "desc": "Adding clear contact routes to drive direct inquiries to your sales office or agents."
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Property Blueprinting",
      "desc": "Selecting key highlights: view from the balcony, kitchen details, and master suite."
    },
    {
      "step": "02",
      "title": "Cinematic Property Shoot",
      "desc": "Filming with wide-angle gimbals, detailed sliders, and high-dynamic-range cameras."
    },
    {
      "step": "03",
      "title": "Luxury Paced Edits",
      "desc": "Syncing to aspirational music, adding size/price text overlay, and color grading."
    },
    {
      "step": "04",
      "title": "Lead Generation Launch",
      "desc": "Deploying with optimized call-to-actions, local real estate tags, and enquiry links."
    }
  ],
  "deliverables": [
    "Cinematic Wide-Angle Property Tours",
    "balcony view & elevation clips",
    "Amenity & Clubhouse Walkthroughs",
    "Price & Layout Overlay Text",
    "Aspirational Background Scoring"
  ],
  "pricingPlan": "Property Scale",
  "pricingPrice": "₹19,999",
  "pricingFeatures": [
    "12 Real Estate Reels / Month",
    "Wide-Angle Stabilized Camera Tours",
    "Drone Aerial Filming Options",
    "Layout Stats Overlay Graphics",
    "Aspirational LUT Color Grading",
    "Unlimited Revisions"
  ],
  "faqs": [
    {
      "question": "Do you provide drone footage?",
      "answer": "Yes! We have certified drone pilots to capture premium aerial angles of your villa project or apartment community."
    },
    {
      "question": "Can agents present the property on-camera?",
      "answer": "Highly recommended! Having an agent present the home builds personal trust and guides the buyer through the property."
    }
  ],
  "locationKeywords": [
    "Gachibowli",
    "Kokapet",
    "Financial District",
    "Narsingi",
    "Madhapur"
  ],
  "knowledgeHub": [
    {
      "heading": "How Real Estate Reels Drive Property Sales in Hyderabad",
      "text": "For real estate brokers and developers in premium Hyderabad areas like Kokapet, Gachibowli, and Financial District, video is the ultimate sales tool. Cinematic property reels allow prospective buyers to tour a villa or apartment virtually, highlighting key selling points and layout features."
    },
    {
      "heading": "Professional Property Walkthroughs & Drone Videography",
      "text": "High-quality real estate video production utilizes wide-angle lenses, stabilizer rigs, and drone aerial footage. This reveals the scale of the community, building amenities, and luxury architectural details, attracting serious buyers."
    },
    {
      "heading": "Personal Branding for Real Estate Brokers",
      "text": "Reels that feature the broker presenting the home build deep personal trust. Our scripts and professional sound editing ensure you present properties with clarity, establishing authority in the Hyderabad real estate market."
    }
  ]
};

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://reelscale.in/real-estate-reels-hyderabad#webpage",
        "url": "https://reelscale.in/real-estate-reels-hyderabad",
        "name": "Real Estate Reels in Hyderabad | Luxury Property Video Agency",
        "description": "Sell properties faster with cinematic real estate reels in Hyderabad. Luxury property walkthroughs, apartment promos, and villa videography in Gachibowli and Financial District."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/real-estate-reels-hyderabad#breadcrumbs",
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
            "name": "Real Estate Reels",
            "item": "https://reelscale.in/real-estate-reels-hyderabad"
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://reelscale.in/real-estate-reels-hyderabad#localbusiness",
        "name": "ReelScale | Real Estate Reels",
        "url": "https://reelscale.in/real-estate-reels-hyderabad",
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
        "@id": "https://reelscale.in/real-estate-reels-hyderabad#faq",
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
