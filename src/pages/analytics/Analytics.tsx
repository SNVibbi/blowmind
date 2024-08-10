import Avatar from "../../components/Avatar";
import Reaction from "../../components/Reaction";
import { useDocument } from "../../hooks/useDocument";
import useTheme from "../../hooks/useTheme";
import { Post } from "../../Types";
import Image from "next/image";
import { useRouter } from "next/router";
import Skeleton from "react-loading-skeleton";


export default function Analytics() {
    const router = useRouter();
    const { id } = router.query;
    const { changeMode } = useTheme();
    const { error, document: post } = useDocument<Post>("posts", id as string);

    if (error) {
        return <div className="text-red-600">{error}</div>;
    }

    if (!post) {
        return (
            <div className="loading">
                <Skeleton />
            </div>
        );
    }

    return(
        <div className={`analytics ${changeMode}`}>
            <button 
                className="flex items-center gap-2 text-blue-500" 
                onClick={() => router.back()}
            >
                <i className="fas fa-arrow-left"></i>
                <span>Post Analytics</span>
            </button>

            {post && (
                <div className="">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                        <div className="flex items-center gap-4">
                            <Avatar src={post.author.photoURL} />
                        </div>
                        <div>
                            <span>
                                {post.author.firstName} {post.author.lastName}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                                .{post.createdAt.toDate().toDateString()}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4">
                        {post.imageURL && (
                            <div className="mb-4">
                                <Image 
                                    src={post.imageURL} 
                                    alt="" 
                                    className="rounded-full" 
                                    width={600}
                                    height={400}
                                />
                            </div>
                        )}
                        <p 
                            className="text-gray-800 dark:text-gray-200" 
                            dangerouslySetInnerHTML={{ __html: post.content }} 
                        />
                    </div>
                    <div className="mt-4">
                        <Reaction post={post} />
                    </div>

                    <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <li className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                                <i className="fas fa-eye text-blue-500 dark:text-blue-300"></i>
                            </div>
                            <div>
                                <span className="text-gray-800 dark:text-gray-200">Unique views</span>
                                <p className="text-lg font-bold">{post.views.length}</p>
                            </div>
                        </li>
                        <li className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                                <i className="fas fa-expand-arrows-alt text-blue-500 dark:text-blue-300"></i>
                            </div>
                            <div>
                                <span className="text-gray-800 dark:text-gray-200">Details expands</span>
                                <p className="text-lg font-bold">{post.expands}</p>
                            </div>
                        </li>
                        <li className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                                <i className="fas fa-bookmark text-blue-500 dark:text-blue-300"></i>
                            </div>
                            <div>
                                <span className="text-gray-800 dark:text-gray-200">Bookmarks</span>
                                <p className="text-lg font-bold">{post.bookmarks.length}</p>
                            </div>
                        </li>
                    </ul>

                </div>
            )}

        </div>
    )
}
