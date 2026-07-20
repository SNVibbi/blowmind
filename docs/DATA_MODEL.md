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

## Known compromises (accepted until server-side code exists)

1. **Counters are client-written.** Rules restrict non-owners to counter
   fields only, but cannot verify an increment matches a subcollection
   write. A malicious client could inflate counts, but cannot touch
   content, ownership, or other users' data. Fix: move counters to a
   Cloud Function trigger.
2. **Orphaned data after post deletion.** Subcollections and other
   users' bookmark docs survive post deletion (clients may not delete
   other users' data). The bookmark library skips missing posts, so
   this is invisible to users. Fix: scheduled cleanup job or a Cloud
   Function on post delete.
3. **`users` docs still contain email** (pre-existing). Planned: split
   private fields into `users/{uid}/private/profile`.

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
