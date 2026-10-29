const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'app', 'api');
const apiBakDir = path.join(rootDir, '_api_bak');

function sleepSync(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

function safeRename(src, dest, retries = 5, delayMs = 400) {
  for (let i = 0; i < retries; i++) {
    try {
      fs.renameSync(src, dest);
      return;
    } catch (err) {
      if ((err.code === 'EPERM' || err.code === 'EBUSY') && i < retries - 1) {
        sleepSync(delayMs);
      } else {
        throw err;
      }
    }
  }
}

console.log('==> Step 1: Generating sitemap...');
execSync('node scripts/generate-sitemap.js', { stdio: 'inherit', cwd: rootDir });

let apiMoved = false;

try {
  // If a previous run left _api_bak and app/api doesn't exist, restore it first
  if (!fs.existsSync(apiDir) && fs.existsSync(apiBakDir)) {
    safeRename(apiBakDir, apiDir);
  }

  if (fs.existsSync(apiDir)) {
    console.log('==> Step 2: Temporarily moving app/api for static export...');
    safeRename(apiDir, apiBakDir);
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
  if (err.code === 'EPERM' || (err.message && err.message.includes('EPERM'))) {
    console.error('\n[ERROR] EPERM: Permission denied while moving app/api.');
    console.error('This occurs on Windows if `next dev` is running in another terminal window and locking directory handles.');
    console.error('Please stop `npm run dev` (Ctrl+C) before running `npm run deploy`.\n');
  } else {
    console.error('==> Build failed:', err.message);
  }
  process.exitCode = 1;
} finally {
  if (apiMoved && fs.existsSync(apiBakDir)) {
    console.log('==> Step 4: Restoring app/api directory...');
    try {
      if (fs.existsSync(apiDir)) {
        fs.rmSync(apiDir, { recursive: true, force: true });
      }
      safeRename(apiBakDir, apiDir);
      console.log('==> app/api successfully restored.');
    } catch (restoreErr) {
      console.error('==> Warning: Failed to restore app/api:', restoreErr.message);
    }
  }
}
