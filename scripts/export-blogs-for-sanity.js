const fs = require('fs');
const path = require('path');

const blogsJsonPath = path.join(__dirname, '..', 'content', 'blogs.json');
const outNdjsonPath = path.join(__dirname, '..', 'content', 'sanity-blogs.ndjson');

if (!fs.existsSync(blogsJsonPath)) {
  console.error('blogs.json not found');
  process.exit(1);
}

const blogs = JSON.parse(fs.readFileSync(blogsJsonPath, 'utf8'));

// 1. Convert each blog into Sanity Document NDJSON
const ndjsonLines = blogs.map((blog) => {
  const contentBlocks = [];
  if (blog.content) {
    const paragraphs = blog.content.split(/\n\n+/);
    paragraphs.forEach((p, idx) => {
      const trimmed = p.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('## ')) {
        contentBlocks.push({
          _key: `block_${idx}`,
          _type: 'block',
          style: 'h2',
          children: [{ _key: `span_${idx}`, _type: 'span', text: trimmed.replace(/^##\s+/, '') }],
        });
      } else if (trimmed.startsWith('### ')) {
        contentBlocks.push({
          _key: `block_${idx}`,
          _type: 'block',
          style: 'h3',
          children: [{ _key: `span_${idx}`, _type: 'span', text: trimmed.replace(/^###\s+/, '') }],
        });
      } else {
        contentBlocks.push({
          _key: `block_${idx}`,
          _type: 'block',
          style: 'normal',
          children: [{ _key: `span_${idx}`, _type: 'span', text: trimmed }],
        });
      }
    });
  }

  const sanityDoc = {
    _id: `post-${blog.slug || blog.id}`,
    _type: 'post',
    title: blog.title,
    slug: {
      _type: 'slug',
      current: blog.slug || String(blog.id),
    },
    description: blog.description || '',
    category: blog.category || 'Marketing',
    tags: Array.isArray(blog.tags) ? blog.tags : [],
    author: blog.author || 'ReelScale Team',
    publishedDate: blog.publishedDate || new Date().toISOString().split('T')[0],
    updatedDate: blog.updatedDate || blog.publishedDate,
    status: blog.status === 'Draft' ? 'Draft' : 'Published',
    body: contentBlocks,
    faq: Array.isArray(blog.faq)
      ? blog.faq.map((f, fIdx) => ({
          _key: `faq_${fIdx}`,
          _type: 'faq',
          question: f.question,
          answer: f.answer,
        }))
      : [],
    metaTitle: blog.metaTitle || blog.title,
    metaDescription: blog.metaDescription || blog.description,
    focusKeyword: blog.focusKeyword || '',
    canonicalUrl: blog.canonicalUrl || '',
  };

  return JSON.stringify(sanityDoc);
});

// 2. Add Portfolio Reels
const reels = [
  {
    _id: 'reel-salons-avinash',
    _type: 'reel',
    client: 'Salons',
    stat: '2x Leads in 24hrs',
    videoUrl: 'https://www.instagram.com/reels/DY3bF7xPJ5_/',
    order: 1,
  },
  {
    _id: 'reel-clothing-maitrova',
    _type: 'reel',
    client: 'CLOTHING',
    stat: '2.4M Views',
    videoUrl: 'https://www.instagram.com/p/DYhpQstRCBU/',
    order: 2,
  },
  {
    _id: 'reel-interiors-parthu',
    _type: 'reel',
    client: 'Interiors',
    stat: '1.2M Organic Reach',
    videoUrl: 'https://drive.google.com/file/d/1yD3ofnBBHKVUkblmLgTm8qYk0A82hK61/view?usp=sharing',
    order: 3,
  },
  {
    _id: 'reel-interiors-jak',
    _type: 'reel',
    client: 'Interiors',
    stat: '4.2x Engagement Lift',
    videoUrl: 'https://www.youtube.com/embed/ziM_K-n6svk',
    order: 4,
  },
  {
    _id: 'reel-clothing-mk',
    _type: 'reel',
    client: 'Clothing',
    stat: '3.8x Conversion',
    videoUrl: 'https://www.instagram.com/reelscale',
    order: 5,
  },
];

reels.forEach((reel) => {
  ndjsonLines.push(JSON.stringify(reel));
});

fs.writeFileSync(outNdjsonPath, ndjsonLines.join('\n'), 'utf8');
console.log(`Successfully generated ${ndjsonLines.length} documents (11 blogs + 5 reels) at ${outNdjsonPath}`);
