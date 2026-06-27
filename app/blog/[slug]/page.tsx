import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  getPublishedBlogs, 
  getReadingTime, 
  getRelatedPosts, 
  generateTableOfContents, 
  parseMarkdown 
} from "../../lib/blog";
import BlogLayout from "../BlogLayout";
import BlogInteractions from "./BlogInteractions";
import ShareButtons from "./ShareButtons";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const published = getPublishedBlogs();
  return published.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPublishedBlogs().find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: post.metaTitle || `${post.title} | ReelScale Blog`,
    description: post.metaDescription || post.description,
    keywords: post.focusKeyword ? [post.focusKeyword] : undefined,
    alternates: {
      canonical: post.canonicalUrl || `https://reelscale.in/blog/${post.slug}`,
    },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.description,
      url: `https://reelscale.in/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedDate,
      modifiedTime: post.updatedDate,
      authors: [post.author],
      images: [
        {
          url: post.ogImage || post.featuredImage || "https://reelscale.in/assets/logo.png",
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.description,
      images: [post.ogImage || post.featuredImage || "https://reelscale.in/assets/logo.png"],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const published = getPublishedBlogs();
  const post = published.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const htmlContent = parseMarkdown(post.content);
  const headings = generateTableOfContents(post.content);
  const readTime = getReadingTime(post.content);
  const related = getRelatedPosts(post, 3);

  // Schema generation
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `https://reelscale.in/blog/${post.slug}#entry`,
        "isPartOf": {
          "@type": "WebPage",
          "@id": `https://reelscale.in/blog/${post.slug}`,
          "url": `https://reelscale.in/blog/${post.slug}`,
          "name": post.title,
        },
        "headline": post.title,
        "description": post.description,
        "image": post.featuredImage || "https://reelscale.in/assets/logo.png",
        "datePublished": post.publishedDate,
        "dateModified": post.updatedDate,
        "author": {
          "@type": "Person",
          "name": post.author,
        },
        "publisher": {
          "@type": "Organization",
          "name": "ReelScale",
          "logo": {
            "@type": "ImageObject",
            "url": "https://reelscale.in/assets/logo.png",
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://reelscale.in/blog/${post.slug}#breadcrumbs`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://reelscale.in",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Blog",
            "item": "https://reelscale.in/blog",
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": post.title,
            "item": `https://reelscale.in/blog/${post.slug}`,
          },
        ],
      },
      post.faq && post.faq.length > 0 ? {
        "@type": "FAQPage",
        "mainEntity": post.faq.map((f) => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer,
          },
        })),
      } : null,
    ].filter(Boolean),
  };

  return (
    <BlogLayout>
      <BlogInteractions />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <article className="blog-container">
        
        {/* Breadcrumbs */}
        <div className="blog-breadcrumbs">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/blog">Blog</Link>
          <span>/</span>
          <Link href={`/blog/category/${post.category.toLowerCase()}`}>{post.category}</Link>
          <span>/</span>
          <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
            {post.title}
          </span>
        </div>

        {/* Title and Hero info */}
        <header className="blog-post-header">
          <h1>{post.title}</h1>
          <div className="blog-post-meta">
            <div className="blog-post-author-img">
              {(post.author || 'Sai Chittala')[0]}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--white)" }}>{post.author || 'Sai Chittala'}</div>
              <div style={{ fontSize: "12px", marginTop: "2px" }}>
                Published on {post.publishedDate} · {readTime}
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span className="blog-category-btn active" style={{ fontSize: "11px", padding: "4px 12px" }}>
                {post.category}
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.featuredImage && (
          <img 
            src={post.featuredImage} 
            alt={post.title} 
            className="blog-post-featured-img"
          />
        )}

        {/* Main layout split */}
        <div className="blog-detail-layout">
          
          {/* Main content Area */}
          <div className="blog-detail-main">
            
            {/* Parsed body content */}
            <div 
              className="blog-body" 
              dangerouslySetInnerHTML={{ __html: htmlContent }} 
            />

            {/* Accordion FAQs */}
            {post.faq && post.faq.length > 0 && (
              <section className="blog-faq-section">
                <h3 className="blog-faq-title">Frequently Asked Questions</h3>
                {post.faq.map((f, i) => (
                  <div key={i} className="blog-faq-item">
                    <div className="blog-faq-q">
                      <span>{f.question}</span>
                      <span className="faq-chevron" style={{ transition: "transform 0.2s" }}>
                        ▼
                      </span>
                    </div>
                    <div className="blog-faq-a" style={{ display: "none" }}>
                      {f.answer}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Social Share Buttons */}
            <ShareButtons title={post.title} slug={post.slug} />

            {/* Conversion CTA Box */}
            <div className="blog-cta-box">
              <h3 className="blog-cta-title">Need Scroll-Stopping Cinematic Reels?</h3>
              <p className="blog-cta-desc">
                Partner with ReelScale Co. to build a premium, high-retention video pipeline that turns viewers into clients organically.
              </p>
              <div className="blog-cta-buttons">
                <a 
                  href="https://wa.me/919966239433?text=Hey%2C%20I%20saw%20your%20blog%20post%20and%20I%27m%20interested%20in%20scaling%20our%20reel%20production." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary"
                  style={{ display: "inline-flex", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", color: "white" }}
                >
                  WhatsApp Enquiry
                </a>
                <Link 
                  href="/#pricing" 
                  className="btn btn-ghost"
                  style={{ display: "inline-flex", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", border: "1px solid var(--border)" }}
                >
                  View Packages
                </Link>
              </div>
            </div>

          </div>

          {/* Sticky Sidebar */}
          <aside className="blog-sidebar-sticky">
            
            {/* Table of Contents */}
            {headings.length > 0 && (
              <div className="blog-toc-card">
                <div className="blog-toc-title">On This Page</div>
                <ul className="blog-toc-list">
                  {headings.map((h, i) => (
                    <li 
                      key={i} 
                      className="blog-toc-item"
                      style={{ paddingLeft: `${(h.level - 2) * 12}px` }}
                    >
                      <a href={`#${h.id}`}>{h.text}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Newsletter form */}
            <div className="newsletter-card">
              <div className="newsletter-title">Subscribe to Scale</div>
              <p className="newsletter-desc">
                Get monthly deep-dives on editing hooks, retention tactics, and social algorithms.
              </p>
              <div className="newsletter-form">
                <input 
                  type="email" 
                  placeholder="name@email.com" 
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--white-03)", color: "white", fontSize: "13px" }}
                />
                <button 
                  className="btn btn-primary"
                  style={{ padding: "10px", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
                >
                  Join Newsletter
                </button>
              </div>
            </div>

          </aside>

        </div>

        {/* Related Articles Footer section */}
        {related.length > 0 && (
          <div style={{ marginTop: "80px", paddingTop: "40px", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "32px" }}>Related Articles</h3>
            <div className="blog-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {related.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card" style={{ background: "var(--white-03)" }}>
                  <div className="blog-card-img-wrap" style={{ paddingTop: "50%" }}>
                    <img 
                      src={post.featuredImage || "/assets/logo.png"} 
                      alt={post.title} 
                      className="blog-card-img" 
                    />
                  </div>
                  <div className="blog-card-content" style={{ padding: "18px" }}>
                    <div className="blog-card-meta" style={{ fontSize: "11px" }}>
                      <span className="blog-card-category">{post.category}</span>
                      <span>•</span>
                      <span>{post.publishedDate}</span>
                    </div>
                    <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--white)", lineHeight: 1.4 }}>
                      {post.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </article>
    </BlogLayout>
  );
}
