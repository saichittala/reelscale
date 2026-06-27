import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Script from "next/script";
import LandingInteractions from "./components/LandingInteractions";

export const metadata: Metadata = {
  title: "ReelScale | Premium Cinematic Reels for Rapid Brand Growth",
  description: "High-retention cinematic reels that grow your brand, increase engagement, and drive sales. Partner with Team ReelScale for expert short-form video content creation.",
  keywords: ["cinematic reels", "video agency", "short form video content", "Instagram reels agency", "TikTok growth", "content scale", "YouTube shorts editor"],
  alternates: {
    canonical: "https://reelscale.com",
  },
  openGraph: {
    title: "ReelScale | Premium Cinematic Reels for Rapid Brand Growth",
    description: "High-retention cinematic reels that grow your brand, increase engagement, and drive sales.",
    url: "https://reelscale.com",
    siteName: "ReelScale",
    images: [
      {
        url: "https://reelscale.com/assets/logo.png",
        width: 1200,
        height: 630,
        alt: "ReelScale Branding",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReelScale | Premium Cinematic Reels for Rapid Brand Growth",
    description: "High-retention cinematic reels that grow your brand, increase engagement, and drive sales.",
    images: ["https://reelscale.com/assets/logo.png"],
  },
};

let cachedLandingMarkup: string | null = null;

function getLandingMarkup() {
  if (process.env.NODE_ENV === "production" && cachedLandingMarkup) {
    return cachedLandingMarkup;
  }

  const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? "";

  const markup = body
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/href="dashboard\/login\.html"/g, 'href="dashboard/login"');

  cachedLandingMarkup = markup;
  return markup;
}

export default function Home() {
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://reelscale.com/#organization",
        "name": "ReelScale",
        "url": "https://reelscale.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://reelscale.com/assets/logo.png",
          "caption": "ReelScale Logo"
        },
        "sameAs": [
          "https://instagram.com/reelscale"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://reelscale.com/#website",
        "url": "https://reelscale.com",
        "name": "ReelScale",
        "publisher": {
          "@id": "https://reelscale.com/#organization"
        }
      },
      {
        "@type": "ProfessionalService",
        "@id": "https://reelscale.com/#service",
        "name": "ReelScale",
        "url": "https://reelscale.com",
        "image": "https://reelscale.com/assets/logo.png",
        "priceRange": "$$",
        "telephone": "+919966239433",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "IN"
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <LandingInteractions />
      <main dangerouslySetInnerHTML={{ __html: getLandingMarkup() }} />
      <Script async src="https://www.instagram.com/embed.js" />
      <Script async src="https://www.googletagmanager.com/gtag/js?id=G-2F6CKK0MY3" />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-2F6CKK0MY3');
        `}
      </Script>
      <Script id="clarity">
        {`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "wwiioh52bs");
        `}
      </Script>
    </>
  );
}
