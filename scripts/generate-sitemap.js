const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'content', 'blogs.json');
const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');

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
}

generate();
