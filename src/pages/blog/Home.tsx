import BlogNavbar from "@/components/BlogNavbar";
import Aside from "../../components/Aside";
import Interest from "../../components/Interest";
import PostList from "../../components/PostList";
import { useAuthContext } from "../../context/AuthContext";
import { useCollection } from "../../hooks/useCollection";
import { Post, User } from "../../Types";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Footer from "../../components/Footer";

type swProps = {
    sw: number;
};

const Home: React.FC<swProps> = ({ sw }) => {
    const { user } = useAuthContext();
    const router = useRouter();
    const { documents: posts, error: postError, isPending: postPending } = useCollection<Post>("posts");
    const { documents: users } = useCollection<User>("users");

    const currentUser = users?.find((u: any) => u.id === user?.uid);

    const [mobileMenu, setMobileMenu] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push("/");
        }
    }, [user, router]);

    if (postError) return <div className="text-red-500">{postError}</div>;
    if (postPending) return <div className="text-center mt-4">Loading...</div>;

    return (
        <>
        <div className="flex flex-col lg:flex-col">
            <BlogNavbar screenWidth={sw} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} />
            <div className={`flex-1 p-4 ${sw > 1050 ? 'lg:flex lg:flex-col lg:space-x-4' : 'flex flex-row space-y-4'} mb-4`}>
                {currentUser && currentUser.interests.length === 0 && <Interest />}
                {posts && (
                    <>
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-indigo-200">Feed</h1>
                                    <p className="text-gray-600 dark:text-indigo-300">Explore different content</p>
                                </div>
                                <button
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center"
                                    onClick={() => router.push("/create-post")}
                                >
                                    <i className="fas fa-pencil-alt"></i>
                                    <span className="ml-2 hidden sm:inline">Post a content</span>
                                    <span className="ml-2 sm:hidden">Post</span>
                                </button>
                            </div>
                            <ul className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-lg p-4">
                                <li>
                                    <button className="text-blue-500 border-b-2 border-blue-500">For you</button>
                                </li>
                                <li>
                                    <button className="text-gray-600 dark:text-gray-300">Featured</button>
                                </li>
                                <li>
                                    <button className="text-gray-600 dark:text-indigo-300">Recent</button>
                                </li>
                            </ul>
                            <PostList posts={posts} msg="No posts yet!" />
                        </div>
                        {sw > 1050 && <Aside />}
                    </>
                )}
            </div>
        </div>
        <Footer/>
        </>
    );
};

export default Home;
