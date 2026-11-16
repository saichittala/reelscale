import { writeClient, client } from './client'
import { Blog, FAQ } from '../dashboard/types'

/**
 * Converts Markdown string into Sanity Portable Text blocks
 */
export function markdownToBlocks(markdown: string) {
  if (!markdown) return []
  const blocks: any[] = []
  const paragraphs = markdown.split(/\n\n+/)

  paragraphs.forEach((p, idx) => {
    const trimmed = p.trim()
    if (!trimmed) return

    if (trimmed.startsWith('## ')) {
      blocks.push({
        _key: `block_${idx}_${Date.now()}`,
        _type: 'block',
        style: 'h2',
        children: [{ _key: `span_${idx}`, _type: 'span', text: trimmed.replace(/^##\s+/, '') }],
      })
    } else if (trimmed.startsWith('### ')) {
      blocks.push({
        _key: `block_${idx}_${Date.now()}`,
        _type: 'block',
        style: 'h3',
        children: [{ _key: `span_${idx}`, _type: 'span', text: trimmed.replace(/^###\s+/, '') }],
      })
    } else if (trimmed.startsWith('#### ')) {
      blocks.push({
        _key: `block_${idx}_${Date.now()}`,
        _type: 'block',
        style: 'h4',
        children: [{ _key: `span_${idx}`, _type: 'span', text: trimmed.replace(/^####\s+/, '') }],
      })
    } else if (trimmed.startsWith('> ')) {
      blocks.push({
        _key: `block_${idx}_${Date.now()}`,
        _type: 'block',
        style: 'blockquote',
        children: [{ _key: `span_${idx}`, _type: 'span', text: trimmed.replace(/^>\s+/, '') }],
      })
    } else {
      blocks.push({
        _key: `block_${idx}_${Date.now()}`,
        _type: 'block',
        style: 'normal',
        children: [{ _key: `span_${idx}`, _type: 'span', text: trimmed }],
      })
    }
  })

  return blocks
}

/**
 * Converts Sanity Portable Text blocks back into Markdown string
 */
export function blocksToMarkdown(blocks: any[]): string {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map((block) => {
      if (block._type !== 'block' || !Array.isArray(block.children)) return ''
      const text = block.children.map((c: any) => c.text || '').join('')
      if (block.style === 'h2') return `## ${text}`
      if (block.style === 'h3') return `### ${text}`
      if (block.style === 'h4') return `#### ${text}`
      if (block.style === 'blockquote') return `> ${text}`
      return text
    })
    .filter(Boolean)
    .join('\n\n')
}

/**
 * Extracts asset ID from Sanity CDN URL if already hosted on Sanity
 */
export function extractSanityAssetId(url: string): string | null {
  const match = url.match(/cdn\.sanity\.io\/images\/[^/]+\/[^/]+\/([a-zA-Z0-9_-]+)\.([a-zA-Z0-9]+)/)
  if (match) {
    const filename = match[1]
    const ext = match[2]
    return `image-${filename}-${ext}`
  }
  return null
}

/**
 * Uploads an image to Sanity asset lake from URL or Buffer
 */
export async function uploadImageToSanity(
  imageSource: any,
  filename = 'featured-image.jpg',
  contentType = 'image/jpeg'
): Promise<{ assetId: string; url: string } | null> {
  try {
    if (typeof imageSource === 'string') {
      // Check if already a Sanity CDN URL
      const existingAssetId = extractSanityAssetId(imageSource)
      if (existingAssetId) {
        return { assetId: existingAssetId, url: imageSource }
      }

      // Download remote image (Unsplash, Pexels, etc.)
      const res = await fetch(imageSource)
      if (!res.ok) {
        throw new Error(`Failed to fetch image: ${res.statusText}`)
      }
      const mime = res.headers.get('content-type') || contentType
      const blob = await res.blob()

      const asset = await writeClient.assets.upload('image', blob, {
        filename,
        contentType: mime,
      })
      return { assetId: asset._id, url: asset.url }
    } else {
      const asset = await writeClient.assets.upload('image', imageSource, {
        filename,
        contentType,
      })
      return { assetId: asset._id, url: asset.url }
    }
  } catch (err) {
    console.error('Sanity image upload error:', err)
    return null
  }
}

/**
 * Maps a Sanity post document to the Dashboard Blog interface
 */
export function sanityDocToBlog(doc: any): Blog {
  const imageUrl = doc.featuredImageUrl || doc.featuredImage?.asset?.url || ''
  const contentMarkdown = Array.isArray(doc.body) ? blocksToMarkdown(doc.body) : (typeof doc.body === 'string' ? doc.body : '')

  return {
    id: doc._id.replace(/^post-/, ''),
    title: doc.title || '',
    slug: doc.slug?.current || doc.slug || '',
    description: doc.description || '',
    category: doc.category || 'General',
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    featuredImage: imageUrl,
    publishedDate: doc.publishedDate || '',
    updatedDate: doc.updatedDate || doc.publishedDate || '',
    status: doc.status || 'Published',
    content: contentMarkdown,
    metaTitle: doc.metaTitle || doc.title || '',
    metaDescription: doc.metaDescription || doc.description || '',
    focusKeyword: doc.focusKeyword || '',
    canonicalUrl: doc.canonicalUrl || '',
    ogImage: doc.ogImageUrl || doc.ogImage?.asset?.url || imageUrl,
    faq: Array.isArray(doc.faq)
      ? doc.faq.map((f: any) => ({
        question: f.question || '',
        answer: f.answer || '',
      }))
      : [],
  }
}

/**
 * Saves (creates or updates) a blog in Sanity
 */
export async function syncBlogToSanity(blog: Blog): Promise<Blog> {
  const cleanSlug = (blog.slug || blog.title || 'untitled')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')

  // Find exact existing document in Sanity by _id or slug
  let docId = `post-${cleanSlug}`
  if (blog.id) {
    const rawId = String(blog.id).replace(/^drafts\./, '')
    if (rawId.startsWith('post-')) {
      docId = rawId
    } else {
      try {
        const existing = await writeClient.fetch(
          `*[_type == "post" && (_id in [$id1, $id2] || slug.current == $slug)][0]{ _id }`,
          {
            id1: `post-${rawId}`,
            id2: `post-${cleanSlug}`,
            slug: cleanSlug,
          }
        )
        if (existing?._id) {
          docId = existing._id.replace(/^drafts\./, '')
        }
      } catch { }
    }
  }

  // Handle Image Upload if provided
  let imageAsset: { assetId: string; url: string } | null = null
  if (blog.featuredImage && blog.featuredImage.trim()) {
    imageAsset = await uploadImageToSanity(blog.featuredImage.trim(), `${cleanSlug}.jpg`)
  }

  const today = new Date().toISOString().split('T')[0]
  const bodyBlocks = markdownToBlocks(blog.content || '')

  const sanityDoc: any = {
    _id: docId,
    _type: 'post',
    title: blog.title || 'Untitled Blog',
    slug: {
      _type: 'slug',
      current: cleanSlug,
    },
    description: blog.description || '',
    category: blog.category || 'General',
    tags: Array.isArray(blog.tags) ? blog.tags : [],
    author: 'ReelScale Team',
    publishedDate: blog.publishedDate || today,
    updatedDate: today,
    status: blog.status === 'Published' ? 'Published' : 'Draft',
    body: bodyBlocks,
    faq: Array.isArray(blog.faq)
      ? blog.faq.map((f, i) => ({
        _key: `faq_${i}_${Date.now()}`,
        _type: 'faq',
        question: f.question,
        answer: f.answer,
      }))
      : [],
    metaTitle: blog.metaTitle || blog.title || '',
    metaDescription: blog.metaDescription || blog.description || '',
    focusKeyword: blog.focusKeyword || '',
    canonicalUrl: blog.canonicalUrl || `https://reelscale.in/blog/${cleanSlug}`,
  }

  if (imageAsset) {
    sanityDoc.featuredImage = {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: imageAsset.assetId,
      },
      alt: blog.title,
    }
    sanityDoc.ogImage = {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: imageAsset.assetId,
      },
    }
  }

  const saved = await writeClient.createOrReplace(sanityDoc)
  // Clear any existing draft so Sanity Studio immediately reflects the published document
  try {
    await writeClient.delete(`drafts.${docId}`).catch(() => { })
  } catch { }

  console.log(`[Sanity Sync] Successfully synchronized document: ${saved._id}`)

  return {
    ...blog,
    id: saved._id.replace(/^post-/, ''),
    slug: cleanSlug,
    featuredImage: imageAsset ? imageAsset.url : blog.featuredImage,
    updatedDate: today,
  }
}

/**
 * Deletes a blog from Sanity
 */
export async function deleteBlogFromSanity(idOrSlug: string | number): Promise<boolean> {
  const strId = String(idOrSlug)
  const baseId = strId.replace(/^drafts\./, '').replace(/^post-/, '')
  const docId = `post-${baseId}`
  const draftId = `drafts.post-${baseId}`

  try {
    const tx = writeClient.transaction()
    tx.delete(docId)
    tx.delete(draftId)
    await tx.commit()
    console.log(`[Sanity Sync] Deleted document: ${docId}`)
    return true
  } catch (err: any) {
    // If not found by docId, try finding by slug
    try {
      const matches = await writeClient.fetch(`*[_type == "post" && slug.current == $slug]{ _id }`, {
        slug: baseId,
      })
      if (Array.isArray(matches) && matches.length > 0) {
        const tx = writeClient.transaction()
        matches.forEach((m: any) => tx.delete(m._id))
        await tx.commit()
        console.log(`[Sanity Sync] Deleted documents by slug: ${baseId}`)
        return true
      }
    } catch (e) {
      console.error('[Sanity Sync] Delete fallback error:', e)
    }
    console.error(`[Sanity Sync] Delete failed for ${docId}:`, err)
    return false
  }
}
