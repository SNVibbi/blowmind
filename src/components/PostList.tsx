import { useAuthContext } from "../context/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { useReadTime } from "../hooks/useReadTime";
import { Post } from "../Types";
import Link from "next/link";
import React, { useState } from "react";
import Avatar from "../components/Avatar";
import BookmarkIcon from "../components/BookmarkIcon";
import Options from "../components/Options";
import DefaultAvatar from "../../public/img/default-avatar.jpg"
import Image from "next/image";
import Reaction from "../components/Reaction";
import { toast } from "react-toastify";


interface PostListProps {
    posts: Post[] | null;
    msg: string;

}

const PostList: React.FC<PostListProps> = ({ posts, msg }) => {
    const { user } = useAuthContext();
    const { updateDocument } = useFirestore("posts");
    const { calculateReadingTime } = useReadTime();

    const [options, setOptions] = useState<{ [key: number]: boolean}>({});

    const handleClick = async (post: Post) => {
        try {
            await updateDocument (post.id, {
                expands: (post.expands += 1),
            });
        } catch (error) {
            console.error("Error updating post:", error);
            toast.error("Error Updating post")
        }
    };

    const handleMouseEnter = async (post: Post) => {
       try {
        const viewed = post.views.filter((view: any) => view.uid === user?.uid); 
        const views = { uid: user?.uid!, id: new Date().toISOString() };
        
        if (!viewed.length) {
            await updateDocument(post.id, { views: [...post.views, views] });
        } 
       } catch (error) {
        console.error("Error updating views:", error);
        toast.error("Error updating views")
       }

    };

    const handleOptions = (index: number) => {
        setOptions((state) => ({
            ...state, 
            [index]: !state[index],
        }));
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto px-4 mt-1">
            {posts?.length === 0 && (
                <p className="text-center text-gray-500">{msg}</p>
            )}
            {posts?.map((post, index) => (
                <div 
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300" 
                    key={post.id} 
                    onMouseEnter={() => handleMouseEnter(post)}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <Avatar src={post.author.photoURL || DefaultAvatar} className="w-16 h-16 sm:w-20 sm:h-20" />
                        <div className="flex-1">
                            <span className="font-semi-bold text-gray-900 dark:text-gray-100">
                                {post.author.firstName} {post.author.lastName}
                            </span>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                <span>{post.createdAt.toDate().toDateString().slice(3)}</span>
                                <span className="mx-1">.</span>
                                <span>{post.author.headline}</span>
                            </div>
                        </div>
                        <div className="ml-auto flex items-center space-x-2">
                            {options[index] && <Options post={post} />}
                            {user?.uid !== post.author.id && <BookmarkIcon post={post} />}
                            {user?.uid === post.author.id && (
                                <button 
                                    className="text-gray-500 hover:text-gray-700" 
                                    onClick={() => handleOptions(index)}
                                >
                                    <i className="fas fa-ellipsis-v"></i>
                                </button>
                            )}
                        </div>
                    </div>
                    <div onClick={() => handleClick(post)}>
                        <Link href={`/post/${post.id}`}>
                            <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                {post.title}
                            </h2>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                <i className="fas fa-book-reader mr-1"></i>
                                <span>{calculateReadingTime(post.content)}</span>
                            </div>
                            <p 
                                className="mt-2 text-gray-700 dark:txt-gray-300" 
                                dangerouslySetInnerHTML={{ __html: post.content }} 
                            />
                            {post.imageURL && (
                                <div className="mt-4">
                                    <Image 
                                    src={post.imageURL} 
                                    alt="Post Content" 
                                    className="mt-2 rounded-lg w-full object-cover"
                                    width={800}
                                    height={400}
                                    layout="responsive"
                                    priority 
                                />
                                </div>
                            )}
                        </Link>
                        <Reaction post={post} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default PostList;