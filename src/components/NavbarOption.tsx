import React from "react";
import Link from "next/link";
import { useRole } from "../hooks/useRole";
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function NavbarOption() {
    const { isModerator } = useRole();

    return (
        <div className="flex gap-2 sm:gap-4">
            <button
                type="button"
                className="p-2 ml-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                aria-label="Comments"
            >
                <i className="fas fa-comments" aria-hidden="true"></i>
            </button>
            <button
                type="button"
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                aria-label="Notification"
            >
                <i className="fas fa-bell" aria-hidden="true"></i>
            </button>
            {isModerator && (
                <Link
                    href="/moderation"
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    aria-label="Moderation queue"
                    title="Moderation queue"
                >
                    <i className="fas fa-shield-halved" aria-hidden="true"></i>
                </Link>
            )}
        </div>
    );
}
