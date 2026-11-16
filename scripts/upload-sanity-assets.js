const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const tokenMatch = env.match(/SANITY_API_WRITE_TOKEN=(.*)/);
const token = (tokenMatch ? tokenMatch[1].trim() : '') || process.env.SANITY_API_WRITE_TOKEN;

if (!token) {
  console.error('No SANITY_API_WRITE_TOKEN found.');
  process.exit(1);
}

const client = createClient({
  projectId: '2gdjnoi2',
  dataset: 'production',
  apiVersion: '2026-02-01',
  useCdn: false,
  token,
});

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadBlogImages() {
  const blogsPath = path.join(__dirname, '..', 'content', 'blogs.json');
  const blogs = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));

  console.log(`\n===> Starting image upload for ${blogs.length} blog posts...`);

  for (let i = 0; i < blogs.length; i++) {
    const blog = blogs[i];
    const docId = `post-${blog.slug || blog.id}`;
    const imgUrl = blog.featuredImage;

    console.log(`[${i + 1}/${blogs.length}] Processing: "${blog.title.slice(0, 40)}..."`);

    if (!imgUrl || !imgUrl.startsWith('http')) {
      console.log(`  -> Skipping: No remote image URL`);
      continue;
    }

    try {
      console.log(`  -> Downloading image from ${imgUrl.slice(0, 45)}...`);
      const buffer = await downloadBuffer(imgUrl);

      console.log(`  -> Uploading image asset (${(buffer.length / 1024).toFixed(1)} KB) to Sanity...`);
      const asset = await client.assets.upload('image', buffer, {
        filename: `${blog.slug || 'featured'}.jpg`,
        contentType: 'image/jpeg',
      });

      console.log(`  -> Uploaded! Asset ID: ${asset._id}. Patching document ${docId}...`);
      await client
        .patch(docId)
        .set({
          featuredImage: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: asset._id,
            },
            alt: blog.title,
          },
          ogImage: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: asset._id,
            },
          },
        })
        .commit();

      console.log(`  -> Successfully patched ${docId}`);
    } catch (err) {
      console.error(`  -> Failed for ${docId}:`, err.message);
    }
  }
}

async function uploadReelPosters() {
  const reelImageMap = [
    {
      id: 'reel-salons-avinash',
      file: 'avinash-salon.webp',
      filename: 'avinash-salon.webp',
    },
    {
      id: 'reel-clothing-maitrova',
      file: 'maitrova.webp',
      filename: 'maitrova.webp',
    },
    {
      id: 'reel-interiors-parthu',
      file: 'parthu.webp',
      filename: 'parthu.webp',
    },
    {
      id: 'reel-interiors-jak',
      file: 'jak-interiors.webp',
      filename: 'jak-interiors.webp',
    },
    {
      id: 'reel-clothing-mk',
      file: 'mk-fashions.webp',
      filename: 'mk-fashions.webp',
    },
  ];

  console.log(`\n===> Starting poster upload for ${reelImageMap.length} portfolio reels...`);

  for (let i = 0; i < reelImageMap.length; i++) {
    const item = reelImageMap[i];
    const filePath = path.join(__dirname, '..', 'public', 'assets', 'clients', item.file);

    if (!fs.existsSync(filePath)) {
      console.warn(`  -> Skipping ${item.id}: file ${filePath} not found`);
      continue;
    }

    try {
      console.log(`[${i + 1}/${reelImageMap.length}] Reading ${item.file}...`);
      const buffer = fs.readFileSync(filePath);

      console.log(`  -> Uploading poster asset (${(buffer.length / 1024).toFixed(1)} KB) to Sanity...`);
      const asset = await client.assets.upload('image', buffer, {
        filename: item.filename,
        contentType: 'image/webp',
      });

      console.log(`  -> Uploaded! Asset ID: ${asset._id}. Patching document ${item.id}...`);
      await client
        .patch(item.id)
        .set({
          posterImage: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: asset._id,
            },
          },
        })
        .commit();

      console.log(`  -> Successfully patched ${item.id}`);
    } catch (err) {
      console.error(`  -> Failed for ${item.id}:`, err.message);
    }
  }
}

async function run() {
  await uploadBlogImages();
  await uploadReelPosters();
  console.log('\nAll image assets uploaded and linked in Sanity!');
}

run().catch((err) => {
  console.error('Fatal upload error:', err);
  process.exit(1);
});
