import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishedBlogs,
  getPublishedBlogsAsync,
  getRelatedPosts,
} from "../../lib/blog";
import BlogLayout from "../BlogLayout";
import ReadingProgressBar from "../components/ReadingProgressBar";
import BlogGrid from "../components/BlogGrid";
import LiveArticle from "./LiveArticle";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 0;

export async function generateStaticParams() {
  const published = getPublishedBlogs();
  return published.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const published = await getPublishedBlogsAsync();
  const post = published.find((p) => p.slug === slug);
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
  const published = await getPublishedBlogsAsync();
  const post = published.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

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
        {/* Live Revalidating Article */}
        <LiveArticle initialPost={post} />

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
