# AGENTS.md — BlowMind Production Modernization

Guidance for AI agents and human contributors working on BlowMind. Read this
before making changes. The full audit of the current state lives in
[docs/AUDIT.md](docs/AUDIT.md).

## Mission

Productionize the existing BlowMind social blogging platform incrementally.
Do **not** rewrite or replace working features wholesale. Understand first,
improve second. Target: a polished public launch, architected with a realistic
path to 300,000+ registered users.

## What BlowMind is

A social blogging platform: accounts and profiles, email/password + Google
sign-in, rich-text posts with images, comments, likes, bookmarks, feeds,
light/dark theme, responsive across mobile → desktop.

## Current stack (verified 2026-07-20)

| Layer      | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Framework  | Next.js 14.2.5 — **Pages Router** (`src/pages`)         |
| Language   | TypeScript 5, `strict: true`                            |
| UI         | Tailwind CSS 3.4, Flowbite 2.4, react-icons, react-toastify |
| Auth       | Firebase Auth 10 (modular API) + react-firebase-hooks   |
| Data       | Cloud Firestore (client SDK, real-time listeners)       |
| Media      | Firebase Storage (client uploads)                       |
| Deploy     | Vercel                                                  |

There is no backend layer of our own: no API routes, no Cloud Functions, no
server actions. All Firestore/Storage access happens from the browser, so
**Firebase security rules are the only real authorization boundary**.

## Ground rules (non-negotiable)

1. **Never fabricate results.** Run lint/typecheck/build/tests and report real
   output, including failures. Do not continue past critical failures.
2. **Never weaken security rules to make an error disappear.**
3. **No secrets in code, commits, logs, or docs.** Env vars go in
   `.env.local` (gitignored); document names only in `.env.example`.
4. **No destructive production changes** (deploys, data migrations, rule
   pushes, DNS) without explicit authorization from the owner.
5. **Preserve working features.** If a change alters behavior, say so.
6. **No new dependencies without justification.** Prefer what's installed.
7. **Accessibility is not optional** — keyboard, focus, semantics, contrast.
8. **Measure before claiming performance wins** (bundle analysis, profiling).
9. At the end of each stage: list what changed, run `npm run lint`,
   `npx tsc --noEmit`, `npm run build`, report honestly, then commit with a
   descriptive message.

## Known architecture problems (from audit — fix in stage order)

- `useCollection("posts")` / `useCollection("users")` attach **unbounded
  real-time listeners to entire collections** (`src/pages/blog/Home.tsx`).
  No pagination anywhere. This is the #1 cost/scale blocker.
- Post documents embed **unbounded arrays**: `comments`, `likes`,
  `bookmarks`, `views` all live inside the post doc and are rewritten via
  whole-array `updateDoc` calls. This breaks at the 1 MiB doc limit and makes
  every reaction a race condition. Must move to subcollections + counters.
- **No Firestore or Storage rules are in the repo.** Whatever is deployed is
  unversioned and untested. Client writes set `userId` from the client —
  currently spoofable unless rules prevent it.
- `useGoogle.googleSignUp` calls `setDoc` on `users/{uid}` **without
  `merge`**, so an existing user who signs up again loses profile data. It
  also imports the legacy `firebase/compat/auth` package.
- User documents store `email` and are world-readable via the `users`
  collection listener — a privacy leak.
- `setLogLevel('debug')` is enabled in `src/utils/firebaseConfig.ts` for all
  environments.
- Env vars are read without validation; a missing var fails at runtime with
  cryptic Firebase errors.
- No tests of any kind. No error boundaries. Field naming is inconsistent
  (`photoURL` vs `photoUrl`). Duplicate configs: `tailwind.config.js` and
  `.ts`, `postcss.config.js` and `.mjs`.
- Uploads use raw user filenames in paths, no client-side compression, no
  MIME/size validation in code (rules unknown), no upload progress.
- Missing product basics: password reset, email verification, search that
  isn't client-side filtering, notifications, moderation/reporting.

## Git workflow (authorized by the owner, 2026-07-20)

- Each stage is developed on a branch named `stage-N-short-name`.
- When the stage's checks pass (lint, typecheck, tests, rule tests,
  build), merge the branch into `master` and push both to `origin`.
- Pushing stage work and merging to master is pre-authorized; do NOT
  wait for a prompt. Production actions (Firebase rule deploys, data
  migrations against the live project, Vercel/domain changes) remain
  owner-only.

## Status (updated 2026-07-20)

Stages 1–7 complete and merged to `master`. Verification at last merge:
strict TypeScript clean, ESLint clean, 21 unit tests + 52 security-rule
tests passing, production build passes (13 routes). Outstanding items are
the owner-only production actions (deploy rules/indexes, run the data
migration, wire a monitoring service, load-test against staging) and the
tracked hardening in docs/SECURITY.md and docs/SCALING.md (Cloud
Functions for counters/moderation/notifications, dedicated search,
App Check). See the docs/ folder for the full picture.

## Stage plan

Work strictly in order. Do not start a stage while the previous one has
unresolved critical failures.

### Stage 1 — Audit & baseline (docs only)
Produce `docs/AUDIT.md`, this file, and a verified baseline: install deps,
run lint + typecheck + build, record results. No behavior changes.

### Stage 2 — Foundation
- Validate `NEXT_PUBLIC_FIREBASE_*` env vars at startup with clear errors;
  add `.env.example`.
- Remove debug log level; gate any logging by environment.
- Remove duplicate config files; keep one Tailwind + one PostCSS config.
- Introduce `src/lib/` service layer: typed Firestore converters, storage
  service, error mapping (Firebase error code → user-friendly message).
- Add Vitest + React Testing Library; first tests for utils/services.

### Stage 3 — Authentication & security
- Fix Google sign-up `setDoc` → `setDoc(..., { merge: true })` or
  create-if-missing; drop `firebase/compat` import.
- Single auth listener (AuthContext only); hooks consume the context.
- Add password reset and email verification flows.
- `withAuth` HOC: redirect-back-after-login, loading state, no flicker.
- Write `firestore.rules` + `storage.rules` in-repo: ownership checks, field
  allowlists, type/size validation, no client-set `userId` spoofing,
  restrict `users` reads to safe public fields (move email out or lock it).
- Add `@firebase/rules-unit-testing` tests for allow AND deny cases.
- Sanitize rich-text content before render (audit `dangerouslySetInnerHTML`).

### Stage 4 — Data model migration
- New model: `posts/{id}` holds content + denormalized counters
  (`commentCount`, `likeCount`, `bookmarkCount`, `viewCount`);
  `posts/{id}/comments`, `posts/{id}/likes` subcollections;
  `users/{uid}/bookmarks` for the bookmark library.
- Idempotent migration script (run against emulator first; production run
  requires owner authorization).
- Update Reaction, PostComment, BookmarkIcon, PostList to the new model with
  `increment()` + transactions where needed.

### Stage 5 — Performance & scalability
- Replace whole-collection listeners with paginated `getDocs` queries
  (`orderBy(createdAt) + limit + startAfter`), infinite scroll on the feed.
- Real-time only where it matters: the open comment thread, live counts on
  the open post.
- `firestore.indexes.json` for every compound query.
- `next/image` for all content images; client-side compression before
  upload; unique generated filenames.
- Bundle analysis before/after; document numbers in `docs/PERFORMANCE.md`.

### Stage 6 — Reliability & UX states
- Network status detection, offline/reconnect banners.
- Disable-on-submit everywhere; idempotent writes for reactions/bookmarks.
- Draft autosave (localStorage) + recovery for the post composer.
- Consistent loading / empty / error / permission-denied / not-found states.
- Accessible mobile nav: focus trap, Escape closes, body scroll lock,
  44px touch targets. Error boundaries at page level.

### Stage 7 — Community safety, testing, docs, pipeline
- Report post/comment (soft-delete + `reports` collection), rate-limit
  design, moderation states in rules.
- E2E happy path (Playwright): signup → post → comment → react → bookmark →
  edit → logout → login.
- Docs: README rewrite, architecture, Firestore schema, rules, env guide,
  deployment + rollback, scaling model with capacity assumptions.
- CI checklist: lint, typecheck, unit tests, rule tests, build.

## Scaling assumptions (working model — refine with real data)

300k registered ≈ 30k MAU ≈ 6k DAU ≈ 300–600 peak concurrent. Firestore
handles this fine **if** reads are paginated and listeners are scoped;
the current unbounded-listener design would cost O(total posts × concurrent
users) reads and fails long before that. Bottleneck order: (1) unbounded
listeners, (2) embedded-array contention on hot posts, (3) client-side
search, (4) notification fan-out. Dedicated search (Algolia/Typesense
abstraction) and Cloud Functions for counters become necessary around
50k+ MAU — design the service layer so they can be swapped in.

## Commands

```bash
npm install          # deps
npm run dev          # dev server
npm run lint         # eslint
npx tsc --noEmit     # typecheck
npm run build        # production build
```

## Definition of done (per acceptance criteria)

Auth reliable; authorization enforced by tested rules; posts/comments/
reactions/bookmarks correct under the new model; feeds paginated; no
unbounded listeners; loading/empty/error/offline states everywhere;
responsive 320px–1600px with no horizontal overflow; keyboard navigable;
strict TS, lint, tests, rule tests, and production build all pass; no
secrets in repo or bundle; performance and scaling documented; rollback
procedure documented.
