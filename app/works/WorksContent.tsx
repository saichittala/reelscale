"use client";

import LandingInteractions from "../(landing)/components/LandingInteractions";

interface WorksContentProps {
  headerHtml: string;
  worksHtml: string;
  footerHtml: string;
}

export default function WorksContent({ headerHtml, worksHtml, footerHtml }: WorksContentProps) {
  return (
    <div className="works-page-wrapper">
      <LandingInteractions />

      {/* Dynamic Header */}
      <div dangerouslySetInnerHTML={{ __html: headerHtml }} />

      <main id="main-content" style={{ padding: "160px 0 60px 0" }}>
        <div dangerouslySetInnerHTML={{ __html: worksHtml }} />
      </main>

      {/* Dynamic Footer */}
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
}
