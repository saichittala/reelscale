import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import Script from "next/script";
import LandingInteractions from "../(landing)/components/LandingInteractions";

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

  // Rewrite assets and page paths to root absolute paths
  headerHtml = headerHtml
    .replace(/src="assets\//g, 'src="/assets/')
    .replace(/href="#/g, 'href="/#')
    .replace(/href="dashboard\/login\.html"/g, 'href="/dashboard/login"');

  footerHtml = footerHtml
    .replace(/src="assets\//g, 'src="/assets/')
    .replace(/href="#/g, 'href="/#')
    .replace(/href="dashboard\/login\.html"/g, 'href="/dashboard/login"');

  cachedHeaderHtml = headerHtml;
  cachedFooterHtml = footerHtml;

  return { headerHtml, footerHtml };
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const { headerHtml, footerHtml } = getHeaderAndFooter();

  return (
    <div className="blog-page-container">
      <LandingInteractions />
      
      {/* Dynamic Header from index.html */}
      <div 
        dangerouslySetInnerHTML={{ __html: headerHtml }} 
        style={{ width: "100%", position: "fixed", top: 0, left: 0, zIndex: 1000 }}
      />
      
      {/* Blog Page Content */}
      <div style={{ minHeight: "80vh", paddingTop: "100px", paddingBottom: "60px" }}>
        {children}
      </div>

      {/* Dynamic Footer from index.html */}
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />

      <Script async src="https://www.instagram.com/embed.js" />
      <Script async src="https://www.googletagmanager.com/gtag/js?id=G-2F6CKK0MY3" />
      <Script id="google-analytics-blog">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-2F6CKK0MY3');
        `}
      </Script>
      <Script id="clarity-blog">
        {`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "wwiioh52bs");
        `}
      </Script>
    </div>
  );
}
