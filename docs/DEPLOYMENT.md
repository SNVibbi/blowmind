# Deployment & Rollback

## Go-live runbook (project: blowmind-6872b)

Do these **in order** — the order matters (stricter rules assume the new
frontend; functions need billing enabled).

1. **Vercel env vars** → set all `NEXT_PUBLIC_FIREBASE_*` (+ optional
   `NEXT_PUBLIC_SITE_URL`) and **redeploy**. Confirm the new site loads.
   (See "Setting the variables in Vercel" below.)
2. **Firestore indexes** — ✅ already deployed
   (`firebase deploy --only firestore:indexes --project blowmind-6872b`).
   Additive/safe; can run anytime.
3. **Security rules** — deploy once the new frontend from step 1 is live:
   ```bash
   firebase deploy --only firestore:rules,storage --project blowmind-6872b
   ```
   ⚠ This overwrites the console rules (which were never in the repo, so
   back them up from the console first if you want a rollback). Our rules
   are covered by 75 tests and assume the subcollection data model.
4. **Cloud Functions** — requires the **Blaze** (pay-as-you-go) plan;
   counters, rate limiting, spam checks, and expiry cleanup only run once
   deployed:
   ```bash
   npm --prefix functions run build
   firebase deploy --only functions --project blowmind-6872b
   ```
5. **First admin** — after you've signed into the live site at least once
   (so your auth user exists), grant yourself admin with a service
   account key (see [scripts/set-admin.mjs](../scripts/set-admin.mjs)).
   Then you can manage other moderators from the app via the setUserRole
   function. Sign out/in afterward to refresh your token.
6. **Data migration** — only if you have existing posts in the old
   embedded-array format. Back up first
   (`gcloud firestore export …`), then run
   [scripts/migrate-to-subcollections.mjs](../scripts/migrate-to-subcollections.mjs)
   (emulator dry-run first).

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

Vercel builds from `master` (or a preview branch). **You must set the
`NEXT_PUBLIC_FIREBASE_*` variables in the Vercel project** per environment
(see [ENVIRONMENT.md](ENVIRONMENT.md)) — the build validates them at
startup and fails fast if any are missing. Merges to `master` trigger a
production deploy; PRs get preview URLs.

### Setting the variables in Vercel

1. Vercel dashboard → your project → **Settings → Environment Variables**.
2. Add each of these (values from Firebase Console → Project settings →
   Your apps → Web app), scoped to **Production**, **Preview**, and
   **Development**:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_SITE_URL` (your production URL, e.g.
     `https://blowmind.vercel.app`) — used for canonical/social tags.
3. **Redeploy** (Deployments → ⋯ → Redeploy). Existing deployments don't
   pick up new env vars automatically.

## Email action links (password reset / verification)

The app has an in-app handler at **`/auth/action`** that processes
Firebase email action links (`resetPassword`, `verifyEmail`). For links
to open there instead of Firebase's default hosted page, set the **custom
action URL** once:

Firebase Console → **Authentication → Templates** → (any template, e.g.
Password reset) → pencil/edit → **Customize action URL** →
`https://<your-domain>/auth/action` (e.g.
`https://blowmind-6872b.web.app/auth/action` or your Vercel domain) →
Save. This applies to all email action types.

Reset links expire after 1 hour and are single-use; if a user waited too
long or already clicked once, the handler shows "link expired — request a
new one," which is expected.

## Troubleshooting

### Vercel build fails: "Missing required Firebase environment variables"
The `NEXT_PUBLIC_FIREBASE_*` variables are not set in Vercel. Follow
"Setting the variables in Vercel" above, then redeploy. This is the most
common deployment failure and is expected behavior — the app refuses to
build without its Firebase config rather than shipping a broken bundle.

### Vercel: pages load but Firebase calls fail at runtime
Env vars were added but an old deployment is still live, or they weren't
scoped to the right environment. Redeploy, and confirm the variables are
enabled for Production (and Preview if you use preview URLs).

### CI: `test:rules` step fails
The Firestore emulator (Java) powers these tests. CI installs JDK 17 and
caches the emulator. A first run (cold cache) downloads the emulator JAR;
a transient network failure there can fail the step — re-run the job. If
it fails consistently, check the step log for the emulator download URL /
Java errors.

### CI: `npm ci` fails with a lockfile error
`package.json` and `package-lock.json` are out of sync. Run `npm install`
locally, commit the updated `package-lock.json` (and
`functions/package-lock.json` if functions deps changed), and push.

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
