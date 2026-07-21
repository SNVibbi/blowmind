import { useDocument } from "../hooks/useDocument";
import { useAuthContext } from "../context/AuthContext";
import { ReactElement } from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import CustomSkeleton from "./CustomSkeleton";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface UserDoc {
  photoUrl?: string;
  photoURL?: string;
  firstName: string;
  lastName: string;
  headline?: string;
  interests?: string[];
}

const Aside = (): ReactElement => {
  const { user } = useAuthContext();
  const { error, document: profile, isPending } = useDocument<UserDoc>(
    "users",
    user?.uid || ""
  );

  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <aside className="sticky top-24">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
        <div className="h-16 bg-gradient-to-r from-brand-600 to-accent-500" />
        <div className="px-4 pb-4 text-center">
          <div className="-mt-8 mb-2 flex justify-center">
            {isPending ? (
              <CustomSkeleton circle width={64} height={64} />
            ) : (
              <div className="avatar-ring">
                <Avatar
                  src={profile?.photoUrl || profile?.photoURL || user?.photoURL}
                  className="h-16 w-16 border-4 border-white dark:border-gray-800"
                />
              </div>
            )}
          </div>

          {isPending ? (
            <>
              <CustomSkeleton width="60%" height={18} className="mx-auto mb-2" />
              <CustomSkeleton width="80%" height={12} className="mx-auto" />
            </>
          ) : profile ? (
            <>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                @{profile.firstName?.toLowerCase()}
              </p>
              {profile.headline && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {profile.headline}
                </p>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {profile.interests.slice(0, 4).map((i) => (
                    <span key={i} className="chip">
                      {i}
                    </span>
                  ))}
                </div>
              )}

              <Link href="/profile" className="btn-secondary mt-4 w-full justify-center">
                View profile
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
        <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Get started
        </h3>
        <Link href="/create-post" className="btn-primary w-full justify-center">
          <i className="fas fa-pencil-alt" aria-hidden="true"></i> Write a post
        </Link>
      </div>
    </aside>
  );
};

export default Aside;
