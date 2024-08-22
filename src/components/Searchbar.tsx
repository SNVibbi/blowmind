import React, { useState } from "react";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useRouter } from "next/router";

interface SearchbarProps {
    setMobileMenu: React.Dispatch<React.SetStateAction<boolean>>
    
}

const Searchbar: React.FC<SearchbarProps> = ({ setMobileMenu }) => {
    const [term, setTerm] = useState<string>("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        router.push(`/search?q=${term}`);
        setTerm("");
        setMobileMenu(false);
    };

    return (
        <div className="w-full">
            <form 
                className="flex items-center p-2 my-6 border-2 border-gray-300 dark:border-gray-700 rounded-lg gap-2" 
                onSubmit={handleSubmit}
            >
                <i className="fas fa-search text-gray-600 dark:text-gray-400"></i>
                <input 
                    type="text" 
                    onChange={(e) => setTerm(e.target.value)} 
                    value={term} 
                    required 
                    placeholder="Explore Blowmind..." 
                    className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-200" 
                />
            </form>
        </div>
    );
};

export default Searchbar;