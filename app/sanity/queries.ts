import { defineQuery } from 'next-sanity'

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
