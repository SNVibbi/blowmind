import React, { useEffect, useState } from "react";
import BlogNavbar from "./BlogNavbar";
import Footer from "./Footer";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Standard signed-in page frame: responsive BlogNavbar + content + Footer,
 * with the screen-width / mobile-menu state managed internally so pages
 * don't each re-implement the boilerplate (and none end up nav-less).
 */
export default function AppShell({ children }: AppShellProps) {
  const [screenWidth, setScreenWidth] = useState(1024);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <BlogNavbar
        screenWidth={screenWidth}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
      />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
