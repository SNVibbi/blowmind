# Security Model

## Authorization boundary

All data access is browser → Firebase, so `firestore.rules` and
`storage.rules` are the real authorization layer. They are versioned in
this repo and covered by 52 emulator-backed tests (`npm run test:rules`)
exercising both allowed and denied operations.

### Firestore rules enforce
- Authentication where required; public read only where intended
  (posts are public unless soft-removed by moderation).
- Ownership checks; ownership (`userId`) and `createdAt` are immutable.
- Field allowlists on create/update (anti mass-assignment) — e.g. a user
  cannot add a `role` field to their profile.
- Type and length validation (title ≤200, content ≤100k, comment ≤2000).
- Deterministic IDs for likes/views/bookmarks/reports prevent duplicates
  and spoofing (`likes/{uid}`, `bookmarks/{uid}_{postId}`).
- Non-owners may only bump interaction counters, nothing else.
- Role gating via **custom claims** (`moderator`, `admin`) that clients
  cannot set — a normal user can never escalate their own privileges.

### Storage rules enforce
- Authenticated, owner-scoped writes under `images/<uid>/` and
  `thumbnails/<uid>/`.
- `image/*` content type and ≤5 MB size.
- Legacy flat paths are read-only (no new writes).

## XSS

Post content is user-authored HTML rendered with
`dangerouslySetInnerHTML`. Every such render passes through
`sanitizeHtml` (DOMPurify) with a tag/attribute allowlist and a URL
scheme filter (blocks `javascript:`). Covered by unit tests.

## Error hygiene

`lib/errors.ts` maps Firebase error codes to safe, user-facing messages;
raw internal messages, stack traces, and paths are never shown to users.
The `ErrorBoundary` shows a recovery screen, not a stack trace.

## Rate limiting (server-enforced)

Cloud Functions enforce per-user sliding-window limits on creation
(`functions/src/index.ts`, tunable in `RATE_LIMITS`): posts 5/min,
comments 15/min. Because the checks run in the Admin SDK, clients can't
bypass them. On breach, an over-limit **post** is soft-removed
(`moderationStatus: "removed"`, `moderatedBy: "system:rate-limit"`) and an
over-limit **comment** is deleted; each breach is logged to
`rateLimitEvents`. Both `rateLimits/{uid}` and `rateLimitEvents` are
Admin-SDK-only — clients are denied all access by rules (tested). Without
functions deployed there is simply no limiting (graceful degradation).

## Spam heuristics

Two layers share the same heuristic logic (app `src/lib/spam.ts` /
functions `functions/src/spam.ts` — keep in sync):

- **Client (advisory):** the composer and comment box run `detectSpam`
  and block submission with a clear reason, so users get instant feedback
  instead of a silent server removal.
- **Server (enforced):** the create triggers re-run the checks plus a
  stateful **duplicate-content** check (same text reposted within 10 min).
  On detection, posts are soft-removed (`moderatedBy: "system:spam"`) and
  comments deleted; each is logged to `spamEvents` (Admin-SDK-only).

Stateless checks (conservative to limit false positives): excessive links
(>5), mostly-capitalized text, long repeated-character runs, and a
starter banned-phrase list. Tune the lists/thresholds in `spam.ts`.

## Known limitations (tracked, not yet closed)

- **Client-written counters.** Rules restrict which fields non-owners can
  touch but can't verify an increment matches a subcollection write. A
  malicious client could inflate counts (not touch content or others'
  data). Fix: move counters behind Cloud Functions.
- **Email in user docs.** Profile docs still contain `email` and are
  readable by any signed-in user. Fix: split into a private subcollection.
- **App Check / rate limiting** not yet enabled — needs the server side.

## Recommended production hardening (see DEPLOYMENT.md)

Enable Firebase App Check, set security headers / CSP in `next.config`,
turn on Firestore/Storage backups, and add a monitoring/alerting service
hook (the `ErrorBoundary` has the integration point).
