import type { AppProps } from "next/app";
import Head from "next/head";
import "../../styles/globals.css";
import { AuthContextProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import React, { useEffect, useState } from "react";
import ToastConfig from "@/components/ToastConfig";
import ErrorBoundary from "@/components/ErrorBoundary";
import NetworkBanner from "@/components/NetworkBanner";

const SITE_TITLE = "BlowMind — Write, read, and connect with great minds";
const SITE_DESCRIPTION =
  "A modern social blogging platform. Share your ideas, discover writing based on your interests, and connect with like-minded readers and writers.";

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
        <Head>
          <title>{SITE_TITLE}</title>
          <meta name="description" content={SITE_DESCRIPTION} />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="BlowMind" />
          <meta property="og:title" content={SITE_TITLE} />
          <meta property="og:description" content={SITE_DESCRIPTION} />
          <meta property="og:image" content="/og-image.png" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={SITE_TITLE} />
          <meta name="twitter:description" content={SITE_DESCRIPTION} />
          <meta name="twitter:image" content="/og-image.png" />
        </Head>
        <ToastConfig />
        <NetworkBanner />
        <ErrorBoundary>
          <Component
            {...pageProps}
            screenWidth={screenWidth}
            mobileMenu={mobileMenu}
            setIsMenuOpen={setMobileMenu}
          />
        </ErrorBoundary>
      </ThemeProvider>
    </AuthContextProvider>
  );
}

export default MyApp;
