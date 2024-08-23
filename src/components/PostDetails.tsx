import Avatar from '../components/Avatar';
import BookmarkIcon from '../components/BookmarkIcon';
import ContentInput from '../components/ContentInput';
import DefaultAvatar from "../../public/img/default-avatar.jpg"
import Reaction from '../components/Reaction';
import { useAuthContext } from '@/context/AuthContext';
import { Post } from '../Types';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Image from 'next/image';
import React from 'react';


interface PostDetailsProps {
    post: Post;
}

const PostDetails: React.FC<PostDetailsProps> = ({ post }) => {
    const { user } =useAuthContext();

    
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Avatar src={post.author.photoURL} className='w-16 h-16 md:w-22 md:h-22' />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {post.author.firstName} {post.author.lastName}
                    </h2>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {post.createdAt.toDate().toDateString().slice(3) || "Unknown Date"}
                    </span>
                </div>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <BookmarkIcon post={post} />
                <button 
                    className="text-gray-900 dark:text-gray-400"
                    aria-label="More options"
                >
                    <i className="fa fa-ellipsis-v"></i>
                </button>
            </div>

            <div className="mt-4">
                <p 
                    className="text-gray-800 dark:text-gray-200" 
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
                 {post.imageURL && (
                        <Image 
                            className="w-full" 
                            src={post.imageURL} 
                            alt='Post content' 
                            width={800}
                            height={600}
                            layout="responsive"
                        />
                    )}
            </div>
            <Reaction post={post} />

            <div className="flex flex-col md:flex-row items-center mt-4 space-y-4 md:space-y-0 md:space-x-4">
                <Avatar className='w-12 h-12 md:w-16 md:h-16' src={user?.photoURL || DefaultAvatar} />
                <ContentInput post={post} />
            </div>
        </div>
    );
};


export default PostDetails;