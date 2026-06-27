# ReelScale Code Organization

## Issues Found
1. **Duplicate auth files**: `dashboard/js/auth.js` and `dashboard/js/auth/auth.js` are identical
2. **Empty file**: `dashboard/js/dashboard.js` is empty
3. **Conflicting script loading**: `dashboard/dashboard.html` has ~1600 lines of inline JS AND also loads external JS files that redefine the same functions
4. **Wrong file type**: `dashboard/sales-dashboard-html` is a file without extension (should be .html or removed)
5. **Global dashboard CSS**: `app/globals.css` imports `dashboard/dashboard.css` which loads on landing page too
6. **Unused variables**: `styles.css` and `dashboard.css` both redeclare the same CSS variables
7. **Empty next.config.mjs**: No configuration for Next.js images from external URLs
8. **Hardcoded creds in two places**: Login works both via hardcoded admin creds + dynamic user fetch

## Fixes Applied
- [x] Clean up dashboard directory structure
- [x] Remove duplicate auth files
- [x] Remove empty dashboard.js
- [x] Remove stale sales-dashboard-html file
- [x] Fix conflicting script loading in dashboard.html
- [x] Fix app/globals.css to not import dashboard CSS globally
- [x] Update next.config.mjs with image configurations
- [x] Clean up CSS variable redeclarations