import React from "react";
import Image from "next/image";
import Logo from "../../public/img/Blow-Mind.png";
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="py-4 px-2 md:py-8 md:px-4 lg:py-10 lg:px-6 bg-gray-800 text-white">
      <div className="max-w-3xl mx-auto md:max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex items-center gap-4 text-indigo-600">
          <span className="text-xl md:text-2xl font-bold">
            <Image src={Logo} alt="Logo" className="text-2xl" width={150} height={100} />
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
  );
}
