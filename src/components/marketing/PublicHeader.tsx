import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import useLogout from "../../hooks/useLogout";
import useTheme from "@/hooks/useTheme";
import CustomSkeleton from "../CustomSkeleton";
import Logo from "../../../public/img/Blow-Mind.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
];

/** Shared marketing/site header used on the landing, about and contact pages. */
export default function PublicHeader() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const { logout, isPending } = useLogout();
  const { state: themeState, changeMode } = useTheme();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);

  const toggleTheme = () =>
    changeMode(themeState.mode === "light" ? "dark" : "light");

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="BlowMind home" className="flex items-center">
          <Image src={Logo} alt="BlowMind" width={120} height={40} priority />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${themeState.mode === "light" ? "dark" : "light"} mode`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <i className={`fas ${themeState.mode === "light" ? "fa-moon" : "fa-sun"}`} aria-hidden="true"></i>
          </button>

          {loading ? (
            <CustomSkeleton width={72} height={36} />
          ) : user ? (
            <button onClick={logout} disabled={isPending} className="btn-secondary hidden sm:inline-flex">
              {isPending ? "Logging out…" : "Log out"}
            </button>
          ) : (
            <>
              <Link href="/login" className="btn-secondary hidden sm:inline-flex">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 md:hidden"
          >
            <i className={`fas ${open ? "fa-times" : "fa-bars"} text-lg`} aria-hidden="true"></i>
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      {open && (
        <ul className="border-t border-gray-200 px-4 py-2 dark:border-gray-800 md:hidden">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive(item.href)
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
          {!loading && !user && (
            <li>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Log in
              </Link>
            </li>
          )}
        </ul>
      )}
    </header>
  );
}
