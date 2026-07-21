import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRole } from "../hooks/useRole";
import NotificationBell from "./NotificationBell";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface IconLinkProps {
  href: string;
  icon: string;
  label: string;
}

/**
 * Signed-in quick actions. Every item is a real, working link (the old
 * dead "comments" and "notification" buttons were removed). A proper
 * notifications center is tracked as its own feature.
 */
export default function NavbarOption() {
  const { isModerator } = useRole();
  const router = useRouter();

  const IconLink: React.FC<IconLinkProps> = ({ href, icon, label }) => {
    const active = router.pathname === href;
    return (
      <Link
        href={href}
        aria-label={label}
        title={label}
        aria-current={active ? "page" : undefined}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          active
            ? "bg-brand-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        }`}
      >
        <i className={`fas fa-${icon}`} aria-hidden="true"></i>
      </Link>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <IconLink href="/create-post" icon="pen-to-square" label="Write a post" />
      <IconLink href="/bookmark" icon="bookmark" label="Bookmarks" />
      <NotificationBell />
      {isModerator && (
        <IconLink href="/moderation" icon="shield-halved" label="Moderation queue" />
      )}
      <IconLink href="/settings" icon="gear" label="Settings" />
    </div>
  );
}
