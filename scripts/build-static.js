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

console.log('==> Step 1: Generating sitemap & syncing public blogs database...');
const contentBlogsPath = path.join(rootDir, 'content', 'blogs.json');
const publicBlogsPath = path.join(rootDir, 'public', 'blogs.json');
if (fs.existsSync(contentBlogsPath)) {
  fs.copyFileSync(contentBlogsPath, publicBlogsPath);
}
execSync('node scripts/generate-sitemap.js', { stdio: 'inherit', cwd: rootDir });

let moveMode = null; // 'folder' | 'contents'

try {
  // If a previous run left _api_bak and app/api doesn't exist, restore it first
  if (!fs.existsSync(apiDir) && fs.existsSync(apiBakDir)) {
    safeRename(apiBakDir, apiDir);
  }

  if (fs.existsSync(apiDir)) {
    console.log('==> Step 2: Temporarily moving app/api for static export...');
    try {
      safeRename(apiDir, apiBakDir);
      moveMode = 'folder';
    } catch (err) {
      // Fallback: move items inside app/api without renaming app/api directory handle
      if (!fs.existsSync(apiBakDir)) fs.mkdirSync(apiBakDir, { recursive: true });
      const items = fs.readdirSync(apiDir);
      for (const item of items) {
        safeRename(path.join(apiDir, item), path.join(apiBakDir, item));
      }
      moveMode = 'contents';
    }
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
  if (moveMode && fs.existsSync(apiBakDir)) {
    console.log('==> Step 4: Restoring app/api directory...');
    try {
      if (moveMode === 'folder') {
        if (fs.existsSync(apiDir)) {
          fs.rmSync(apiDir, { recursive: true, force: true });
        }
        safeRename(apiBakDir, apiDir);
      } else {
        const items = fs.readdirSync(apiBakDir);
        for (const item of items) {
          safeRename(path.join(apiBakDir, item), path.join(apiDir, item));
        }
        fs.rmSync(apiBakDir, { recursive: true, force: true });
      }
      console.log('==> app/api successfully restored.');
    } catch (restoreErr) {
      console.error('==> Warning: Failed to restore app/api:', restoreErr.message);
    }
  }
}
