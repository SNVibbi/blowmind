/**
 * Bootstrap the FIRST admin (or moderator) by setting a custom claim.
 *
 * The setUserRole Cloud Function requires an existing admin, so the very
 * first privileged user has to be granted here with the Admin SDK.
 *
 * Usage (owner-run, with a service account key):
 *   1. Firebase Console -> Project settings -> Service accounts ->
 *      "Generate new private key" -> save the JSON somewhere safe.
 *   2. Run:
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
 *      GOOGLE_CLOUD_PROJECT=blowmind-6872b \
 *      node scripts/set-admin.mjs you@example.com admin
 *
 *   The last arg is the role: "admin" (default) or "moderator".
 *   Pass an email OR a uid as the first arg.
 *
 * After running, the user must sign out and back in (or wait for the
 * token to refresh) for the claim to take effect on the client.
 *
 * NEVER commit the service account key. Delete it when you're done.
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const identifier = process.argv[2];
const role = (process.argv[3] || "admin").toLowerCase();

if (!identifier || (role !== "admin" && role !== "moderator")) {
  console.error(
    "Usage: node scripts/set-admin.mjs <email|uid> [admin|moderator]"
  );
  process.exit(1);
}

initializeApp({
  credential: applicationDefault(),
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

const auth = getAuth();

const user = identifier.includes("@")
  ? await auth.getUserByEmail(identifier)
  : await auth.getUser(identifier);

const claims = { ...(user.customClaims ?? {}) };
if (role === "admin") {
  claims.admin = true;
  claims.moderator = true; // admins are moderators too
} else {
  claims.moderator = true;
}

await auth.setCustomUserClaims(user.uid, claims);

console.log(`Granted "${role}" to ${user.email ?? user.uid} (uid: ${user.uid}).`);
console.log("They must sign out and back in for it to take effect.");
