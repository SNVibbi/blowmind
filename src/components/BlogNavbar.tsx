import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useAuthContext } from "../context/AuthContext";
import Logo from "../../public/img/Blow-Mind.png";
import Image from "next/image";
import Avatar from "./Avatar";
import "@fortawesome/fontawesome-free/css/all.min.css";
import NavbarOption from "./NavbarOption";
import useTheme from "@/hooks/useTheme";
import { useFocusTrap } from "../hooks/useFocusTrap";

interface BlogNavbarProps {
    screenWidth: number;
    mobileMenu: boolean;
    setMobileMenu: (value: boolean) => void;
}

export default function BlogNavbar({ screenWidth, mobileMenu, setMobileMenu }: BlogNavbarProps) {
    const { user } = useAuthContext();
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const [greeting, setGreeting] = useState("");
    const { state: themeState, changeMode } = useTheme();

    useEffect(() => {
        const currentHour = new Date().getHours();
        if (currentHour < 12) {
            setGreeting("Good Morning");
        } else if (currentHour < 18) {
            setGreeting("Good Afternoon");
        } else {
            setGreeting("Good Evening");
        }
    }, []);

    const closeMenu = useCallback(() => setMobileMenu(false), [setMobileMenu]);

    // Keyboard focus trap, Escape-to-close, and body-scroll lock while open.
    useFocusTrap(mobileMenuRef, mobileMenu && screenWidth < 640, closeMenu);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setMobileMenu(false);
            }
        };

        if (mobileMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [mobileMenu, setMobileMenu]);

    const toggleTheme = () => {
        changeMode(themeState.mode === "light" ? "dark" : "light");
    };

    const handleMenuItemClick = () => {
        setMobileMenu(false); 
    };

    return (
        <nav className="flex items-center p-4 bg-white dark:bg-gray-800 shadow-md relative">
            <div className="flex items-center justify-between w-full">
                {screenWidth < 640 && (
                    <button
                        className="flex h-11 w-11 items-center justify-center text-indigo-600 dark:text-white"
                        onClick={() => setMobileMenu(!mobileMenu)}
                        aria-label={mobileMenu ? "Close menu" : "Open menu"}
                        aria-expanded={mobileMenu}
                        aria-controls="mobile-menu"
                    >
                        <i className={`fas ${mobileMenu ? 'fa-times' : 'fa-bars'} text-xl`} aria-hidden="true"></i>
                    </button>
                )}
                {screenWidth >= 640 && (
                    <Link href="/">
                        <button className="flex items-center ml-2" aria-label="Home">
                            <Image src={Logo} alt="Logo" width={100} height={100} />
                        </button>
                    </Link>
                )}
                {screenWidth >= 640 && (
                    <div className="flex items-center">
                        <span className="ml-4 hidden md:inline-block text-gray-800 dark:text-gray-300">
                            {greeting}, {user ? user.displayName : "Guest"}!
                        </span>
                        <ul className="flex items-center gap-4 bg-gray-100 dark:bg-gray-700 rounded-md p-2 ml-4">
                            <li>
                                <Link href="/blog">
                                    <button className="text-gray-800 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors duration-300">
                                        Explore
                                    </button>
                                </Link>
                            </li>
                        </ul>
                        {user && <NavbarOption />}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 ml-4"
                            aria-label={`Switch to ${themeState.mode === "light" ? "dark" : "light"} mode`}
                        >
                            {themeState.mode === "light" ? (
                                <i className="fas fa-moon"></i>
                            ) : (
                                <i className="fas fa-sun"></i>
                            )}
                        </button>
                        {user ? (
                            <Link href="/profile" className="ml-2 flex items-center gap-2" aria-label="Profile">
                                <span className="text-gray-800 dark:text-gray-300 hidden sm:inline-block">
                                    {user.displayName}
                                </span>
                                <Avatar src={user.photoURL} alt={user.displayName || "User Avatar"} />
                            </Link>
                        ) : (
                            <div className="ml-4 flex items-center gap-2">
                                <Link href="/login" className="btn-secondary">Log in</Link>
                                <Link href="/signup" className="btn-primary">Sign up</Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {mobileMenu && screenWidth < 640 && (
                <div
                    ref={mobileMenuRef}
                    id="mobile-menu"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Main menu"
                    className="fixed flex flex-col top-0 left-0 w-full h-full bg-gray-200 dark:bg-gray-800 z-50 p-4 transition-transform transform ease-in-out duration-300"
                    style={{ transform: mobileMenu ? "translateX(0)" : "translateX(-100%)" }}
                >
                    <button
                        onClick={handleMenuItemClick}
                        aria-label="Close menu"
                        className="self-end flex h-11 w-11 items-center justify-center text-gray-800 dark:text-gray-200"
                    >
                        <i className="fas fa-times text-xl" aria-hidden="true"></i>
                    </button>
                    <Link href="/">
                        <button className="flex items-center mb-2" aria-label="Home" onClick={handleMenuItemClick}>
                            <Image src={Logo} alt="Logo" width={70} height={70} />
                        </button>
                    </Link>
                    <span className="mb-2 text-gray-700 dark:text-gray-300">
                        {greeting}, {user ? user.displayName : "Guest"}!
                    </span>
                    <ul className="mt-2 flex flex-col items-start gap-4">
                        <li>
                            <Link
                                href="/blog"
                                onClick={handleMenuItemClick}
                                className="text-gray-800 hover:text-brand-600 dark:text-gray-200 dark:hover:text-brand-400"
                            >
                                Explore
                            </Link>
                        </li>
                        {user ? (
                            <>
                                <li>
                                    <Link href="/create-post" onClick={handleMenuItemClick} className="text-gray-800 hover:text-brand-600 dark:text-gray-200">Write a post</Link>
                                </li>
                                <li>
                                    <Link href="/bookmark" onClick={handleMenuItemClick} className="text-gray-800 hover:text-brand-600 dark:text-gray-200">Bookmarks</Link>
                                </li>
                                <li>
                                    <Link href="/notifications" onClick={handleMenuItemClick} className="text-gray-800 hover:text-brand-600 dark:text-gray-200">Notifications</Link>
                                </li>
                                <li>
                                    <Link href="/settings" onClick={handleMenuItemClick} className="text-gray-800 hover:text-brand-600 dark:text-gray-200">Settings</Link>
                                </li>
                                <li>
                                    <Link href="/profile" onClick={handleMenuItemClick} className="flex items-center gap-2 text-gray-900 dark:text-gray-100" aria-label="Profile">
                                        <Avatar src={user.photoURL} alt={user.displayName || "User Avatar"} />
                                        <span>{user.displayName}</span>
                                    </Link>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link href="/login" onClick={handleMenuItemClick} className="btn-secondary">Log in</Link>
                                </li>
                                <li>
                                    <Link href="/signup" onClick={handleMenuItemClick} className="btn-primary">Sign up</Link>
                                </li>
                            </>
                        )}
                        <button
                            onClick={() => {
                                toggleTheme();
                                handleMenuItemClick();
                            }}
                            className="mt-2 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            aria-label={`Switch to ${themeState.mode === "light" ? "dark" : "light"} mode`}
                        >
                            {themeState.mode === "light" ? (
                                <i className="fas fa-moon"></i>
                            ) : (
                                <i className="fas fa-sun"></i>
                            )}
                        </button>
                    </ul>
                </div>
            )}
        </nav>
    );
}
