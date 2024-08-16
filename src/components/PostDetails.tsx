import Avatar from '../components/Avatar';
import BookmarkIcon from '../components/BookmarkIcon';
import ContentInput from '../components/ContentInput';
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
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Avatar src={post.author.photoURL} className='w-22 h-22' />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">
                        {post.author.firstName} {post.author.lastName}
                    </h2>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {post.createdAt.toDate().toDateString().slice(3)}
                    </span>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <BookmarkIcon post={post} />
                <button className="text-gray-500 dark:text-gray-400">
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
                        />
                    )}
            </div>
            <Reaction post={post} />
            <div className="flex items-center mt-4">
                <Avatar className='w-20 h-20' src={user?.photoURL || ""} />
                <ContentInput post={post} />
            </div>
        </div>
    );
};


export default PostDetails;