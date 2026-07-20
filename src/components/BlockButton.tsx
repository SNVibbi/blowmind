import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useBlockedUsers } from "../hooks/useBlockedUsers";
import { blockUser, unblockUser } from "../lib/blockService";
import { getErrorMessage } from "../lib/errors";
import { toast } from "react-toastify";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface BlockButtonProps {
  targetUid: string;
  targetName?: string;
  className?: string;
}

/**
 * Block/unblock the author of a post. Hidden for signed-out users and for
 * your own content. Filtering of blocked authors happens in the feed and
 * comment lists via useBlockedUsers.
 */
export default function BlockButton({
  targetUid,
  targetName,
  className,
}: BlockButtonProps) {
  const { user } = useAuthContext();
  const { blockedSet } = useBlockedUsers();
  const [isPending, setIsPending] = useState(false);

  if (!user || user.uid === targetUid) return null;

  const blocked = blockedSet.has(targetUid);

  const handleClick = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      if (blocked) {
        await unblockUser(user.uid, targetUid);
        toast.success(`Unblocked${targetName ? ` ${targetName}` : ""}.`);
      } else {
        await blockUser(user.uid, targetUid);
        toast.success(
          `Blocked${targetName ? ` ${targetName}` : ""}. You won't see their posts.`
        );
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={className ?? "text-sm text-gray-500 hover:text-red-600 disabled:opacity-50"}
      aria-pressed={blocked}
      title={blocked ? "Unblock this author" : "Block this author"}
    >
      <i className={`fas ${blocked ? "fa-user-check" : "fa-user-slash"} mr-1`} aria-hidden="true"></i>
      {blocked ? "Unblock" : "Block"}
    </button>
  );
}
