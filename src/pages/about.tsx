import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import PublicHeader from "../components/marketing/PublicHeader";
import Footer from "../components/Footer";
import AboutImage from "../../public/img/about3.jpg";
import "@fortawesome/fontawesome-free/css/all.min.css";

const VALUES = [
  {
    icon: "users",
    title: "Community first",
    body: "An inclusive, welcoming space where diverse voices and perspectives are celebrated.",
  },
  {
    icon: "shield-halved",
    title: "Safe by design",
    body: "Moderation, reporting, rate limiting and spam protection keep conversations healthy.",
  },
  {
    icon: "pen-nib",
    title: "Writing you own",
    body: "Your posts are yours. Publish, edit, and manage your content on your terms.",
  },
  {
    icon: "bolt",
    title: "Fast & reliable",
    body: "A paginated feed, optimized media, and offline-aware UI that works on any device.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About · BlowMind</title>
        <meta
          name="description"
          content="BlowMind is a modern social blogging platform — a haven for text-based content and a welcoming community of writers and readers."
        />
      </Head>

      <div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <PublicHeader />

        <section className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            About BlowMind
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            BlowMind is a multi-functional platform where authors and readers
            meet. It&apos;s a traditional bookworm&apos;s haven and a home for
            text-based content — built to help great ideas find the people who
            care about them.
          </p>
        </section>

        <section className="bg-gray-50 dark:bg-gray-800/50">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2">
            <Image
              src={AboutImage}
              alt="A community of readers and writers"
              className="rounded-2xl shadow-md"
              placeholder="blur"
            />
            <div>
              <h2 className="text-3xl font-bold">Our mission</h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Our vision is to foster an inclusive and vibrant community where
                diversity is celebrated. We encourage open-mindedness and respect
                for all individuals, regardless of their backgrounds or beliefs.
              </p>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                By promoting dialogue and understanding, we strive to create a
                welcoming space where everyone can pour out their thoughts and
                feelings in the form of writing.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">What we value</h2>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {VALUES.map((v) => (
              <li key={v.title} className="card flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                  <i className={`fas fa-${v.icon}`} aria-hidden="true"></i>
                </div>
                <div>
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {v.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-20 text-center">
          <div className="card bg-gradient-to-br from-brand-600 to-accent-500 text-white">
            <h2 className="text-2xl font-bold">Ready to share your voice?</h2>
            <p className="mx-auto mt-2 max-w-md text-white/90">
              Join BlowMind today and start writing, reading, and connecting.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="btn bg-white text-brand-700 hover:bg-white/90">
                Create account
              </Link>
              <Link href="/contact" className="btn border border-white/70 text-white hover:bg-white/10">
                Contact us
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
