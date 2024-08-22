import Avatar from "../../components/Avatar";
import PostList from "../../components/PostList";
import { useAuthContext } from "../../context/AuthContext";
import { useCollection } from "../../hooks/useCollection";
import { useDocument } from "../../hooks/useDocument";
import useTheme from "../../hooks/useTheme";
import { Post } from "../../Types";
import { useEffect, useState } from "react";

interface ProfileProps {}

const Profile: React.FC<ProfileProps> = () => {
    const { user }: any = useAuthContext();
    const userId = user?.uid;
    const { color }: any = useTheme();
    const { error, document: CurrentUser } = useDocument<{
        firstName: string;
        lastName: string;
        interests: string[];
        headline: string;
        photoURL: string;
    }>("users", userId);
    

    const [isTabbed, setIsTabbed] = useState(true);
    const [localColor, setLocalColor] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window !== "undefined") {
            setLocalColor(localStorage.getItem("color"));
        }
    }, []);

        const { documents: posts } = useCollection<Post>(
            "posts",
            userId ? ["author.id","==",userId] : null
        );

    const { documents: bookmarks } = useCollection<Post>(
        "bookmarks", 
        userId ? ["userId","==",userId] : null
    );

    if (error) {
        return <div className="text-red-600">{error}</div>;
    }

    return (
        <>
            {CurrentUser && (
                <div className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <div className="relative h-32 bg-gradient-to-r from-yellow-300 to-pink-300 rounded-t-lg flex items-center justify-center">
                        <Avatar src={CurrentUser.photoURL || ""} className="absolute -bottom-8 w-20 h-20 " />
                    </div>

                    <div className="pt-16">
                        <h2 className="text-xl font-semibold text-center md:text-left">
                            {CurrentUser.firstName} {CurrentUser.lastName}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-center md:text-left">
                            Sierra Leone
                        </p>

                        <ul className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2 justify-center md:justify-start text-center md:text-left">
                            <li className="text-gray-600 dark:text-gray-400">@{CurrentUser.firstName.toLowerCase()}</li>
                            <span className="hidden md:inline-block text-gray-600 dark:text-gray-400">
                                .
                            </span>
                            <li>{CurrentUser.headline}</li>
                        </ul>

                        <div className="flex flex-col md:flex-row gap-4 mt-4 justify-center md:justify-start">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Message
                            </button>
                            <button
                                className="px-4 py-2 text-white rounded flex items-center gap-2"
                                style={{
                                    backgroundColor: localColor || color,
                                }}
                            >
                                <i className="fas fa-share-square"></i>
                                <span className="text-indigo-400">Share profile</span>
                            </button>
                        </div>

                        <div className="mt-6">
                            <h2 className="text-lg font-semibold">Interests</h2>
                            <ul className="flex gap-2 mt-2 flex-wrap justify-center md:justify-start">
                                {CurrentUser.interests.map((i: string) => (
                                    <li
                                        key={i}
                                        className="px-2 py-1 bg-gray-200 text-indigo-400 dark:bg-gray-700 rounded"
                                    >
                                        {i}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <ul className="flex gap-4 mt-4 justify-center md:justify-start">
                            <li
                                className={`cursor-pointer ${
                                    isTabbed ? "underline" : ""
                                }`}
                                onClick={() => setIsTabbed(true)}
                            >
                                Posts
                            </li>
                            <li
                                className={`cursor-pointer ${
                                    !isTabbed ? "underline" : ""
                                }`}
                                onClick={() => setIsTabbed(false)}
                            >
                                Bookmarks
                            </li>
                        </ul>
                        {isTabbed ? (
                            posts && (
                                <PostList
                                    posts={posts}
                                    msg="Posts you've made will appear here"
                                />
                            )
                        ) : (
                            <PostList
                                posts={bookmarks}
                                msg="No posts in your bookmarks"
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Profile;
