import { defineQuery } from 'next-sanity'

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0] {
    _id,
    siteName,
    siteUrl,
    tagline,
    phone,
    whatsapp,
    email,
    address,
    headerNav,
    footerNav,
    socialLinks
  }
`)

export const PRICING_PLANS_QUERY = defineQuery(`
  *[_type == "pricingPlan"] | order(order asc) {
    _id,
    title,
    slug,
    category,
    price,
    numericPrice,
    currency,
    cadence,
    tier,
    featured,
    features,
    ctaText,
    ctaLink,
    order
  }
`)

export const TESTIMONIALS_QUERY = defineQuery(`
  *[_type == "testimonial"] | order(order asc) {
    _id,
    name,
    role,
    company,
    quote,
    stars,
    result,
    resultLabel,
    avatarInitials,
    "avatarImageUrl": avatarImage.asset->url,
    order
  }
`)

export const PAGE_SEO_QUERY = defineQuery(`
  *[_type == "pageSeo" && pageId == $pageId][0] {
    _id,
    pageId,
    title,
    metaTitle,
    metaDescription,
    canonicalUrl,
    ogTitle,
    ogDescription,
    "ogImageUrl": ogImage.asset->url,
    noIndex,
    structuredData
  }
`)

export const SERVICES_QUERY = defineQuery(`
  *[_type == "service"] {
    _id,
    title,
    slug,
    keyword,
    headline,
    subheadline,
    introText,
    benefits,
    process,
    deliverables,
    pricingPlan,
    pricingPrice,
    pricingFeatures,
    faqs,
    locationKeywords,
    "seo": {
      "metaTitle": seo.metaTitle,
      "metaDescription": seo.metaDescription,
      "canonicalUrl": seo.canonicalUrl,
      "ogImageUrl": seo.ogImage.asset->url,
      "noIndex": seo.noIndex
    }
  }
`)

export const SERVICE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "service" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    keyword,
    headline,
    subheadline,
    introText,
    benefits,
    process,
    deliverables,
    pricingPlan,
    pricingPrice,
    pricingFeatures,
    faqs,
    locationKeywords,
    "seo": {
      "metaTitle": seo.metaTitle,
      "metaDescription": seo.metaDescription,
      "canonicalUrl": seo.canonicalUrl,
      "ogImageUrl": seo.ogImage.asset->url,
      "noIndex": seo.noIndex
    }
  }
`)

export const LOCATION_PAGES_QUERY = defineQuery(`
  *[_type == "locationPage"] {
    _id,
    title,
    slug,
    location,
    category,
    headline,
    subheadline,
    introText,
    benefits,
    process,
    deliverables,
    pricingPlan,
    pricingPrice,
    pricingFeatures,
    faqs,
    "seo": {
      "metaTitle": seo.metaTitle,
      "metaDescription": seo.metaDescription,
      "canonicalUrl": seo.canonicalUrl,
      "ogImageUrl": seo.ogImage.asset->url,
      "noIndex": seo.noIndex
    }
  }
`)

export const LOCATION_PAGE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "locationPage" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    location,
    category,
    headline,
    subheadline,
    introText,
    benefits,
    process,
    deliverables,
    pricingPlan,
    pricingPrice,
    pricingFeatures,
    faqs,
    "seo": {
      "metaTitle": seo.metaTitle,
      "metaDescription": seo.metaDescription,
      "canonicalUrl": seo.canonicalUrl,
      "ogImageUrl": seo.ogImage.asset->url,
      "noIndex": seo.noIndex
    }
  }
`)

export const POSTS_QUERY = defineQuery(`
  *[_type == "post" && (!defined(status) || status == "Published" || status == "published")] | order(publishedDate desc, _updatedAt desc) {
    _id,
    title,
    "slug": slug.current,
    description,
    category,
    tags,
    featuredImage,
    "featuredImageUrl": featuredImage.asset->url,
    publishedDate,
    updatedDate,
    status,
    author,
    body,
    metaTitle,
    metaDescription,
    focusKeyword,
    canonicalUrl,
    ogImage,
    "ogImageUrl": ogImage.asset->url,
    faq
  }
`)

export const POST_BY_SLUG_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    description,
    category,
    tags,
    featuredImage,
    "featuredImageUrl": featuredImage.asset->url,
    publishedDate,
    updatedDate,
    status,
    author,
    body,
    faq,
    metaTitle,
    metaDescription,
    focusKeyword,
    canonicalUrl,
    ogImage,
    "ogImageUrl": ogImage.asset->url
  }
`)

export const REELS_QUERY = defineQuery(`
  *[_type == "reel"] | order(order asc) {
    _id,
    client,
    stat,
    videoUrl,
    posterImage,
    "posterImageUrl": posterImage.asset->url,
    "videoFileUrl": videoFile.asset->url,
    order
  }
`)
