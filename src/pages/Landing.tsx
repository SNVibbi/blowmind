'use client';

import Link from "next/link";
import Image from "next/image";
import { useAuthContext } from "../context/AuthContext";
import  useLogout  from "../hooks/useLogout";
import Card from "../components/Card";
import CustomSkeleton from "../components/CustomSkeleton";
import useTheme from "@/hooks/useTheme";
import '@fortawesome/fontawesome-free/css/all.min.css';
import Logo from "../../public/img/Blow-Mind.png"
import { useState } from "react";

// Image imports
import Analytic from "../img/analytics.svg";
import Social from "../img/social.svg";
import Content from "../img/content.svg";
import HeroImage from "../../public/img/hero-section3.jpg";
import AboutImage from "../../public/img/about2.jpg";
import ReviewImage from "../../public/img/vibbi.jpg";
import User1 from "../../public/img/user5.jpg";
import User2 from "../../public/img/user2.jpg";
import User3 from "../../public/img/user3.jpg";



const cardContents = [
  {
    image: Analytic,
    title: "Analytics",
    body: "Analytics to track the number of views, likes and comments, and also analyze the performance of your articles over a period of time.",
  },
  {
    image: Social,
    title: "Social interactions",
    body: "Users on the platform can interact with posts they like, comment, and engage in discussions.",
  },
  {
    image: Content,
    title: "Content creation",
    body: "Write nice and appealing content with our in-built markdown, a rich text editor.",
  },
];

export default function Landing() {
  const { user, loading } = useAuthContext();
  const { logout, error, isPending } = useLogout();
  const { state: themeState, changeMode } = useTheme();
  const [ isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleTheme = () => {
    changeMode(themeState.mode === "light" ? "dark" : "light");
  };

  const scrollToTop = () => {
    window.scrollTo({ top:0, behavior: "smooth" })
  }

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
       <nav className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex items-center text-indigo-600 dark:text-white">
          <span className="text-lg md:ml-2 md:text-2xl font-bold">
            <Image src={Logo} alt="Blow-mind Logo" className="text-2xl" width={110} height={100}  />
          </span>
        </div>
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-indigo-600 dark:text-white"
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
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

      <section className="flex items-center justify-center mb-3 text-center bg-gray-800 text-white py-6">
        <div>
          <Image 
            src={HeroImage} 
            alt="Welcome message" 
            className="mx-auto opacity-70" />
          <h1 className="text-xl md:text-4xl font-bold mt-4">Welcome to Blowmind: A Haven for Text-Based Content</h1>
          {/* <p className="text-lg md:text-xl mt-2">Unleash the Power of Words, Connect with Like-minded Readers and Writers</p> */}
          <Link href="/blog" >
            <button 
              className="mt-4 px-3 py-1 md:y-2 md:px-6 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
                Get started
            </button>
          </Link>
        </div>
      </section>

      <section className="py-10 px-2 mb-3 md:py-20 md:px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <div className="max-w-2xl md:max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">About Blowmind</h2>
            <p>
              Blowmind is a multi-functional platform where authors and readers can have access to their own content. It aims to be a traditional bookworm’s heaven and a blog to get access to more text-based content. Our vision is to foster an inclusive and vibrant community where diversity is celebrated. <br />
              We encourage open-mindedness and respect for all individuals, regardless of their backgrounds or beliefs. By promoting dialogue and understanding, we strive to create a welcoming space for everyone where each and everyone can pour out there feelings in the form of writing.
            </p>
          </div>
          <div>
            <Image src={AboutImage} alt="About illustration" className="rounded" />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 text-center bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Why you should join Blowmind</h2>
          <p className="text-lg mb-8">
            Our goal is to make writers and readers see our platform as their next heaven for blogging, ensuring ease in interactions, connecting with like-minded peers, having access to favorite content based on interests, and being able to communicate your great ideas with people.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {cardContents.map((c) => (
              <Card key={c.title} title={c.title} body={c.body} image={c.image}/>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-10 px-2 md:py-20 md:px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <div className="max-w-2xl md:max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <Image src={ReviewImage} alt="Review preview" width={250} height={250}  className="rounded-full" />
          </div>
          <div className="px-3">
            <p className="text-lg md:text-xl mb-4">Blowmind has become an integral part of my online experience. As a user of this incredible blogging platform, I have discovered a vibrant community of individuals who are passionate about sharing their ideas and engaging in thoughtful discussions.
            </p>
            <h4 className="text-xl md:text-2xl font-bold">Simeon Vibbi,</h4>
            <span className="text-gray-600">Frontend Engineer</span>
            <Link href="/signup">
              <button className="block mt-4 px-3 py-1 md:px-6 md:py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Join Blowmind</button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 px-2 md:py-20 md:px-4 text-center bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center gap-8 md:gap-14 mb-8">
            <div className="w-24 md:w-32 lg:w-40">
                <Image src={User1} alt="user" className="rounded-2xl object-cover w-full h-full" width={200} height={200} />
            </div>
            <div className="w-24 md:w-32 lg:w-40">
                <Image src={User2} alt="user" className="rounded-2xl object-cover w-full h-full" width={200} height={200} />
            </div>
            <div className="w-24 md:w-32 lg:w-40">
                <Image src={User3} alt="user" className="rounded-2xl object-cover w-full h-full" width={200} height={200} />
            </div>
        </div>
        <h2 className="text-xl md:text-3xl font-bold mb-4">Write, read and connect with great minds on Blowmind</h2>
        <p className="text-sm md:text-lg mb-8">
            Share your great ideas, and also read write-ups based on your interests. Connect with people of the same interests and goals.
        </p>
        <Link href="/blog">
            <button className="px-3 py-1 md:px-6 md:py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Get started</button>
        </Link>
    </div>
      </section>

      <footer className="py-4 px-2 md:py-8 md:px-4 bg-gray-800 text-white">
          <div className="max-w-3xl mx-auto md:max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-4 text-indigo-600">
              <span className="text-xl md:text-2xl font-bold">
                <Image src={Logo} alt="Logo" className="text-2xl" width={150} height={100}  />
              </span>
            </div>
            <div className="flex space-x-6 justify-evenly md:space-x-20 lg:space-x-32">
              <ul>
                <h5 className="text-xl font-bold mb-4">Explore</h5>
                <li className="mb-2">Community</li>
                <li className="mb-2">Trending blogs</li>
                <li className="mb-2">Blowmind for teams</li>
              </ul>
              <ul>
                <h5 className="text-xl font-bold mb-4">Support</h5>
                <li className="mb-2">Support docs</li>
                <li className="mb-2">Join Slack</li>
                <li className="mb-2">Contact</li>
              </ul>
              <ul>
                <h5 className="text-xl font-bold mb-4">Official blog</h5>
                <li className="mb-2">Community blog</li>
                <li className="mb-2">Engineering blog</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400">
            <p>&copy; 2024 by KontriDev. All rights reserved.</p>
            <button 
              onClick={scrollToTop} 
              className="p-2 mt-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
            >
              <i className="fas fa-arrow-up"></i>
            </button>
        </div>
     </footer>
    </div>
  );
}
function changeMode(arg0: string) {
  throw new Error("Function not implemented.");
}

