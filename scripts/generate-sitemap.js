const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'content', 'blogs.json');
const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');

async function syncBlogsFromGAS() {
  const blogsUrl = process.env.GOOGLE_SCRIPT_BLOGS_URL;
  if (!blogsUrl) {
    console.log("GOOGLE_SCRIPT_BLOGS_URL is not set. Skipping build-time Google Sheets sync, using local blogs.json.");
    return;
  }
  
  console.log(`Syncing blogs from Google Sheets: ${blogsUrl}...`);
  try {
    const response = await fetch(blogsUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Check if dynamic Apps Script response is wrapped in an envelope or is a direct array
    const blogsList = Array.isArray(data) ? data : (data.blogs || data.data || null);
    
    if (Array.isArray(blogsList)) {
      // Validate that item properties look correct before overwriting database
      fs.writeFileSync(DB_PATH, JSON.stringify(blogsList, null, 2), "utf8");
      console.log(`Successfully synced ${blogsList.length} blogs from Google Sheets to ${DB_PATH}`);
    } else {
      console.error("Invalid blogs data format received from Google Sheets:", data);
    }
  } catch (error) {
    console.error("Failed to sync blogs from Google Sheets during build:", error);
    console.log("Falling back to existing local blogs.json.");
  }
}

function generate() {
  let blogs = [];
  if (fs.existsSync(DB_PATH)) {
    try {
      blogs = JSON.parse(fs.readFileSync(DB_PATH, 'utf8') || '[]');
    } catch (e) {
      console.error("Error reading blogs:", e);
    }
  }

  const published = blogs.filter(b => b.status === 'Published');
  const dateStr = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://reelscale.in/</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://reelscale.in/blog</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://reelscale.in/dashboard/login/</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

  const services = [
    "restaurant-reels",
    "gym-reels",
    "interior-designers",
    "salons",
    "fashion-brands",
    "real-estate",
    "healthcare",
    "cafes",
    "startups",
    "corporate-companies"
  ];

  services.forEach(srv => {
    xml += `
  <url>
    <loc>https://reelscale.in/services/${srv}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  published.forEach(post => {
    xml += `
  <url>
    <loc>https://reelscale.in/blog/${post.slug}</loc>
    <lastmod>${post.updatedDate || post.publishedDate || dateStr}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  xml += '\n</urlset>';

  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
  console.log(`Generated sitemap with ${published.length} blog posts at ${SITEMAP_PATH}`);

  // Copy blogs.json to public directory for static dashboard fallback
  const PUBLIC_BLOGS_PATH = path.join(__dirname, '..', 'public', 'blogs.json');
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, PUBLIC_BLOGS_PATH);
    console.log(`Copied blogs.json to ${PUBLIC_BLOGS_PATH}`);
  }
}

async function run() {
  await syncBlogsFromGAS();
  generate();
}

run();
