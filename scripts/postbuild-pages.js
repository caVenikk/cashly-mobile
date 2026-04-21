// Post-build step for GitHub Pages:
//   - copy dist/index.html to dist/404.html so client-side SPA routes resolve
//   - ensure .nojekyll exists so GH Pages serves files starting with _
const fs = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, '..', 'dist');
const index = path.join(dist, 'index.html');
const notFound = path.join(dist, '404.html');
const noJekyll = path.join(dist, '.nojekyll');

if (!fs.existsSync(index)) {
  console.error(`postbuild-pages: ${index} not found — did the export fail?`);
  process.exit(1);
}

fs.copyFileSync(index, notFound);
console.log('postbuild-pages: wrote 404.html');

if (!fs.existsSync(noJekyll)) {
  fs.writeFileSync(noJekyll, '');
  console.log('postbuild-pages: wrote .nojekyll');
}
