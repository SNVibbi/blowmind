"use client";

import Link from "next/link";
import Image from "next/image";
import Card from "../components/Card";
import PublicHeader from "../components/marketing/PublicHeader";
import Footer from "../components/Footer";
import "@fortawesome/fontawesome-free/css/all.min.css";

import Analytic from "../img/analytics.svg";
import Social from "../img/social.svg";
import Content from "../img/content.svg";
import AboutImage from "../../public/img/about2.jpg";
import User1 from "../../public/img/user5.jpg";
import User2 from "../../public/img/user2.jpg";
import User3 from "../../public/img/user3.jpg";

const FEATURES = [
  {
    image: Analytic,
    title: "Analytics",
    body: "Track views, likes and comments, and see how your articles perform over time.",
  },
  {
    image: Social,
    title: "Social interactions",
    body: "Like, comment, bookmark and engage in thoughtful discussions with the community.",
  },
  {
    image: Content,
    title: "Rich content",
    body: "Write clean, appealing posts with images using a simple, distraction-free editor.",
  },
];

const STATS = [
  { value: "Fast", label: "Optimized, paginated feed" },
  { value: "Safe", label: "Moderated & rate-limited" },
  { value: "Yours", label: "Own your words" },
];

export default function Landing() {
  return (
    <div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-500/10 dark:from-brand-900/30 dark:via-gray-900 dark:to-accent-500/10"
        />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
            <i className="fas fa-feather-pointed" aria-hidden="true"></i>
            A haven for text-based content
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Write, read, and connect with{" "}
            <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
              great minds
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            BlowMind is a modern social blogging platform. Share your ideas,
            discover writing based on your interests, and join a welcoming,
            open-minded community.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="btn-primary px-6 py-3 text-base">
              Get started — it&apos;s free
            </Link>
            <Link href="/blog" className="btn-secondary px-6 py-3 text-base">
              Explore the feed
            </Link>
          </div>

          <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="card text-center">
                <dt className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                  {s.value}
                </dt>
                <dd className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Everything you need to share your voice</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Tools built for writers and the readers who love them.
          </p>
        </div>
        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} title={f.title} body={f.body} image={f.image} />
          ))}
        </ul>
      </section>

      {/* About */}
      <section className="bg-gray-50 dark:bg-gray-800/50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">About BlowMind</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              BlowMind is a place where authors and readers meet — a bookworm&apos;s
              haven and a home for text-based content. We foster an inclusive,
              vibrant community where diversity is celebrated and every voice can
              be heard.
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Learn more about us <i className="fas fa-arrow-right" aria-hidden="true"></i>
            </Link>
          </div>
          <Image
            src={AboutImage}
            alt="People writing and reading together"
            className="rounded-2xl shadow-md"
            placeholder="blur"
          />
        </div>
      </section>

      {/* Community / CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="mb-8 flex flex-wrap justify-center gap-6">
          {[User1, User2, User3].map((u, i) => (
            <Image
              key={i}
              src={u}
              alt=""
              width={80}
              height={80}
              className="h-20 w-20 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-800"
            />
          ))}
        </div>
        <h2 className="text-3xl font-bold">Join a community of great minds</h2>
        <p className="mx-auto mt-4 max-w-xl text-gray-600 dark:text-gray-300">
          Share your ideas and read write-ups based on your interests. Connect
          with people who share your goals.
        </p>
        <Link href="/signup" className="btn-primary mt-8 px-6 py-3 text-base">
          Create your account
        </Link>
      </section>

      <Footer />
    </div>
  );
}
