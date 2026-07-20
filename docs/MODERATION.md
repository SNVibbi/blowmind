# Content Moderation

## Reporting

Signed-in users can report a post or comment via `ReportButton`, which
writes to the `reports` collection through `moderationService.reportContent`.
Report IDs are `{reporterUid}_{targetType}_{targetId}`, so re-reporting
the same item updates the existing report instead of flooding the queue.

Reasons: spam, harassment, hate, violence, sexual, misinformation, other,
plus an optional free-text detail (≤1000 chars).

## Roles

Privileged access uses **Firebase custom claims** (`moderator`, `admin`),
set server-side only — never client-writable, so users cannot escalate
themselves. Set a claim with the Admin SDK:

```js
// scripts/setRole.mjs (run with a service account, owner-authorized)
await admin.auth().setCustomUserClaims(uid, { moderator: true });
```

## Moderation actions

- **Soft-remove a post**: a moderator sets `moderationStatus: "removed"`
  (plus `moderatedAt`, `moderatedBy`). Rules then hide the post from the
  public and non-owners while keeping it visible to its owner and
  moderators — nothing is hard-deleted, so actions are reviewable.
- **Triage a report**: a moderator updates the report's `status`
  (`open` → `resolved`/`dismissed`) with `resolution`, `resolvedAt`,
  `resolvedBy`.

Rules verified by tests: normal users cannot set `moderationStatus`, read
others' reports, or triage reports; moderators can do all three.

## Moderator dashboard

Moderators get a queue at **`/moderation`** (link appears in the navbar
only for users with the claim). It lists open reports newest-first and
offers two actions per report:

- **Remove post** — soft-removes the post (`moderationStatus: "removed"`)
  and resolves the report. Removed posts are hidden from the public by
  rules but stay visible to the owner and moderators.
- **Dismiss report** — marks the report dismissed, leaving the post up.

The page is gated by `withModerator` (reads the custom claim via
`useRole`), but that's convenience only — every action is independently
enforced by `firestore.rules`, so a non-moderator who forces their way to
the page just gets permission-denied.

## Block / mute (user-level)

Separate from moderator actions, any signed-in user can **block/mute**
another user (`BlockButton` on posts). Entries live in
`blocks/{blockerUid}_{targetUid}` — a private, owner-only list
(`blockService`, `useBlockedUsers`). The client filters blocked authors'
**posts** (feed/profile/bookmarks via `PostList`) and **comments**
(`PostComment`). Users manage their list at **`/settings`** (unblock).

Rules keep each block list private to its owner, enforce the
`{uid}_{targetUid}` ID convention, forbid blocking yourself, and restrict
`type` to `block`/`mute`. Covered by rule tests.

Note: filtering is client-side (a personal view filter), so it hides
content from the blocker; it does not prevent the blocked user from
posting. Cross-user interaction blocking would need server enforcement.

## Suspension & appeals

Moderators can **suspend** a user (dashboard → a report → "Remove &
suspend author"). Suspension sets `suspended`/`suspendedReason`/
`suspendedBy`/`suspendedAt` on the user's profile; security rules then
**block that user from creating posts, comments, or reports** (enforced
via a `get()` on their profile at write time — creates are rare enough
that the extra read is fine). A suspended user sees an app-wide banner
(`SuspensionBanner`) and can file one **appeal** at `/appeal`.

Appeals live in `appeals/{uid}` (private to the user + moderators).
Moderators review them in the dashboard **Appeals** tab and Grant
(auto-reinstates the user) or Deny.

## Moderator audit log

Every moderator action (post remove/restore, report resolve/dismiss,
suspend/reinstate, appeal grant/deny) appends an entry to `auditLog`
via `writeAudit`. Rules make it append-only, require `actorUid` to equal
the acting moderator, and restrict reads to moderators. Viewable in the
dashboard **Audit log** tab.

Note: audit entries are written client-side by authenticated moderators
(rule-constrained). Fully tamper-proof logging would move these writes
into Cloud Functions; the current model records who did what and is
adequate for a trusted moderator team.

## Not yet built (roadmap)

- Timed/auto-expiring suspensions (currently a moderator lifts them, or
  a granted appeal does); would need a scheduled Cloud Function.
- Spam heuristics beyond the rate limits in `functions/`.

## Principle

Prefer soft-deletion and retention over immediate hard-deletion so
moderation decisions can be reviewed and reversed.
