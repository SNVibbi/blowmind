import Head from "next/head";
import { useState } from "react";
import PublicHeader from "../components/marketing/PublicHeader";
import Footer from "../components/Footer";
import { submitContactMessage } from "../lib/contactService";
import { getErrorMessage } from "../lib/errors";
import { useAuthContext } from "../context/AuthContext";
import "@fortawesome/fontawesome-free/css/all.min.css";

const CHANNELS = [
  { icon: "envelope", label: "Email", value: "hello@blowmind.app" },
  { icon: "circle-question", label: "Support", value: "Use the form — we reply within 2 business days" },
  { icon: "shield-halved", label: "Report abuse", value: "Use the report button on any post" },
];

export default function ContactPage() {
  const { user } = useAuthContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    setIsPending(true);
    try {
      await submitContactMessage({ name, email, message });
      setSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact · BlowMind</title>
        <meta
          name="description"
          content="Get in touch with the BlowMind team. Questions, feedback, or support — we'd love to hear from you."
        />
      </Head>

      <div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <PublicHeader />

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Get in touch
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-300">
              Questions, feedback, or just want to say hello? Send us a message.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-5">
            {/* Channels */}
            <ul className="space-y-4 md:col-span-2">
              {CHANNELS.map((c) => (
                <li key={c.label} className="card flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                    <i className={`fas fa-${c.icon}`} aria-hidden="true"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold">{c.label}</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {c.value}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Form */}
            <div className="md:col-span-3">
              {sent ? (
                <div className="card text-center" role="status">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/40">
                    <i className="fas fa-check text-xl" aria-hidden="true"></i>
                  </div>
                  <h2 className="text-xl font-bold">Message sent</h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Thanks for reaching out — we&apos;ll get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card space-y-4">
                  {error && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
                      {error}
                    </p>
                  )}
                  <div>
                    <label htmlFor="c-name" className="mb-1 block text-sm font-medium">
                      Name
                    </label>
                    <input
                      id="c-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={100}
                      className="input-field"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="c-email" className="mb-1 block text-sm font-medium">
                      Email
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={200}
                      className="input-field"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="c-message" className="mb-1 block text-sm font-medium">
                      Message
                    </label>
                    <textarea
                      id="c-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      minLength={10}
                      maxLength={5000}
                      rows={6}
                      className="input-field"
                      placeholder="How can we help?"
                    />
                  </div>
                  <button type="submit" disabled={isPending} className="btn-primary w-full">
                    {isPending ? "Sending…" : "Send message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
