const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'app', 'api');

function getRouteFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getRouteFiles(fullPath));
    } else if (file === 'route.ts' || file === 'route.js') {
      results.push(fullPath);
    }
  }
  return results;
}

console.log('==> Step 1: Generating sitemap & syncing public blogs database...');
const contentBlogsPath = path.join(rootDir, 'content', 'blogs.json');
const publicBlogsPath = path.join(rootDir, 'public', 'blogs.json');
if (fs.existsSync(contentBlogsPath)) {
  fs.copyFileSync(contentBlogsPath, publicBlogsPath);
}
execSync('node scripts/generate-sitemap.js', { stdio: 'inherit', cwd: rootDir });

let renamedFiles = [];

try {
  console.log('==> Step 2: Temporarily stashing app/api route handlers for static export...');
  const routeFiles = getRouteFiles(apiDir);
  for (const rf of routeFiles) {
    const bak = rf + '.bak';
    fs.renameSync(rf, bak);
    renamedFiles.push({ original: rf, bak });
  }

  const dotNextDir = path.join(rootDir, '.next');
  if (fs.existsSync(dotNextDir)) {
    console.log('==> Cleaning .next cache...');
    fs.rmSync(dotNextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  }

  console.log('==> Step 3: Running next build with NEXT_PUBLIC_STATIC_EXPORT=true...');
  execSync('npx next build', {
    stdio: 'inherit',
    cwd: rootDir,
    env: {
      ...process.env,
      NEXT_PUBLIC_STATIC_EXPORT: 'true',
    },
  });

  console.log('==> Static build completed successfully!');
} catch (err) {
  console.error('==> Build failed:', err.message);
  process.exitCode = 1;
} finally {
  if (renamedFiles.length > 0) {
    console.log('==> Step 4: Restoring app/api route handlers...');
    for (const { original, bak } of renamedFiles) {
      if (fs.existsSync(bak)) {
        fs.renameSync(bak, original);
      }
    }
    console.log(`==> Restored ${renamedFiles.length} route handlers.`);
  }
}
