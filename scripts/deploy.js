const { execSync } = require('child_process');

try {
  console.log('==> Step 1: Building static site...');
  execSync('node scripts/build-static.js', { stdio: 'inherit' });

  console.log('==> Step 2: Deploying out/ to gh-pages...');
  // Using -v "*" removes top-level directory entries instead of individual file paths,
  // preventing Windows "spawn ENAMETOOLONG" CLI buffer overflow.
  execSync('npx gh-pages -d out -v "*"', { stdio: 'inherit' });

  console.log('\n==> Deployment completed successfully!\n');
} catch (err) {
  console.error('\n==> Deployment failed:', err.message);
  process.exit(1);
}
