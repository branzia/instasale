/**
 * Generates Google Play Console listing assets from assets/logo.svg —
 * separate from generate-app-icons.js (which produces the assets Expo
 * actually bundles into the app) since these never enter the app bundle,
 * only the Play Console listing itself. See store-assets/README.md for
 * the specs these sizes/formats are matched to.
 *
 * Run after editing assets/logo.svg: `npm run generate:store-assets`.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const { glyphCoverage, tightCoverageAt, gradientColor } = require('./logo-glyph');

const OUT_DIR = process.argv[2] || path.join(__dirname, '..', 'store-assets') + path.sep;

function makePng(w, h, painter) {
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (w * y + x) * 4;
      const [r, g, b, a] = painter(x, y);
      out.data[idx] = r; out.data[idx + 1] = g; out.data[idx + 2] = b; out.data[idx + 3] = a;
    }
  }
  return out;
}

function writeAndLog(filePath, png, options) {
  fs.writeFileSync(filePath, PNG.sync.write(png, options));
  console.log('wrote', filePath);
}

// Hi-res icon — 512x512, same gradient+glyph treatment as the real app
// icon (assets/icon.png), just resized, so the Play Store listing matches
// what's actually installed rather than introducing a second design.
writeAndLog(OUT_DIR + 'icon-512.png', makePng(512, 512, (x, y) => {
  const t = (x / 512 + y / 512) / 2;
  const [gr, gg, gb] = gradientColor(t);
  const cov = glyphCoverage(x, y, 512);
  return [Math.round(gr + (255 - gr) * cov), Math.round(gg + (255 - gg) * cov), Math.round(gb + (255 - gb) * cov), 255];
}));

// Feature graphic — 1024x500 banner. Uses the tightly-cropped glyph (like
// logo-mark.png), sized to actually read at a glance on a wide banner,
// rather than the small safe-zone-scaled glyph icon.png uses — that scale
// only exists for Android's adaptive-icon masking, irrelevant here.
// No text: no font-rasterizing tool is available here, so any wordmark/
// tagline on top of this would need adding in a design tool (Canva,
// Figma, etc.) — this gives a clean logo-only banner to start from.
{
  const LOGO_SIZE = 340;
  const LOGO_X = (1024 - LOGO_SIZE) / 2;
  const LOGO_Y = (500 - LOGO_SIZE) / 2;
  // colorType: 2 (RGB, no alpha channel) — Play Console's feature-graphic
  // spec explicitly disallows alpha, unlike the hi-res icon above.
  writeAndLog(OUT_DIR + 'feature-graphic.png', makePng(1024, 500, (x, y) => {
    const t = (x / 1024 + y / 500) / 2;
    const [gr, gg, gb] = gradientColor(t);
    const cov = tightCoverageAt(x, y, LOGO_X, LOGO_Y, LOGO_SIZE);
    return [Math.round(gr + (255 - gr) * cov), Math.round(gg + (255 - gg) * cov), Math.round(gb + (255 - gb) * cov), 255];
  }), { colorType: 2 });
}

console.log('done');
