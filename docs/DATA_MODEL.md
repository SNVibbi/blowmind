# BlowMind Firestore Data Model (Stage 4)

## Collections

### `users/{uid}`
Canonical shape in [src/lib/userService.ts](../src/lib/userService.ts)
(`UserProfile`): firstName, lastName, email, photoUrl, headline,
interests[], category, online, createdAt, updatedAt.
Legacy field drift (`photoURL`, `interest`) is tolerated on read via
`normalizeUserProfile` until a backfill runs.

### `posts/{postId}`
| Field | Type | Notes |
| --- | --- | --- |
| title | string | 1–200 chars (rule-enforced) |
| content | string (HTML) | ≤100k chars; sanitized on render |
| imageURL | string | Storage download URL or "" |
| userId | string | owner uid; immutable after create |
| author | map | denormalized author snapshot |
| createdAt | timestamp | immutable after create |
| tags | array<string> | |
| share | string | |
| commentCount / likeCount / bookmarkCount / viewCount | number | denormalized counters |
| expands | number | non-unique engagement counter |
| migratedAt | timestamp | set by the Stage 4 migration script |

### `posts/{postId}/comments/{commentId}`
userId, displayName, photoURL, content (≤2000 chars), createdAt.
Immutable; author may delete.

### `posts/{postId}/likes/{uid}`
Doc ID **is** the liker's uid → a user can never double-like.
uid, displayName, photoURL, createdAt.

### `posts/{postId}/views/{uid}`
Doc ID is the viewer's uid; write-once. uid, createdAt.

### `bookmarks/{uid_postId}`
Slim reference: userId, postId, createdAt. Private to the owner.
The ID convention `{uid}_{postId}` is rule-enforced and makes
bookmarking idempotent. The bookmark library resolves posts via
chunked `documentId() in [...]` queries (10 per chunk).

## Write paths

All interaction writes go through
[src/lib/postService.ts](../src/lib/postService.ts):

- `toggleLike` — transaction: create/delete `likes/{uid}` + `likeCount ± 1`
- `addComment` — batch: add comment + `commentCount + 1`
- `recordView` — transaction: first-view check + `viewCount + 1`
- `toggleBookmark` — batch: set/delete bookmark + `bookmarkCount ± 1`
- `incrementExpands` — `expands + 1`
- `deletePost` — deletes post + the deleter's own bookmark

## Counters & cleanup (server-authoritative — Stage 9)

Counters are owned by **Cloud Functions** (`functions/src/index.ts`),
which run with the Admin SDK and bypass rules. Clients write only the
interaction document; security rules **block clients from writing the
count fields**, so counts cannot be forged.

- `onLikeCreated`/`onLikeDeleted` → `likeCount`
- `onCommentCreated`/`onCommentDeleted` → `commentCount`
- `onViewCreated` → `viewCount`
- `onBookmarkCreated`/`onBookmarkDeleted` → `bookmarkCount`
- `onPostDeleted` → recursive-deletes the post's subcollections, deletes
  every user's bookmark for that post, and resolves open reports about it
  (fixes the previous orphaned-data gap).

`expands` remains client-written (low-stakes, no subcollection source).

**Deployment dependency:** counts only move once functions are deployed
(`firebase deploy --only functions`). The app degrades gracefully without
them — likes/comments/bookmarks all still work (they read the interaction
docs directly); only the displayed totals stay stale.

## Remaining known limitations

1. **`users` docs still contain email** (pre-existing). Planned: split
   private fields into `users/{uid}/private/profile`.
2. **Counter trigger delivery is at-least-once.** A rare duplicate
   trigger could drift a count by 1; acceptable for engagement metrics.
   A periodic reconciliation job (recount from subcollections) can be
   added if exactness is ever required.

## Migration

[scripts/migrate-to-subcollections.mjs](../scripts/migrate-to-subcollections.mjs)
moves legacy embedded arrays into subcollections, sets counters, deletes
the arrays, rewrites legacy bookmark docs, and stamps `migratedAt`
(idempotent). Test against the emulator first; production runs need a
service account, a fresh Firestore export/backup, and the owner's
explicit go-ahead. `--dry-run` prints the plan without writing.

Until the migration runs, un-migrated posts still render correctly:
`getPostCounts()` falls back to legacy array lengths, and new
interactions write counters/subcollections on top of the old doc.

## Indexes

`firestore.indexes.json`:
- `bookmarks(userId ASC, createdAt DESC)` — bookmark library query.

Deploy alongside rules: `firebase deploy --only firestore` (owner action).
