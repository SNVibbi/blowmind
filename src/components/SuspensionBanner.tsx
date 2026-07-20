import Link from "next/link";
import { useAuthContext } from "../context/AuthContext";
import { useDocument } from "../hooks/useDocument";

interface UserDoc {
  suspended?: boolean;
  suspendedReason?: string;
  suspendedUntil?: { seconds: number } | null;
}

/**
 * App-wide banner shown to a suspended user. Content creation is blocked
 * by security rules regardless; this explains why and links to the appeal
 * form. A timed suspension whose expiry has passed is treated as inactive
 * here too (matching the rules), so the banner clears at expiry even
 * before the scheduled cleanup lifts the flag.
 */
export default function SuspensionBanner() {
  const { user } = useAuthContext();
  const { document: profile } = useDocument<UserDoc>("users", user?.uid);

  if (!user || !profile?.suspended) return null;

  const until = profile.suspendedUntil
    ? new Date(profile.suspendedUntil.seconds * 1000)
    : null;
  if (until && until.getTime() <= Date.now()) return null; // expired

  return (
    <div
      role="alert"
      className="bg-red-600 px-4 py-2 text-center text-sm text-white"
    >
      <i className="fas fa-ban mr-2" aria-hidden="true"></i>
      Your account is suspended
      {profile.suspendedReason ? `: ${profile.suspendedReason}` : ""}
      {until ? ` until ${until.toLocaleDateString()}` : ""}. You can&apos;t
      post or comment.{" "}
      <Link href="/appeal" className="underline font-medium">
        Submit an appeal
      </Link>
    </div>
  );
}
