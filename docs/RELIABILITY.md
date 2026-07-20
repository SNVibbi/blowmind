# Reliability & UX States (Stage 6)

## Connection handling
- `useNetworkStatus` — SSR-safe online/offline tracking with a brief
  "reconnected" pulse.
- `NetworkBanner` (mounted app-wide in `_app.tsx`) — fixed, screen-reader
  announced banner for offline and back-online states.
- The post composer blocks publishing while offline with a clear message
  instead of failing silently.

## Crash isolation
- `ErrorBoundary` wraps the whole app. A render crash shows a safe
  recovery screen (Try again / Go to feed) — never a stack trace. Has a
  hook point for a monitoring service; logs to console in dev only.

## Draft protection
- `useDraft<T>` — debounced localStorage persistence keyed per form.
- The composer autosaves title + content, restores them after a refresh
  or accidental navigation, shows a "Restored your unsaved draft" notice
  with a Discard action, and clears the draft only on successful publish
  (a failed publish keeps the draft for retry).

## Duplicate-submission prevention
- Composer submit is guarded by `response.isPending` and disables its
  button; interaction writes (likes/views/bookmarks) are already
  idempotent from Stage 4 (deterministic doc IDs).

## Consistent states
- `EmptyState` / `ErrorState` / `LoadingState` in
  `components/states/StateViews.tsx`. PostList now uses `EmptyState`;
  more surfaces can adopt these incrementally.
- Added a branded `404` page.

## Accessible mobile navigation
- `useFocusTrap` — Tab is trapped inside the open drawer, Escape closes
  it, body scroll is locked while open, and focus returns to the trigger
  on close.
- The drawer is `role="dialog" aria-modal`, the toggle exposes
  `aria-expanded`/`aria-controls`, and touch targets are ≥44px.

## Fixed in passing
- Post cards linked to a broken `#/post/<id>` anchor; now link to the
  real `/posts/<id>` route.
- Object URLs for image previews are now revoked (was a memory leak).
- Removed a blocking `alert()` and leftover `console.*` from the composer.

## Not yet done (honest list)
- Firestore offline persistence (IndexedDB) + write queue — deferred;
  needs conflict-handling design and testing.
- Retry-with-backoff wrapper for transient failures.
- Adopting the shared state components across every page.
