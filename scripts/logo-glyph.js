/**
 * Shared glyph parser/rasterizer for assets/logo.svg — the editable
 * source for InstaSale's speech-bubble-and-bolt mark (introduced 2026-09-10
 * to replace hand-tweaking six derived PNGs independently; see the
 * comment block at the top of assets/logo.svg for the shape's own design
 * history/rationale). Used by both generate-app-icons.js and
 * generate-store-assets.js so the two can't drift out of sync with each
 * other or with the SVG.
 *
 * This is a small hand-rolled parser for the exact 3-element subset
 * logo.svg uses (one stroked <rect>, one tail <path> with M/L/Q/Z, one
 * bolt <polygon>) — not a general SVG engine. If logo.svg ever needs a
 * shape outside that subset, this needs extending alongside it.
 */
const fs = require('fs');
const path = require('path');

const svg = fs.readFileSync(path.join(__dirname, '..', 'assets', 'logo.svg'), 'utf8');

function attr(tag, name) {
  const m = tag.match(new RegExp(name + '="([^"]+)"'));
  if (!m) throw new Error(`missing ${name} on ${tag}`);
  return parseFloat(m[1]);
}

const rectTag = svg.match(/<rect[^>]*\/>/)[0];
const rx = attr(rectTag, 'x'), ry = attr(rectTag, 'y');
const rw = attr(rectTag, 'width'), rh = attr(rectTag, 'height');
const rRadius = attr(rectTag, 'rx');
const strokeWidth = attr(rectTag, 'stroke-width');
const half = strokeWidth / 2;

// SVG centers a stroke on the path — expand/contract by half the stroke
// width to get the outer/inner rects the point-in-shape test needs.
const outer = { x0: rx - half, y0: ry - half, x1: rx + rw + half, y1: ry + rh + half, r: rRadius + half };
const inner = { x0: rx + half, y0: ry + half, x1: rx + rw - half, y1: ry + rh - half, r: Math.max(rRadius - half, 0) };

function parsePoints(tag) {
  const pointsStr = tag.match(/points="([^"]+)"/)[1];
  return pointsStr.trim().split(/\s+/).map(pair => pair.split(',').map(Number));
}

/** Parses a `d` string limited to the M/L/Q/Z commands logo.svg's tail
 * actually uses, sampling any Q (quadratic) curve into line segments so
 * the same point-in-polygon test used everywhere else still works. */
function parsePathD(d) {
  const tokens = d.match(/[MLQZ]|-?\d+\.?\d*/g);
  const pts = [];
  let i = 0, cur = [0, 0];
  while (i < tokens.length) {
    const cmd = tokens[i];
    if (cmd === 'M' || cmd === 'L') {
      const p = [Number(tokens[i + 1]), Number(tokens[i + 2])];
      pts.push(p); cur = p; i += 3;
    } else if (cmd === 'Q') {
      const ctrl = [Number(tokens[i + 1]), Number(tokens[i + 2])];
      const end = [Number(tokens[i + 3]), Number(tokens[i + 4])];
      const N = 12;
      for (let s = 1; s <= N; s++) {
        const t = s / N;
        const x = (1 - t) ** 2 * cur[0] + 2 * (1 - t) * t * ctrl[0] + t ** 2 * end[0];
        const y = (1 - t) ** 2 * cur[1] + 2 * (1 - t) * t * ctrl[1] + t ** 2 * end[1];
        pts.push([x, y]);
      }
      cur = end; i += 5;
    } else if (cmd === 'Z') {
      i += 1;
    } else {
      i += 1;
    }
  }
  return pts;
}

const pathTag = svg.match(/<path[^>]*\/>/)[0];
const tail = parsePathD(pathTag.match(/d="([^"]+)"/)[1]);
const bolt = parsePoints(svg.match(/<polygon[^>]*\/>/)[0]);

function dist(x1, y1, x2, y2) { return Math.hypot(x1 - x2, y1 - y2); }
function inRoundedRect(x, y, r) {
  const { x0, y0, x1, y1, r: rad } = r;
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const nearLeft = x < x0 + rad, nearRight = x > x1 - rad;
  const nearTop = y < y0 + rad, nearBottom = y > y1 - rad;
  if (nearLeft && nearTop) return dist(x, y, x0 + rad, y0 + rad) <= rad;
  if (nearRight && nearTop) return dist(x, y, x1 - rad, y0 + rad) <= rad;
  if (nearLeft && nearBottom) return dist(x, y, x0 + rad, y1 - rad) <= rad;
  if (nearRight && nearBottom) return dist(x, y, x1 - rad, y1 - rad) <= rad;
  return true;
}
function inPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
function isGlyph1024(x, y) {
  if (inRoundedRect(x, y, outer) && !inRoundedRect(x, y, inner)) return true;
  if (inPolygon(x, y, tail)) return true;
  if (inPolygon(x, y, bolt)) return true;
  return false;
}

/** Glyph coverage (0..1) at pixel (x,y) of a `canvasSize`-wide square
 * canvas, mapped back into the SVG's native 1024-unit space, 2x2
 * supersampled for anti-aliasing. This is the "safe zone" scale — the
 * glyph fills only part of the canvas, matching what Android's
 * adaptive-icon masking needs (see assets/logo.svg's header comment). */
function glyphCoverage(x, y, canvasSize) {
  const s = 1024 / canvasSize;
  const offsets = [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]];
  let hits = 0;
  for (const [ox, oy] of offsets) {
    if (isGlyph1024((x + ox) * s, (y + oy) * s)) hits++;
  }
  return hits / 4;
}

// Tight crop bounds (centroid + half-extent) — same crop as logo-mark.png,
// memoized since it's an O(1024^2) scan.
let _tightCrop = null;
function getTightCrop() {
  if (_tightCrop) return _tightCrop;
  let sumX = 0, sumY = 0, count = 0, minX = 1024, maxX = 0, minY = 1024, maxY = 0;
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
  _tightCrop = { cx, cy, half: need + pad };
  return _tightCrop;
}

/** Coverage for the glyph tightly cropped to its own bounds (same crop as
 * logo-mark.png) rendered to fill a `size`-square box positioned at
 * (boxX, boxY) on the destination canvas — for placing the logo at a
 * deliberate size/position rather than centered on the whole canvas
 * (e.g. off-center on a wide banner). */
function tightCoverageAt(x, y, boxX, boxY, size) {
  const { cx, cy, half } = getTightCrop();
  const s = (half * 2) / size;
  const offsets = [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]];
  let hits = 0;
  for (const [ox, oy] of offsets) {
    const gx = cx - half + (x + ox - boxX) * s;
    const gy = cy - half + (y + oy - boxY) * s;
    if (isGlyph1024(gx, gy)) hits++;
  }
  return hits / 4;
}

const STOPS = ['#405DE6', '#833AB4', '#C13584', '#E1306C', '#F77737', '#FCAF45'].map(hex => [
  parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16),
]);
/** Position along config/brand.js's `gradient` stops (0..1), matching
 * expo-linear-gradient's start:{0,0} end:{1,1} diagonal. Keep this list in
 * sync with brand.js's `gradient` export if the brand palette changes. */
function gradientColor(t) {
  t = Math.max(0, Math.min(1, t));
  const n = STOPS.length - 1;
  const pos = t * n;
  const i = Math.min(Math.floor(pos), n - 1);
  const f = pos - i;
  const [r0, g0, b0] = STOPS[i];
  const [r1, g1, b1] = STOPS[i + 1];
  return [r0 + (r1 - r0) * f, g0 + (g1 - g0) * f, b0 + (b1 - b0) * f];
}

module.exports = { glyphCoverage, tightCoverageAt, gradientColor, isGlyph1024 };
