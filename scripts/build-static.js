const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'app', 'api');
const apiBakDir = path.join(rootDir, '_api_bak');

console.log('==> Step 1: Generating sitemap...');
execSync('node scripts/generate-sitemap.js', { stdio: 'inherit', cwd: rootDir });

let apiMoved = false;

try {
  // If a previous run left _api_bak and app/api doesn't exist, restore it first
  if (!fs.existsSync(apiDir) && fs.existsSync(apiBakDir)) {
    fs.renameSync(apiBakDir, apiDir);
  }

  if (fs.existsSync(apiDir)) {
    console.log('==> Step 2: Temporarily moving app/api for static export...');
    fs.renameSync(apiDir, apiBakDir);
    apiMoved = true;
  }

  const dotNextDir = path.join(rootDir, '.next');
  if (fs.existsSync(dotNextDir)) {
    console.log('==> Cleaning .next cache...');
    fs.rmSync(dotNextDir, { recursive: true, force: true });
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
  if (apiMoved && fs.existsSync(apiBakDir)) {
    console.log('==> Step 4: Restoring app/api directory...');
    try {
      if (fs.existsSync(apiDir)) {
        // If apiDir somehow exists, remove it before renaming back
        fs.rmSync(apiDir, { recursive: true, force: true });
      }
      fs.renameSync(apiBakDir, apiDir);
      console.log('==> app/api successfully restored.');
    } catch (restoreErr) {
      console.error('==> Warning: Failed to restore app/api:', restoreErr.message);
    }
  }
}
