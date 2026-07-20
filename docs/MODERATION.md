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

## Not yet built (roadmap)

- Moderator review-queue UI (data model + rules are ready).
- Block/mute between users.
- Rate limiting and spam heuristics (need Cloud Functions).
- Suspension/appeal workflow and moderator audit log.

## Principle

Prefer soft-deletion and retention over immediate hard-deletion so
moderation decisions can be reviewed and reversed.
