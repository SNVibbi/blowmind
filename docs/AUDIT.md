# BlowMind — Stage 1 Repository Audit

Date: 2026-07-20 · Commit audited: `362f7c8` ("updates")
Auditor: Claude (AI agent), per [AGENTS.md](../AGENTS.md)

## 1. Framework & versions

| Item | Value |
| --- | --- |
| Next.js | 14.2.5 — **Pages Router** (`src/pages`), no App Router usage |
| React / ReactDOM | ^18 |
| TypeScript | ^5, `strict: true` enabled |
| Tailwind CSS | ^3.4.6 (⚠ two config files: `tailwind.config.js` **and** `.ts`) |
| PostCSS | ⚠ two config files: `postcss.config.js` **and** `.mjs` |
| Flowbite | ^2.4.1 (plugin usage; no flowbite-react) |
| Firebase | ^10.12.4 (modular SDK, plus one stray `firebase/compat/auth` import) |
| Other | react-firebase-hooks, react-select, react-toastify, react-loading-skeleton, uuid, date-fns, sharp |
| Tests | **None** — no test framework, no test files |
| CI/CD | None in repo; deploys via Vercel (config not in repo) |

## 2. Structure

- `src/pages/` — index (landing), login, signup, interest, create-post,
  blog/ (index, Home, Post), posts/[postId], bookmark/, profile/,
  analytics/, _app.tsx
- `src/components/` — 17 components (navbars, cards, post list/details,
  comments, reactions, bookmark icon, search bar, skeletons, toasts…)
- `src/hooks/` — useCollection, useDocument, useFirestore, useSignup,
  useLogin, useLogout, useGoogle, useCategory, useReadTime, useTheme,
  useAuthContext
- `src/context/` — AuthContext, ThemeContext
- `src/hoc/withAuth.tsx` — **entirely commented out**
- `src/utils/firebaseConfig.ts` — Firebase init
- `src/Types.ts` — shared interfaces
- No `src/lib` service layer; Firestore/Storage calls live inside hooks and
  components directly.

## 3. Backend surface

**There is none.** No API routes, no Cloud Functions, no server actions.
Every read/write goes browser → Firestore/Storage. Consequences:

- Firebase security rules are the only authorization layer, and
  **no rules files exist in the repo** (whatever is deployed is unversioned
  and untested).
- Counters, moderation, notifications, rate limiting have no trusted place
  to run today.

## 4. Data model (as implemented)

Collections observed in code: `users`, `posts`, `bookmarks`.
(`comments`, `likes`, `views`, `bookmarks` also exist **as arrays embedded
in each post document** — see C2.)

`users/{uid}`: firstName, lastName, email, photoUrl, headline, interests[],
online, category.
`posts/{id}`: title, content (HTML), imageURL, userId, author{...},
createdAt, comments[], likes[], bookmarks[], views[], tags[], share,
expands.

## 5. Critical findings (ranked)

### C1 — No route protection
`src/hoc/withAuth.tsx` is fully commented out and nothing replaces it.
Any visitor can open create-post, profile, bookmarks, etc. UI may break or
silently fail; combined with unknown rules, data exposure is likely.

### C2 — Unbounded embedded arrays on post documents
`comments`, `likes`, `bookmarks`, `views` are arrays inside each post doc,
updated by rewriting the whole array (`updateDocument(post.id, {...})` in
Reaction.tsx, PostComment/PostList, BookmarkIcon). Problems: 1 MiB document
limit ceiling; last-writer-wins races that silently drop concurrent likes/
comments; every reader downloads every comment; any authenticated user can
rewrite anyone's arrays (pending rules).

### C3 — Whole-collection real-time listeners
`useCollection<Post>("posts")` and `useCollection<User>("users")` in
`blog/Home.tsx` (also profile, bookmark, Confirm.tsx) subscribe to entire
collections with no `limit()`. Cost and latency grow linearly with total
content × concurrent users. This is the first thing that dies at scale.

### C4 — Stored XSS risk
`post.content` is rendered with `dangerouslySetInnerHTML` in
PostDetails.tsx:49, PostList.tsx:109, Analytics.tsx:68 with **no
sanitization** anywhere in the codebase.

### C5 — `users` collection leaks PII
User docs include `email` and the whole collection is read client-side.
Anyone can enumerate all users' emails (pending rules verification).

### C6 — Google sign-up destroys existing profiles
`useGoogle.googleSignUp` → `setDoc(users/{uid}, {...})` without
`{ merge: true }`: a returning user who clicks "sign up with Google" gets
interests/headline/category wiped. Also imports `firebase/compat/auth`
(legacy API mixed with modular).

## 6. High-priority findings

- **H1** `userId` set client-side on writes (`useFirestore.addDocument` /
  `updateDocument`) — spoofable without strict rules; `updateDocument`
  even overwrites `userId` on every update.
- **H2** `setLogLevel('debug')` always on (firebaseConfig.ts:27).
- **H3** No env validation; missing `NEXT_PUBLIC_FIREBASE_*` yields cryptic
  runtime failures. No `.env.example`. (Good: nothing secret is committed;
  `.gitignore` covers `.env*.local`.)
- **H4** No pagination anywhere; no `firestore.indexes.json`.
- **H5** Uploads: raw user filename in storage path, no client-side type/
  size validation, no compression, no progress UI, no cleanup of orphaned
  images on failure/delete.
- **H6** Field-name drift: `photoURL` (Types.ts, auth profile) vs `photoUrl`
  (user docs) — avatar bugs guaranteed.
- **H7** Error handling: `any`-typed errors, raw Firebase messages surfaced
  in toasts, `toast.error("...", reason)` misuse (second arg is options —
  reason silently dropped), no error boundaries.
- **H8** Missing flows: password reset, email verification, session-expiry
  handling, account deletion.
- **H9** Duplicate auth state: AuthContext runs `useAuthState` while login/
  logout/google hooks separately dispatch LOGIN/LOGOUT — two sources of
  truth.
- **H10** `online: true/false` presence flags via Firestore writes on
  login/logout — unreliable (no disconnect hook) and adds write cost.

## 7. Medium / cleanup

- Duplicate configs (tailwind ×2, postcss ×2); `.eslintrc` is just
  `next/core-web-vitals`; unused/odd deps (`figma-icons`,
  `@types/react-select` as a runtime dep, `sharp` unused in a client-only
  app); dead code (`withAuth.tsx`, commented analytics export);
  `useCollection` deps array uses non-memoized tuples (re-subscribes every
  render risk where inline arrays are passed); screen-width via resize
  listener duplicated across pages instead of CSS breakpoints; no
  `loading="lazy"`/next-image discipline for content images; no
  robots/meta/OG tags for public posts (SEO).

## 8. Baseline verification (run 2026-07-20)

| Check | Result |
| --- | --- |
| `npm install` | ✅ completes, no blocking errors |
| `npm run lint` | ✅ passes — "No ESLint warnings or errors" |
| `npx tsc --noEmit` | ✅ passes, zero errors |
| `npm run build` (no env vars) | ❌ **fails** during "Collecting page data" with `FirebaseError: auth/invalid-api-key` — Firebase initializes at module import with undefined env vars (confirms H3) |
| `npm run build` (env vars set) | ✅ passes, 15 static pages. First Load JS: shared 206 kB, `/signup` 290 kB, `/login` 260 kB. Warning: "multiple attempts to register component auth" — caused by the `firebase/compat/auth` import in `useGoogle.tsx` (C6) |

Additional finding from the build output:

- **H11** Component files stored inside `src/pages/` are compiled into
  unintended public routes: `/blog/Home`, `/blog/Post`, `/Landing`,
  `/analytics/Analytics`. These should live in `src/components/` or a
  non-routed folder.

## 9. What already works and must be preserved

Landing page, email/password signup + login, Google sign-in, interest
selection, post creation with image upload, feed rendering, post detail
with comments/reactions, bookmarks, profile page, analytics page,
light/dark theming, responsive layouts (quality to be verified visually),
toast notifications, skeleton loaders.
