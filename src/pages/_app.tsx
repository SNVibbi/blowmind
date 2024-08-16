import type { AppProps } from "next/app";
import "../../styles/globals.css";
import { AuthContextProvider, useAuthContext } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import React, { useEffect, useState } from "react";

function MyApp({ Component, pageProps }: AppProps) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    const changeWidth = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", changeWidth);

    return () => {
      window.removeEventListener("resize", changeWidth);
    };
  }, []);

  return (
    <AuthContextProvider>
      <ThemeProvider>
        <Component {...pageProps} screenWidth={screenWidth} mobileMenu={mobileMenu} setIsMenuOpen={setMobileMenu} />
      </ThemeProvider>
    </AuthContextProvider>
  );
}

export default MyApp;
