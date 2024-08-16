import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuthContext } from "../context/AuthContext";
import Logo from "../../public/img/Blow-Mind.png";
import Image from "next/image";
import Avatar from "./Avatar";
import "@fortawesome/fontawesome-free/css/all.min.css";
import NavbarOption from "./NavbarOption";
import useTheme from "@/hooks/useTheme";

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
                        className="text-indigo-600 dark:text-white"
                        onClick={() => setMobileMenu(!mobileMenu)}
                        aria-label="Toggle mobile menu"
                    >
                        <i className={`fas ${mobileMenu ? 'fa-times' : 'fa-bars'} text-xl`}></i>
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
                                <Link href="/#blog">
                                    <button className="text-gray-800 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors duration-300">
                                        Explore
                                    </button>
                                </Link>
                            </li>
                        </ul>
                        <NavbarOption />
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
                        {user && (
                            <Link href="/profile">
                                <button className="flex items-center ml-2" aria-label="Profile">
                                    <span className="text-gray-800 dark:text-gray-300 hidden sm:inline-block">
                                        {user.displayName}
                                    </span>
                                    <Avatar src={user.photoURL || "/path/to/default/avatar.png"} alt={user.displayName || "User Avatar"}  />
                                </button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
            {mobileMenu && screenWidth < 640 && (
                <div
                    ref={mobileMenuRef}
                    className="absolute flex flex-col top-0 left-0 w-full h-full bg-gray-200 dark:bg-gray-800 z-50 p-4 transition-transform transform ease-in-out duration-300"
                    style={{ transform: mobileMenu ? "translateX(0)" : "translateX(-100%)" }}
                >
                    <Link href="/">
                        <button className="flex items-center mb-2" aria-label="Home" onClick={handleMenuItemClick}>
                            <Image src={Logo} alt="Logo" width={70} height={70} />
                        </button>
                    </Link>
                    <span className="text-gray-800 dark:text-indigo-800 mb-2">
                        {greeting}, {user ? user.displayName : "Guest"}!
                    </span>
                    <ul className="flex flex-col items-start mt-2 gap-4">
                        <li>
                            <Link href="/#blog">
                                <button
                                    onClick={handleMenuItemClick}
                                    className="text-gray-800 dark:text-indigo-800 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors duration-300"
                                >
                                    Explore
                                </button>
                            </Link>
                        </li>
                        <NavbarOption />
                        {user && (
                            <Link href="/profile">
                                <button
                                    onClick={handleMenuItemClick}
                                    className="flex items-center"
                                    aria-label="Profile"
                                >
                                    <span className="text-gray-900 dark:text-indigo-800 flex">{user.displayName}</span>
                                    <Avatar src={user.photoURL || "/path/to/default/avatar.png"} alt={user.displayName || "User Avatar"} />
                                </button>
                            </Link>
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
