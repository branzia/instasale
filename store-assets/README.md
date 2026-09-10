# Google Play Console listing assets

Generated from [`assets/logo.svg`](../assets/logo.svg) via
`npm run generate:store-assets` (see
[`scripts/generate-store-assets.js`](../scripts/generate-store-assets.js)).
Not app-bundled — these only ever get uploaded to the Play Console listing
itself, so they live outside `assets/` (which Expo does bundle) on purpose.

| File | Spec it targets | Notes |
|---|---|---|
| `icon-512.png` | Play Console "App icon": 512×512, 32-bit PNG (alpha channel present) | Same gradient + glyph treatment as the real app icon (`assets/icon.png`), just resized — so the store listing matches what's actually installed. |
| `feature-graphic.png` | Play Console "Feature graphic": 1024×500, JPG or 24-bit PNG (no alpha) | Written with `colorType: 2` (no alpha channel) to satisfy the "no alpha" requirement exactly, not just visually (fully-opaque RGBA would look identical but fail a strict validator). |

**No text on the feature graphic.** There's no font-rasterizing tool
available in this toolchain, so the banner is logo-only — a wordmark/
tagline overlay (if wanted) needs adding in a real design tool (Canva,
Figma, etc.) using this as the base, or hand-editing `logo.svg` to add an
SVG `<text>` element (real SVG viewers will render it; the scripts'
rasterizer won't — see `scripts/logo-glyph.js`'s own note about its
limited element support).

**Screenshots, short/full description text, etc.** — not generated here.
This only covers the two graphical assets the mark itself feeds into.
