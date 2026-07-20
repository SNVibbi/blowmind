# Deployment & Rollback

## Environments

| Environment | Firebase project | Hosting |
| --- | --- | --- |
| Local | dev project (or emulator) | `npm run dev` |
| CI | dummy config | GitHub Actions |
| Staging | separate project (recommended) | Vercel preview |
| Production | production project | Vercel production |

Use **separate Firebase projects** for staging and production so tests
and migrations never touch live data.

## Pre-deploy gate (CI)

`.github/workflows/ci.yml` runs on every PR and push to `master`:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test` (unit)
5. `npm run test:rules` (Firestore emulator)
6. `npm run build`

Do not merge or deploy with any of these red.

## Deploying the app (Vercel)

Vercel builds from `master` (or a preview branch). Set the
`NEXT_PUBLIC_FIREBASE_*` variables in the Vercel project per environment
(see [ENVIRONMENT.md](ENVIRONMENT.md)). Merges to `master` trigger a
production deploy; PRs get preview URLs.

## Deploying security rules & indexes (manual, owner-authorized)

Rules and indexes are versioned here but are **not** auto-deployed.

```bash
# Review the diff first, then:
firebase deploy --only firestore:rules,storage --project <project-id>
firebase deploy --only firestore:indexes --project <project-id>
```

Deploy rules **before** shipping app code that depends on them.

## Data migration (manual, owner-authorized)

The Stage 4 subcollection migration lives at
`scripts/migrate-to-subcollections.mjs`. Always:

1. Run against the **emulator** first.
2. Take a Firestore export/backup:
   `gcloud firestore export gs://<backup-bucket>`.
3. Dry-run: `node scripts/migrate-to-subcollections.mjs --dry-run`.
4. Run for real with a service account. It is idempotent (skips
   already-migrated posts).

## Rollback

- **App**: in Vercel, promote the previous deployment (instant), or
  `git revert` the merge and let CI redeploy.
- **Rules**: redeploy the previous `firestore.rules` from git history.
- **Data**: restore from the Firestore export taken before the migration
  (`gcloud firestore import`). A backup is only "real" once a restore has
  been tested — do a test restore into a scratch project.

## Service objectives (targets to instrument)

Availability ≥ 99.9%, error rate < 1%, p75 page load < 2.5s on 4G,
RTO < 1h, RPO < 24h (daily backups). Wire an exception monitor into the
`ErrorBoundary` hook point and alert on permission-denied spikes and cost
anomalies.
