'use client';

import Link from "next/link";
import Image from "next/image";
import { useAuthContext } from "../context/AuthContext";
import useLogout from "../hooks/useLogout";
import CustomSkeleton from "../components/CustomSkeleton"
import useTheme from "../hooks/useTheme";
import '@fortawesome/fontawesome-free/css/all.min.css';
import Logo from "../../public/img/Blow-Mind.png";
import React, { useState } from "react";

const MainNavbar: React.FC = () => {
  const { user, loading } = useAuthContext();
  const { logout, error, isPending } = useLogout();
  const { state: themeState, changeMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleTheme = () => {
    changeMode(themeState.mode === "light" ? "dark" : "light");
  };

  return (
    <nav className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 shadow-md">
      <div className="flex items-center text-indigo-600 dark:text-white">
        <span className="text-lg md:ml-2 md:text-2xl font-bold">
          <Image src={Logo} alt="Blow-mind Logo" className="text-2xl" width={110} height={100} />
        </span>
      </div>
      <div className="md:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-indigo-600 dark:text-white"
        >
          <i className="fas fa-bars text-2xl"></i>
        </button>
      </div>
      <ul className={`flex-col md:flex-row md:flex items-center gap-4 ${isMenuOpen ? 'flex' : 'hidden'}`}>
        <li>
          <Link href="/">
            <button className="text-indigo-600 hover:text-indigo-800 dark:text-white dark:hover:text-gray-300">Home</button>
          </Link>
        </li>
        <li>
          <Link href="#">
            <button className="text-indigo-600 hover:text-indigo-800 dark:text-white dark:hover:text-gray-300">About us</button>
          </Link>
        </li>
        <li>
          <Link href="#">
            <button className="text-indigo-600 hover:text-indigo-800 dark:text-white dark:hover:text-gray-300">Contact</button>
          </Link>
        </li>
        <li>
          <Link href="/blog">
            <button className="text-indigo-600 hover:text-indigo-800 dark:text-white dark:hover:text-gray-300">Blogs</button>
          </Link>
        </li>
        <div className="flex flex-col items-center gap-4 md:block">
                    {loading ? (
                        <CustomSkeleton width={35} height={35} circle={true} />
                    ) : user ? (
                        <>
                            <button
                                onClick={logout}
                                className="px-2 py-1 md:px-4 md:py-2 gap-4 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                disabled={isPending}
                            >
                                {isPending ? "Logging out..." : "Logout"}
                            </button>
                            {error && <div className="text-red-600 mt-4">{error}</div>}
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <button className="px-2 py-1 md:m-3 md:px-4 md:py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-100">Log in</button>
                            </Link>
                            <Link href="/signup">
                                <button className="px-2 py-1 md:px-4 md:py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Sign up</button>
                            </Link>
                        </>
                    )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            {themeState.mode === "light" ? (
              <i className="fas fa-moon"></i>
            ) : (
              <i className="fas fa-sun"></i>
            )}
          </button>
        </div>
      </ul>
    </nav>
  );
}


export default MainNavbar;