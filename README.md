# BlowMind

A modern social blogging platform: share posts with rich text and images,
comment, react, and bookmark, across mobile → desktop, in light or dark
themes. Built with Next.js and Firebase.

## Tech stack

- **Next.js 14** (Pages Router) + **React 18** + **TypeScript** (strict)
- **Tailwind CSS 3** + Flowbite
- **Firebase**: Authentication, Cloud Firestore, Storage
- **Vitest** + Testing Library (unit) and `@firebase/rules-unit-testing`
  (security rules, against the emulator)
- Deployed on **Vercel**

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in your Firebase web config
npm run dev                    # http://localhost:3000
```

You need a Firebase project (Auth with Email/Password + Google enabled,
Firestore, and Storage). Put its web-app config into `.env.local` — see
[docs/ENVIRONMENT.md](docs/ENVIRONMENT.md). The app validates these at
startup and fails with a clear message if any are missing.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (needs the env vars set) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:rules` | Firestore security-rule tests (needs Java for the emulator) |

## Documentation

- [AGENTS.md](AGENTS.md) — modernization plan, ground rules, git workflow
- [docs/AUDIT.md](docs/AUDIT.md) — original state audit and findings
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — structure and layers
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) — Firestore schema, write paths
- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) — environment variables
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — pipeline, rules deploy, rollback
- [docs/MODERATION.md](docs/MODERATION.md) — reporting, roles, moderation
- [docs/SCALING.md](docs/SCALING.md) — capacity model and bottlenecks
- [docs/PERFORMANCE.md](docs/PERFORMANCE.md) — perf changes and evidence
- [docs/RELIABILITY.md](docs/RELIABILITY.md) — offline, drafts, error states
- [docs/SECURITY.md](docs/SECURITY.md) — rules, sanitization, auth model

## Project layout

```
src/
  components/   UI + feature components (+ states/ for shared UX states)
  context/      Auth and Theme providers
  hooks/        data + UI hooks (pagination, interactions, drafts, ...)
  lib/          service layer (Firestore/Storage/errors/sanitize/media)
  pages/        Next.js routes only
firestore.rules, storage.rules, firestore.indexes.json
tests/rules/    emulator-backed security-rule tests
scripts/        one-off migration/admin scripts
docs/           documentation
```

## Security & deployment note

Security rules (`firestore.rules`, `storage.rules`) and indexes live in
this repo and are covered by tests, but deploying them to a live Firebase
project, running data migrations, and production deploys are **manual,
owner-authorized** steps. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
