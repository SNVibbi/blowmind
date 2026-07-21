import React, { useState } from "react";
import { useRouter } from "next/router";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface SearchbarProps {
  setMobileMenu?: React.Dispatch<React.SetStateAction<boolean>>;
  initialTerm?: string;
}

const Searchbar: React.FC<SearchbarProps> = ({ setMobileMenu, initialTerm = "" }) => {
  const [term, setTerm] = useState<string>(initialTerm);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setMobileMenu?.(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 shadow-sm transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-800"
    >
      <i className="fas fa-search text-gray-400" aria-hidden="true"></i>
      <label htmlFor="site-search" className="sr-only">
        Search posts
      </label>
      <input
        id="site-search"
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search posts, tags, or people…"
        className="w-full bg-transparent text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-200"
      />
      {term && (
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-3 py-1 text-sm font-medium text-white hover:bg-brand-700"
        >
          Search
        </button>
      )}
    </form>
  );
};

export default Searchbar;
