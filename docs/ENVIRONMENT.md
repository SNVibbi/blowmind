# Environment Variables

All config is the Firebase **web app** config, exposed to the browser via
the `NEXT_PUBLIC_` prefix (this is expected — these are not secrets; your
Firebase security rules are what protect data). Never add a real secret
with the `NEXT_PUBLIC_` prefix.

Copy `.env.example` to `.env.local` and fill in the values from
Firebase Console → Project settings → Your apps → Web app.

| Variable | Required | Source |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | yes | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | yes | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | yes | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | yes | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | yes | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | yes | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | no | Analytics (optional) |

## Validation

`src/utils/firebaseConfig.ts` checks all required variables at startup and
throws a message naming any that are missing — no more cryptic
`auth/invalid-api-key`. The production build fails fast if they're absent.

## Environments

Keep separate `.env.local` files (and ideally **separate Firebase
projects**) for development, staging, and production. Never point local
development or CI at the production Firebase project. `.env*.local` is
gitignored; CI supplies dummy values (client SDK only needs them present
at build time). For real deploys, set the variables in the Vercel project
settings per environment.
