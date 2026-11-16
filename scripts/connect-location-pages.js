const fs = require('fs');
const path = require('path');

const slugs = [
  'corporate-reels-hyderabad',
  'gym-reel-production-hyderabad',
  'instagram-reels-hyderabad',
  'interior-reels-hyderabad',
  'real-estate-reels-hyderabad',
  'reel-production-company-hyderabad',
  'reels-shoot-hyderabad',
  'salon-reels-hyderabad',
];

const rootDir = path.resolve(__dirname, '..');

slugs.forEach((slug) => {
  const filePath = path.join(rootDir, 'app', slug, 'page.tsx');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  let code = fs.readFileSync(filePath, 'utf8');

  // Replace function SEOPage declaration and "const data =" with "const baseData ="
  code = code.replace(
    /export default function SEOPage\(\)\s*\{[\r\n\s]+const \{ headerHtml, footerHtml \} = getHeaderAndFooter\(\);[\r\n\s]+const data = \{/m,
    `export default async function SEOPage() {\n  const { headerHtml, footerHtml } = getHeaderAndFooter();\n  const cmsLocation = await getLocationPageBySlug(SLUG);\n\n  const baseData = {`
  );

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`✓ Fixed SEOPage in ${slug}`);
});
