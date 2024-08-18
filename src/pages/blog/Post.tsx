import '@fortawesome/fontawesome-free/css/all.min.css';
import React from 'react';
import { useDocument } from '../../hooks/useDocument';
import { useRouter } from 'next/router';
import CustomSkeleton from '../../components/CustomSkeleton';
import PostDetails from '../../components/PostDetails';
import PostComment from '../../components/PostComment';
import { Post as PostType  } from '../../Types';

const Post: React.FC = () => {
    const router = useRouter();
    const { id } = router.query as { id: string };
    const { error, document, isPending } = useDocument<PostType>("posts", id);

    if (!id) {
        return <div>Invalid post ID.</div>
    }

    if (error) {
        return <div className='text-red-600'>{error}</div>;
    }

    if (isPending) {
        return (
            <div className="flex flex-col gap-4">
                <CustomSkeleton height={50} width="30%" />
                <CustomSkeleton height={200} />
                <CustomSkeleton height={300} />
                <CustomSkeleton height={100} />
            </div>
        );
    }

    if (!document) {
        return <div className="text-gray-500">No post found</div>;
    }

    return (
        <>
            <button 
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-white dark:hover:text-gray-300 mb-4" 
                onClick={() => router.back()}
            >
                <i className="fas fa-arrow-left"></i>
                <span>Posts</span>
            </button>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <PostDetails post={document} />
                <PostComment post={document} />
            </div>
        </>
    );
};

export default Post