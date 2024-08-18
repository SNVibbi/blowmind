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
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-hidden">
            <div className="m-6 mb-8">
                {response.error && <div className="text-red-500">An error occurred</div>}
                <h2 className="text-xl font-bold mb-4">Interests</h2>
                <p className="text-base mb-6">
                    Posts are personalized based on your interests and search history. Learn how this works.
                </p>
                <ul className="flex flex-wrap gap-4 justify-center">
                    {interests.map((int, index) => (
                        <li
                            key={int.value}
                            onClick={() => handleClick(int.value, index)}
                            className={`flex items-center p-4 rounded-lg cursor-pointer border-2 ${isClicked[index] ? 'border-blue-500' : 'border-transparent'} bg-gray-200 dark:bg-gray-800 transition-all duration-300`}
                        >
                            <Image src={int.src} alt={int.value} width={100} height={100} className="w-20 h-20 object-cover rounded" />
                            <p className="ml-4 text-base text-gray-800 dark:text-gray-200">{int.value}</p>
                            {isClicked[index] && <i className="ml-auto fas fa-check-circle text-blue-500"></i>}
                        </li>
                    ))}
                </ul>
                <div className="text-center mt-6">
                    <button className={`px-6 py-2 rounded bg-[${color}] text-indigo-400`} onClick={handleSubmit}>
                        Confirm Interests
                    </button>
                </div>
            </div>
        </div>
    );
}

export default InterestComponent;
