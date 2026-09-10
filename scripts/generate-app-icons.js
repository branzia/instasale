/**
 * Rasterizes assets/logo.svg into every app-bundled brand asset:
 * icon.png, favicon.png, splash-icon.png, android-icon-foreground.png,
 * android-icon-monochrome.png, logo-mark.png (the in-UI badge Splash.tsx
 * and (onboarding)/instagram-required.tsx both render).
 *
 * Run after editing assets/logo.svg: `npm run generate:app-icons`
 * (an optional first arg overrides the output prefix, for previewing
 * somewhere other than assets/ before committing to it).
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const { glyphCoverage, gradientColor, isGlyph1024 } = require('./logo-glyph');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

function makePng(size, painter) {
  const out = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) * 4;
      const [r, g, b, a] = painter(x, y);
      out.data[idx] = r; out.data[idx + 1] = g; out.data[idx + 2] = b; out.data[idx + 3] = a;
    }
  }
  return out;
}

function writeAndLog(filePath, png) {
  fs.writeFileSync(filePath, PNG.sync.write(png));
  console.log('wrote', filePath);
}

const outPrefix = process.argv[2] || ASSETS_DIR + path.sep;

writeAndLog(outPrefix + 'icon.png', makePng(1024, (x, y) => {
  const t = (x / 1024 + y / 1024) / 2;
  const [gr, gg, gb] = gradientColor(t);
  const cov = glyphCoverage(x, y, 1024);
  return [Math.round(gr + (255 - gr) * cov), Math.round(gg + (255 - gg) * cov), Math.round(gb + (255 - gb) * cov), 255];
}));

writeAndLog(outPrefix + 'favicon.png', makePng(196, (x, y) => {
  const t = (x / 196 + y / 196) / 2;
  const [gr, gg, gb] = gradientColor(t);
  const cov = glyphCoverage(x, y, 196);
  return [Math.round(gr + (255 - gr) * cov), Math.round(gg + (255 - gg) * cov), Math.round(gb + (255 - gb) * cov), 255];
}));

const MAGENTA = [0xC1, 0x35, 0x84];
writeAndLog(outPrefix + 'splash-icon.png', makePng(1024, (x, y) => {
  const cov = glyphCoverage(x, y, 1024);
  return [Math.round(255 + (MAGENTA[0] - 255) * cov), Math.round(255 + (MAGENTA[1] - 255) * cov), Math.round(255 + (MAGENTA[2] - 255) * cov), 255];
}));

writeAndLog(outPrefix + 'android-icon-foreground.png', makePng(1024, (x, y) => {
  const cov = glyphCoverage(x, y, 1024);
  return [255, 255, 255, Math.round(cov * 255)];
}));
writeAndLog(outPrefix + 'android-icon-monochrome.png', makePng(1024, (x, y) => {
  const cov = glyphCoverage(x, y, 1024);
  return [255, 255, 255, Math.round(cov * 255)];
}));

// logo-mark.png — tight, centroid-centered crop for in-UI badges (Splash,
// instagram-required), rather than the sparse Android-safe-zone scale the
// other assets above use.
{
  let sumX = 0, sumY = 0, count = 0;
  let minX = 1024, maxX = 0, minY = 1024, maxY = 0;
  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      if (isGlyph1024(x + 0.5, y + 0.5)) {
        sumX += x; sumY += y; count++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  const cx = Math.round(sumX / count), cy = Math.round(sumY / count);
  const need = Math.max(cx - minX, maxX - cx, cy - minY, maxY - cy);
  const glyphSize = Math.max(maxX - minX, maxY - minY);
  const pad = Math.round(glyphSize * 0.22);
  const cropHalf = need + pad;
  const cropSize = cropHalf * 2;
  const cropX0 = cx - cropHalf, cropY0 = cy - cropHalf;

  const out = new PNG({ width: cropSize, height: cropSize });
  for (let y = 0; y < cropSize; y++) {
    for (let x = 0; x < cropSize; x++) {
      const sx = cropX0 + x, sy = cropY0 + y;
      const outIdx = (cropSize * y + x) * 4;
      let a = 0;
      if (sx >= 0 && sx < 1024 && sy >= 0 && sy < 1024) a = Math.round(glyphCoverage(sx, sy, 1024) * 255);
      out.data[outIdx] = 255; out.data[outIdx + 1] = 255; out.data[outIdx + 2] = 255; out.data[outIdx + 3] = a;
    }
  }
  writeAndLog(outPrefix + 'logo-mark.png', out);
}

console.log('done');
