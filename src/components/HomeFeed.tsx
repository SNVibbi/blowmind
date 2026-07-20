import BlogNavbar from "@/components/BlogNavbar";
import Aside from "./Aside";
import Interest from "../pages/interest";
import PostList from "./PostList";
import { useAuthContext } from "../context/AuthContext";
import { useDocument } from "../hooks/useDocument";
import { usePaginatedPosts } from "../hooks/usePaginatedPosts";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Footer from "./Footer";
import Searchbar from "@/components/Searchbar";

type swProps = {
    sw: number;
};

const Home: React.FC<swProps> = ({ sw }) => {
    const { user } = useAuthContext();
    const router = useRouter();
    const { posts, error: postError, isPending: postPending, hasMore, loadMore } = usePaginatedPosts();

    const { document: currentUser } = useDocument<{ interests: string[] }>(
        "users",
        user?.uid
    );

    const [mobileMenu, setMobileMenu] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push("/");
        }
    }, [user, router]);

    if (postError) return <div className="text-red-500" role="alert">{postError}</div>;
    if (postPending && !posts) return <div className="text-center mt-4" role="status">Loading…</div>;

    return (
        <>
        <div className="flex flex-col lg:flex-col">
            <BlogNavbar screenWidth={sw} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} />
            <Searchbar setMobileMenu={setMobileMenu}/>
            <div className={`flex-1 p-4 ${sw > 1050 ? 'lg:flex lg:flex-col lg:space-x-4' : 'flex flex-row space-y-4'} mb-4`}>
                {currentUser && (currentUser.interests ?? []).length === 0 && <Interest />}
                {posts && (
                    <>
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-indigo-200">Feed</h1>
                                    <p className="text-gray-600 dark:text-indigo-300">Explore different content</p>
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={() => router.push("/create-post")}
                                >
                                    <i className="fas fa-pencil-alt" aria-hidden="true"></i>
                                    <span className="hidden sm:inline">Write a post</span>
                                    <span className="sm:hidden">Post</span>
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
                            {hasMore && (
                                <div className="text-center mt-6">
                                    <button
                                        onClick={loadMore}
                                        disabled={postPending}
                                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                                    >
                                        {postPending ? "Loading…" : "Load more posts"}
                                    </button>
                                </div>
                            )}
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
