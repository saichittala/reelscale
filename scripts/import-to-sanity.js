const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

const token = process.env.SANITY_AUTH_TOKEN || process.env.SANITY_API_WRITE_TOKEN;

if (!token) {
  console.log(`
[INFO] To import automatically from this script:
1. Go to https://sanity.io/manage/project/2gdjnoi2/api
2. Click "Tokens" -> "Add API token" -> Select "Editor" permissions
3. Run: $env:SANITY_AUTH_TOKEN="your_token_here"; node scripts/import-to-sanity.js

Alternatively, run using the Sanity CLI in studio-reelscale:
  cd ../studio-reelscale
  npx sanity dataset import ../reelscale/content/sanity-blogs.ndjson production
`);
  process.exit(0);
}

const client = createClient({
  projectId: '2gdjnoi2',
  dataset: 'production',
  apiVersion: '2026-02-01',
  token: token,
  useCdn: false,
});

const ndjsonPath = path.join(__dirname, '..', 'content', 'sanity-blogs.ndjson');
if (!fs.existsSync(ndjsonPath)) {
  console.error('sanity-blogs.ndjson not found. Run node scripts/export-blogs-for-sanity.js first.');
  process.exit(1);
}

const fileContent = fs.readFileSync(ndjsonPath, 'utf8');
const lines = fileContent.trim().split('\n').filter(Boolean).map(JSON.parse);

async function importDocs() {
  console.log(`==> Importing ${lines.length} documents into Sanity project 2gdjnoi2 (dataset: production)...`);
  let transaction = client.transaction();

  for (const doc of lines) {
    transaction = transaction.createOrReplace(doc);
  }

  const result = await transaction.commit();
  console.log(`✓ Successfully imported ${result.results.length} documents into Sanity!`);
  console.log('Open your Studio at http://localhost:3333 to see them live.');
}

importDocs().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
