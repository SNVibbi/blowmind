import React from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "../../public/img/Blow-Mind.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const COLUMNS = [
  {
    heading: "Explore",
    links: [
      { label: "Feed", href: "/blog" },
      { label: "Write a post", href: "/create-post" },
      { label: "Bookmarks", href: "/bookmark" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/signup" },
      { label: "Settings", href: "/settings" },
    ],
  },
];

export default function Footer() {
  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="border-t border-gray-200 bg-white text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Image src={Logo} alt="BlowMind" width={140} height={46} />
          <p className="mt-3 max-w-xs text-sm">
            Write, read, and connect with great minds.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h5 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-gray-100">
              {col.heading}
            </h5>
            <ul className="space-y-2 text-sm">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-brand-600 dark:hover:text-brand-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 py-6 dark:border-gray-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm">
          <p>&copy; {new Date().getFullYear()} BlowMind. All rights reserved.</p>
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
          >
            <i className="fas fa-arrow-up" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </footer>
  );
}
