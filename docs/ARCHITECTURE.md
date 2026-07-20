# Architecture

## Overview

BlowMind is a client-rendered Next.js (Pages Router) app talking directly
to Firebase from the browser. There is no custom backend today, so
**Firebase security rules are the authorization boundary** and all
privileged logic that can't be trusted to clients is either enforced in
rules or deferred to future Cloud Functions.

```
Browser (Next.js/React)
  ├─ context/      AuthContext (single auth listener), ThemeContext
  ├─ hooks/        usePaginatedPosts, useInteractions, useDraft,
  │                useNetworkStatus, useFocusTrap, useBookmarkedPosts, ...
  ├─ lib/          service layer — the ONLY place that talks to Firebase:
  │                userService, postService, moderationService,
  │                errors (Firebase code → safe message),
  │                sanitize (DOMPurify), imageUtils (compress/validate)
  └─ components/   presentation + feature widgets
        │
        ▼
Firebase
  ├─ Auth          email/password + Google
  ├─ Firestore     users, posts (+comments/likes/views subcols),
  │                bookmarks, reports        ← firestore.rules
  └─ Storage       images/<uid>/, thumbnails/<uid>/  ← storage.rules
```

## Layering rules

- **Components** render and handle local UI state. They do not call
  Firestore/Storage directly — they go through hooks or `lib/` services.
- **Hooks** own data fetching/subscription lifecycles and expose plain
  state. Feed reads are paginated one-shot queries; real-time listeners
  are limited to the open comment thread and single-doc status.
- **`lib/` services** are the single choke point for Firebase writes,
  error mapping, sanitization, and media handling. This is what makes a
  future swap (e.g. counters → Cloud Functions, search → Algolia)
  localized instead of a rewrite.

## Auth flow

`AuthContext` runs the single `onAuthStateChanged` listener (via
`react-firebase-hooks`) and exposes `{ user, authIsReady, ... }`.
`withAuth(Component)` gates protected pages: it waits for `authIsReady`
(no redirect flicker), then redirects signed-out users to
`/login?redirect=<path>`; `useLogin` sends them back after signing in.
Profile documents are created-or-merged via `ensureUserProfile` so no
sign-in path ever clobbers existing profile data.

## Authorization

Enforced in `firestore.rules` / `storage.rules`, not by hiding UI:
ownership checks, field allowlists (anti mass-assignment), type/size
limits, immutable ownership/created fields, and role gating via custom
claims (`moderator`/`admin`) that clients cannot set. See
[SECURITY.md](SECURITY.md).

## Key decisions

- **Pages Router kept** (not migrated to App Router): lower risk, the app
  is small, and the wins this project targets (security, data model,
  pagination) are router-agnostic.
- **Counters denormalized on the post doc**, interactions in
  subcollections — see [DATA_MODEL.md](DATA_MODEL.md).
- **No new heavy dependencies**: image compression uses the canvas API;
  the only additions are DOMPurify (XSS) and dev-only test tooling.
