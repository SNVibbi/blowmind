import Link from "next/link";
import { useAuthContext } from "../context/AuthContext";
import { useDocument } from "../hooks/useDocument";

interface UserDoc {
  suspended?: boolean;
  suspendedReason?: string;
}

/**
 * App-wide banner shown to a suspended user. Their content creation is
 * blocked by security rules regardless; this explains why and links to
 * the appeal form.
 */
export default function SuspensionBanner() {
  const { user } = useAuthContext();
  const { document: profile } = useDocument<UserDoc>("users", user?.uid);

  if (!user || !profile?.suspended) return null;

  return (
    <div
      role="alert"
      className="bg-red-600 px-4 py-2 text-center text-sm text-white"
    >
      <i className="fas fa-ban mr-2" aria-hidden="true"></i>
      Your account is suspended
      {profile.suspendedReason ? `: ${profile.suspendedReason}` : "."} You
      can&apos;t post or comment.{" "}
      <Link href="/appeal" className="underline font-medium">
        Submit an appeal
      </Link>
    </div>
  );
}
