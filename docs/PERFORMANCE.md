# Performance Notes (Stage 5)

Measured with `next build` output (route-level First Load JS) before and
after; Firestore costs reasoned from query shapes since they depend on
data volume.

## Firestore read cost (the real win)

| Surface | Before | After |
| --- | --- | --- |
| Feed (`/blog`) | `onSnapshot` on the **entire posts collection** + the **entire users collection**, per visitor, re-pushed on every change anywhere | 10 posts per page via one-shot cursor query (`orderBy createdAt desc, limit 10, startAfter`), plus a single-doc listener on the visitor's own user doc |
| Profile | whole-collection listeners filtered client-side | paginated author query (indexed) + 50 newest bookmarks |
| Bookmarks | listener on entire bookmarks collection (wrong field query — page was broken) | indexed `userId ==` query, 50 max, then chunked post fetch |
| Post detail | one post doc listener (fine) | unchanged, plus bounded comments listener (≤100) |

With N total posts and U concurrent feed viewers, read load went from
O(N × U) streamed documents to O(10 × pages actually viewed). At the
target scale (hundreds of thousands of posts) the old shape was both a
cost blowout and a latency wall; the new shape is flat per user action.

## Media

- Client-side compression before upload (canvas re-encode → WebP/JPEG,
  max 1600px content / 512px avatars, EXIF stripped). A typical 4 MB
  phone photo lands well under 500 KB.
- Feed images: `priority` now only on the first image (was on every
  image, defeating lazy loading); deprecated `layout="responsive"`
  removed; `sizes` added so devices fetch appropriately sized variants
  via `next/image`.

## Bundle / routes

- Unintended routes removed (components had been placed inside
  `src/pages/`): `/blog/Home`, `/blog/Post` (dead duplicate deleted),
  `/Landing`, `/analytics/Analytics` → routes went 16 → 13, and the
  analytics page now lives at `/analytics`.
- First Load JS is essentially unchanged (~206→235 kB shared, growth is
  the DOMPurify sanitizer — a deliberate security trade). The heavy
  items remain Firebase SDK and Font Awesome CSS; candidates for a
  later pass (tree-shaken icons, `next/font`).

## Not yet done (honest list)

- Virtualized lists (only needed once pages stack up in one session).
- CDN cache headers for public pages (Vercel defaults apply).
- Bundle analyzer run with per-dependency breakdown.
- Load testing (Stage 7 scope, needs a staging Firebase project).
