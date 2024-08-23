import { useFirestore } from "../hooks/useFirestore";
import { useAuthContext } from "../context/AuthContext";
import { ChangeEvent, FormEvent, useState } from "react";
import { toast } from "react-toastify";
import '@fortawesome/fontawesome-free/css/all.min.css'; 
    


interface ContentInputProps {
    post: Post;
}

interface Comment {
    displayName: string;
    userId: string;
    photoURL: string;
    content: string;
    createdAt: any;
    id: any;
}

interface Post {
    id: string;
    comments: Comment[];
}

export default function ContentInput({  post }: ContentInputProps) {
    const { updateDocument, response} = useFirestore("posts");
    const { user } =useAuthContext();

    const [newComment, setNewComment] = useState("");

    const handleCommentSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!user) {
            toast.error("User is not authenticated");
            return;
        }

        const commentToAdd: Comment = {
            displayName: user?.displayName!,
            photoURL: user?.photoURL!,
            content: newComment,
            createdAt: new Date(),
            id: `${user.uid}_${Date.now()}`,
            userId: user.uid,
        };

        console.log("Submitting comment:", commentToAdd)

        try {
            await updateDocument(post.id, {
                comments: [...post.comments, commentToAdd],
            });
    
            if (!response.error) {
                setNewComment("");
                toast.success("Comment added successfully!");
            } else {
                toast.error(`Error adding comment: ${response.error}`)
            }
        } catch (err) {
            console.error("Error submitting comment:", err);
            toast.error("Failed to submit comment. Please try again.")
        }
    };

    const handleCommentChange = (e: ChangeEvent<HTMLInputElement>) => {
        setNewComment(e.target.value);
    };

    return (
        <div className="mt-4">
            <form className="flex items-center w-full" onSubmit={handleCommentSubmit}>
                <input 
                    type="text"
                    placeholder="Leave a comment"
                    required
                    onChange={handleCommentChange}
                    value={newComment}
                    className="flex-grow p-2 bg-gray-200 dark:bg-gray-700 rounded-full border-none outline-none w-full text-gray-800 dark:text-gray-200 transition-colors durati"
                />
                <button 
                    type="submit" 
                    className="ml-2 p-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200"
                    aria-label="Submit comment"
                >
                    <i className="fas fa-paper-plane"></i>
                </button>
            </form>
        </div>
    );
}