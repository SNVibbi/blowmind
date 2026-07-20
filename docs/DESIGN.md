# Design System (Stage 8)

## Brand
- **Wordmark**: BlowMind. **Mark**: rounded-square "B" monogram on an
  indigo→cyan gradient (`public/favicon.svg`).
- **Primary**: indigo (`brand-600 #4f46e5`), scale `brand-50…900` in
  `tailwind.config.js`. **Accent**: cyan (`accent-500 #06b6d4`).

## Tokens
CSS custom properties in `styles/globals.css` drive surfaces/text/border
in both themes (`--bg`, `--surface`, `--text`, `--text-muted`,
`--border`, `--brand-*`). The previous dark-mode override incorrectly set
`--primary-color` to a dark gray — removed.

## Reusable classes (`@layer components`)
`.btn` / `.btn-primary` / `.btn-secondary`, `.card`, `.input-field`.
Use these for new UI so buttons, cards, and inputs stay consistent
instead of ad-hoc utility soup.

## Accessibility & motion
- Global `:focus-visible` ring (keyboard focus visible; mouse clicks stay
  clean).
- `prefers-reduced-motion` disables animations/transitions.
- Smooth 0.2s theme transition on major surfaces.

## Visual assets
All generated from SVG sources (crisp, tiny, themeable):

| File | Purpose |
| --- | --- |
| `public/favicon.svg` | Browser tab icon (vector) |
| `public/favicon-32.png` | PNG favicon fallback |
| `public/apple-touch-icon.png` | iOS home screen |
| `public/icon-192.png`, `icon-512.png` | PWA manifest icons |
| `public/og-image.svg` → `og-image.png` | Social share card (1200×630) |
| `public/img/default-avatar.svg` → `.png` | Avatar fallback |
| `public/img/empty-posts.svg` | Empty-state illustration |

Raster versions are produced from the SVGs by
`scripts/generate-raster-assets.mjs` (uses `sharp`). Re-run it after
editing any source SVG:

```bash
node scripts/generate-raster-assets.mjs
```

> Note on photos: category/hero images (`tech.jpg`, hero, etc.) are
> existing photography and were kept. New brand assets are vector-based;
> AI-generated photography is out of scope.

## SEO / metadata
- `src/pages/_document.tsx`: `lang="en"`, favicon + apple-touch links,
  web manifest, `theme-color`.
- `src/pages/_app.tsx`: default `<title>`, description, and Open
  Graph/Twitter card tags (per-page pages can override via `next/head`).

## Fixed in passing
- Broken `/path/to/default/avatar.png` references (navbar ×2, aside) now
  fall back to the real default avatar.
- `next/image` can't serve raw SVG without `dangerouslyAllowSVG`, so the
  avatar fallback ships as PNG; decorative SVGs use plain `<img>`.

## Applied restyle (Stage 11)
The design-system classes and brand palette are now used across the
high-traffic surfaces:
- **Auth** (login, signup): single disabled-aware `.btn-primary` submit
  (was two conditionally-rendered buttons), brand-colored toggle/links.
- **Composer**: `.btn-primary` publish; the add-media control is now a
  real `<button>` (keyboard-accessible); brand-colored draft banner.
- **Feed** (HomeFeed): `.btn-primary` "Write a post".
- **Post cards** (PostList): `.card` wrapper, brand-colored titles.
- **Moderation dashboard**: built on `.btn`/`.card`/state components.

## Not done (future polish)
- Per-page titles/descriptions for post detail (better SEO/shares).
- `next/font` self-hosting; tree-shaking Font Awesome to used glyphs.
- Migrating remaining secondary surfaces (profile header, aside) — safe
  to do incrementally now that the classes exist.
