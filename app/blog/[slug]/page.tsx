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
import ReadingProgressBar from "../components/ReadingProgressBar";
import TableOfContents from "../components/TableOfContents";
import FAQSection from "../components/FAQSection";
import BlogGrid from "../components/BlogGrid";
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
      <ReadingProgressBar />
      
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
          <span className="blog-breadcrumb-active-item">
            {post.title}
          </span>
        </div>

        {/* Title and Hero info */}
        <div className="blog-post-header">
          <h1>{post.title}</h1>
          <div className="blog-post-meta">
            <div className="blog-post-author-img">
              {(post.author || 'Sai Chittala')[0]}
            </div>
            <div>
              <div className="blog-post-author-name">{post.author || 'Sai Chittala'}</div>
              <div className="blog-post-publish-date">
                Published on {post.publishedDate} · {readTime}
              </div>
            </div>
            <div className="blog-post-meta-category-wrap">
              <span className="blog-category-btn active blog-post-category-badge">
                {post.category}
              </span>
            </div>
          </div>
        </div>

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
            <FAQSection faq={post.faq} />

            {/* Social Share Buttons */}
            <ShareButtons title={post.title} slug={post.slug} />

            {/* Conversion CTA Box */}
            <div className="blog-cta-box">
              <h3 className="blog-cta-title">Need scroll-stopping cinematic reels?</h3>
              <p className="blog-cta-desc">
                Partner with ReelScale Co. to build a premium, high-retention video pipeline that turns viewers into clients organically.
              </p>
              <div className="blog-cta-buttons">
                <a 
                  href="https://wa.me/919966239433?text=Hey%2C%20I%20saw%20your%20blog%20post%20and%20I%27m%20interested%20in%20scaling%20our%20reel%20production." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-primary blog-cta-btn-link"
                >
                  WhatsApp enquiry
                </a>
                <Link 
                  href="/#pricing" 
                  className="btn-secondary blog-cta-btn-link"
                >
                  View packages
                </Link>
              </div>
            </div>

          </div>

          {/* Sticky Sidebar */}
          <aside className="blog-sidebar-sticky">
            
            {/* Table of Contents */}
            <TableOfContents headings={headings} />

            {/* Newsletter form */}
            <div className="newsletter-card">
              <div className="newsletter-title">Subscribe to scale</div>
              <p className="newsletter-desc">
                Get monthly deep-dives on editing hooks, retention tactics, and social algorithms.
              </p>
              <div className="newsletter-form">
                <input 
                  type="email" 
                  placeholder="name@email.com" 
                  className="blog-newsletter-input"
                />
                <button 
                  className="btn-primary blog-newsletter-btn"
                >
                  Join newsletter
                </button>
              </div>
            </div>

          </aside>

        </div>

        {/* Related Articles Footer section */}
        {related.length > 0 && (
          <div className="blog-related-section">
            <h3 className="blog-related-title">Related articles</h3>
            <BlogGrid posts={related} readText="Read article" />
          </div>
        )}

      </article>
    </BlogLayout>
  );
}
