import { useAuthContext } from "@/context/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import useTheme from "../hooks/useTheme";
import { useState } from "react";
import Image from "next/image";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useRouter } from "next/router";

interface Interest {
    src: string;
    value: string;
}

const interests: Interest[] = [
    { src: "/img/tech.jpg", value: "Technology" },
    { src: "/img/music.jpg", value: "Entertainment" },
    { src: "/img/sport.jpg", value: "Sport" },
    { src: "/img/art.jpg", value: "Art" },
    { src: "/img/reading.jpg", value: "Reading" },
];

const InterestComponent: React.FC = () => {
    const router = useRouter();
    const { color }: any = useTheme();
    const { user }: any = useAuthContext();
    const { updateDocument, response } = useFirestore("users");

    const [isClicked, setIsClicked] = useState<{ [key: number]: boolean }>({});
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const handleClick = (interest: string, index: number) => {
        setIsClicked((state) => ({
            ...state,
            [index]: !state[index],
        }));

        setSelectedInterests((prevInterests) =>
            prevInterests.includes(interest)
                ? prevInterests.filter((i) => i !== interest)
                : [...prevInterests, interest]
        );
    };

    const handleSubmit = async () => {
        await updateDocument(user.uid, {
            interests: selectedInterests,
        });

        router.push("/blog")
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-hidden md:flex md:justify-center md:items-center">
            <div className="m-2 md:m-4 lg:m-6 mb-4 max-w-3xl w-full">
                {response.error && <div className="text-red-500 text-center mb-4">An error occurred</div>}
                <h2 className="text-xl mt-6 md:text-2xl lg:text-3xl font-bold mb-4 text-center">Select Your Interests</h2>
                <p className="text-base m-4 md:text-lg lg:text-xl text-center mb-6">
                    Posts are personalized based on your interests and search history. Learn how this works.
                </p>
                <ul className="flex flex-wrap gap-8 md:gap-16 lg:gap-10">
                    {interests.map((int, index) => (
                        <li
                            key={int.value}
                            onClick={() => handleClick(int.value, index)}
                            className={`flex items-center p-4 rounded-lg cursor-pointer border-2 ${isClicked[index] ? 'border-blue-500' : 'border-transparent'} bg-gray-200 dark:bg-gray-800 transition-all duration-300 w-28 md:w-40 lg:w-40`}
                        >
                            <Image 
                                src={int.src} 
                                alt={int.value} 
                                width={100} 
                                height={100} 
                                className="w-full h-24 md:h-34 lg:h-40 object-cover rounded" 
                            />
                            <p className="mt-2 text-sm md:text-base text-gray-800 dark:text-gray-200 text-center">
                                {int.value}
                            </p>
                            {isClicked[index] && <i className="fas fa-check-circle text-blue-500 "></i>}
                        </li>
                    ))}
                </ul>
                <div className="text-center mt-6">
                    <button 
                        className={`px-6 py-2 rounded bg-[${color}] text-indigo-400 hover:bg-blue-600 transition duration-300`} 
                        onClick={handleSubmit}
                    >
                        Confirm Interests
                    </button>
                </div>
            </div>
        </div>
    );
}

export default InterestComponent;
