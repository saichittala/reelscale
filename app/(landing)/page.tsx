import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Script from "next/script";
import LandingInteractions from "./components/LandingInteractions";
import LatestBlogs from "./components/LatestBlogs";

export const metadata: Metadata = {
  title: "ReelScale | Premium Cinematic Reels for Rapid Brand Growth",
  description: "High-retention cinematic reels that grow your brand, increase engagement, and drive sales. Partner with Team ReelScale for expert short-form video content creation.",
  keywords: ["cinematic reels", "video agency", "short form video content", "Instagram reels agency", "TikTok growth", "content scale", "YouTube shorts editor"],
  alternates: {
    canonical: "https://reelscale.in",
  },
  openGraph: {
    title: "ReelScale | Premium Cinematic Reels for Rapid Brand Growth",
    description: "High-retention cinematic reels that grow your brand, increase engagement, and drive sales.",
    url: "https://reelscale.in",
    siteName: "ReelScale",
    images: [
      {
        url: "https://reelscale.in/assets/logo.png",
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
    images: ["https://reelscale.in/assets/logo.png"],
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
        "@id": "https://reelscale.in/#organization",
        "name": "ReelScale",
        "url": "https://reelscale.in",
        "logo": {
          "@type": "ImageObject",
          "url": "https://reelscale.in/assets/logo.png",
          "caption": "ReelScale Logo"
        },
        "sameAs": [
          "https://instagram.com/reelscale"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://reelscale.in/#website",
        "url": "https://reelscale.in",
        "name": "ReelScale",
        "publisher": {
          "@id": "https://reelscale.in/#organization"
        }
      },
      {
        "@type": "ProfessionalService",
        "@id": "https://reelscale.in/#service",
        "name": "ReelScale",
        "url": "https://reelscale.in",
        "image": "https://reelscale.in/assets/logo.png",
        "priceRange": "$$",
        "telephone": "+919966239433",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "IN"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is ReelScale?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "ReelScale is a premium cinematic short-form video content creation agency. We specialize in producing high-retention Instagram Reels, TikToks, and YouTube Shorts designed specifically to capture attention, build brand authority, and scale your client acquisition organically."
            }
          },
          {
            "@type": "Question",
            "name": "How does short-form video help grow my business?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Cinematic short-form videos capture attention within the critical first 3 seconds, building rapid trust and brand equity. Algorithms on Instagram, YouTube, and TikTok prioritize short-form videos, delivering highly targeted organic impressions to your ideal clients without expensive ad spend."
            }
          },
          {
            "@type": "Question",
            "name": "What is included in ReelScale's end-to-end service?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We manage the entire content production pipeline. This includes scriptwriting, visual asset design, high-end cinematic video editing, custom sound design, captions, hook optimization, publishing strategy, and performance analysis."
            }
          },
          {
            "@type": "Question",
            "name": "How long does it take to see results?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "While organic growth builds over time, most clients see a significant rise in video views, profile traffic, and social engagement within the first 30 days of consistent posting. Lead generation rates typically rise steadily as content authority compiles."
            }
          },
          {
            "@type": "Question",
            "name": "Do I need to film the content myself?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, but we make it completely effortless. We provide custom-written scripts, detailed recording guides (angles, lighting, pacing), and live support. You simply record the raw footage on a standard mobile device, and our production team handles the rest."
            }
          },
          {
            "@type": "Question",
            "name": "What makes cinematic reels different from standard video editing?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Unlike basic editing services that just cut clips and add generic templates, cinematic reels utilize premium color grading, seamless custom transitions, high-impact sound design, and custom typography to create an immersive visual experience that increases audience retention."
            }
          },
          {
            "@type": "Question",
            "name": "Which platforms do you optimize for?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We tailor each piece of content for Instagram Reels, YouTube Shorts, TikTok, and LinkedIn Video. We optimize the metadata, video length, title formatting, and script hooks to match the unique algorithm of each target platform."
            }
          },
          {
            "@type": "Question",
            "name": "What is your pricing model?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We offer subscription-based packages based on the monthly volume of reels you need. Check our Pricing section above to view details for the Startup, Scale, and Enterprise plans, or contact us for custom packages."
            }
          },
          {
            "@type": "Question",
            "name": "How do we get started?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Click \"Start your Reel\" to book a strategy call or send us an email. We'll hop on a quick call to audit your current brand presence, outline a tailored content pipeline, and set up your onboarding roadmap."
            }
          },
          {
            "@type": "Question",
            "name": "Do you write the video scripts for me?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Our in-house copywriters develop 100% of your scripts. Every script starts with a high-converting hook, delivers direct value to retain viewers, and ends with a strong call-to-action tailored to drive conversion goals."
            }
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
      <LandingInteractions />
      {(() => {
        const html = getLandingMarkup();
        const parts = html.split('<section id="latest-blogs-section"></section>');
        if (parts.length === 2) {
          return (
            <>
              <div dangerouslySetInnerHTML={{ __html: parts[0] }} />
              <LatestBlogs />
              <div dangerouslySetInnerHTML={{ __html: parts[1] }} />
            </>
          );
        }
        return <main dangerouslySetInnerHTML={{ __html: html }} />;
      })()}
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
