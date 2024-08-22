import React from "react";
import { Timestamp } from "../utils/firebaseConfig"
import Link from "next/link"
import { useFirestore } from "../hooks/useFirestore";
import { useAuthContext } from "../context/AuthContext";
import { Post, Like } from "../Types";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { toast } from "react-toastify";





interface ReactionProps {
    post: Post;
}


const Reaction: React.FC<ReactionProps> = ({ post }) => {
    const { updateDocument, response } = useFirestore("posts");
    const { user } = useAuthContext();

    const userLike = post.likes.find((like) => like.uid === user?.uid);

    const handleLike = async () => {
        if (userLike){
            toast.success("You already liked this post");
            return;
        }
        
        
        const newLike: Like = {
            id: Math.floor(Math.random() * 10000000),
            displayName: user?.displayName || "",
            photoURL: user?.photoURL || "",
            createdAt: Timestamp.fromDate(new Date()),
            uid: user?.uid!,
        };

            await updateDocument(post.id, {
                likes: [...post.likes, newLike],
            });

            if (response.error) {
                toast.error("Failed to like the post")
            }
    };

    return (
        <div className="flex justify-between items-center mt-2">
           <Link href={`/posts/${post.id}`} className="flex items-center
            gap-2 p-2 text-gray-800 dark:text-gray-200">
                <i className="fas fa-comments"></i>
                <span className="text-sm">{post.comments.length}</span>
            </Link>

            <button className="flex items-center gap-2 p-2 text-gray-800 dark:text-gray-200" onClick={handleLike}>
                {userLike ? (
                    <i className="fas fa-heart text-red-600"></i>
                ) : (
                    <i className="far fa-heart"></i>
                )}
                <span className="text-sm">{post.likes.length}</span>
            </button>

            <div className="flex items-center gap-2 p-2 text-gray-800 dark:text-gray-200">
                <i className="fas fa-eye"></i>
                <span className="text-sm">{post.views.length}</span>
                <span className="text-sm hidden md:inline">views</span>
            </div>
        </div>
    );
};

export default Reaction;