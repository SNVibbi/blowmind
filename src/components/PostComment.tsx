import Avatar from "./Avatar";
import { formatDistanceToNow } from "date-fns"
import { Comment } from "../Types";


interface PostCommentProps {
    post:{
        comments: Comment[];
    };
}

const PostComment: React.FC<PostCommentProps> = ({ post }) => {
    return (
        <div className="mt-4">
            {post.comments.length > 0 ? (
                <h4 className="flex items-center space-x-2 text-lg font-semibold">
                    <span>All comments</span>
                    <i className="fas fa-chevron-down"></i>
                </h4>
            ) : (
                <h4 className="text-lg font-semibold">No comments yet</h4>
            )}
            <ul className="mt-2 space-y-4">
                {post.comments.map((comment) => (
                    <li key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                        <div className="flex items-center space-x-4">
                            <Avatar src={comment.photoURL} />
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">
                                {comment.displayName}:
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">{comment.content}</p>
                            </div>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                            {formatDistanceToNow(new Date(comment.createdAt.seconds * 1000), { addSuffix: true })}
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PostComment;