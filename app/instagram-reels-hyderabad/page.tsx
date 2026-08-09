import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import ServicePageTemplate from "../services/ServicePageTemplate";
import "../../styles.css";

export const metadata: Metadata = {
  title: "Instagram Reels Production in Hyderabad | Professional Creators",
  description: "Want to dominate Instagram reels in Hyderabad? ReelScale creates premium, high-retention cinematic Reels that boost reach, followers, and customer inquiries.",
  alternates: {
    canonical: "https://reelscale.in/instagram-reels-hyderabad",
  },
  openGraph: {
    title: "Instagram Reels Production in Hyderabad | Professional Creators",
    description: "Want to dominate Instagram reels in Hyderabad? ReelScale creates premium, high-retention cinematic Reels that boost reach, followers, and customer inquiries.",
    url: "https://reelscale.in/instagram-reels-hyderabad",
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
  "slug": "instagram-reels-hyderabad",
  "keyword": "Instagram reels Hyderabad",
  "title": "Instagram Reels Production in Hyderabad | Professional Creators",
  "desc": "Want to dominate Instagram reels in Hyderabad? ReelScale creates premium, high-retention cinematic Reels that boost reach, followers, and customer inquiries.",
  "name": "Instagram Reels Hyderabad",
  "headline": "Dominate Instagram Reels in Hyderabad",
  "subheadline": "Build Organic Brand Authority & Scale Customer Acquisition",
  "introText": "Instagram is the absolute storefront for modern businesses. We design and shoot high-converting, premium Instagram reels in Hyderabad that build rapid trust, satisfy the algorithm, and bring buyers straight to your DM inbox.",
  "benefits": [
    {
      "title": "Instagram Safe Zone Alignment",
      "desc": "Making sure captions, text, and logos are perfectly positioned within Instagram safe zones."
    },
    {
      "title": "Viral Transition Pacing",
      "desc": "Utilising modern pacing, transitions, and audio cues to keep viewers hooked till the last second."
    },
    {
      "title": "Follower-to-Client Funnels",
      "desc": "Structured calls-to-action to convert casual organic scrollers into active leads and followers."
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Trend Research",
      "desc": "Identifying trending audio and content formats relevant to your local niche."
    },
    {
      "step": "02",
      "title": "On-site Recording",
      "desc": "Capturing high-resolution visual assets at your venue or location in Hyderabad."
    },
    {
      "step": "03",
      "title": "Premium Mobile Editing",
      "desc": "Adding custom captions, animations, sound design, and color profiles."
    },
    {
      "step": "04",
      "title": "Interactive Deployment",
      "desc": "Publishing reels with strategic pinned comments, bio-links, and local geo-locations."
    }
  ],
  "deliverables": [
    "Cinematic Vertical Video Assets",
    "Optimized Subtitle Design & Styling",
    "Instagram Algorithm Auditing",
    "Direct Lead Conversion CTAs",
    "Hashtag & Geo-Tag Setup"
  ],
  "pricingPlan": "Insta Growth",
  "pricingPrice": "₹19,999",
  "pricingFeatures": [
    "12 Reels / Month",
    "On-location Direction & Filming",
    "Viral Caption Optimization",
    "Interactive Story Ideas",
    "1 Onboarding Strategy Call",
    "Unlimited Revisions"
  ],
  "faqs": [
    {
      "question": "Will you manage my Instagram page?",
      "answer": "Yes! Under our Growth plans, we manage the scheduling, captioning, hashtag research, and community engagement for you."
    },
    {
      "question": "Do you guarantee virality?",
      "answer": "While no agency can guarantee a specific view count, our hook-driven frameworks and high production value maximize your chances of scaling reach."
    }
  ],
  "locationKeywords": [
    "Hyderabad",
    "Jubilee Hills",
    "Kukatpally",
    "Somajiguda",
    "Madhapur"
  ]
};

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://reelscale.in/instagram-reels-hyderabad#webpage",
        "url": "https://reelscale.in/instagram-reels-hyderabad",
        "name": "Instagram Reels Production in Hyderabad | Professional Creators",
        "description": "Want to dominate Instagram reels in Hyderabad? ReelScale creates premium, high-retention cinematic Reels that boost reach, followers, and customer inquiries."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/instagram-reels-hyderabad#breadcrumbs",
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
            "name": "Instagram Reels Hyderabad",
            "item": "https://reelscale.in/instagram-reels-hyderabad"
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://reelscale.in/instagram-reels-hyderabad#localbusiness",
        "name": "ReelScale | Instagram Reels Hyderabad",
        "url": "https://reelscale.in/instagram-reels-hyderabad",
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
        "@id": "https://reelscale.in/instagram-reels-hyderabad#faq",
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
