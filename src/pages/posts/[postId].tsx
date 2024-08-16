import { useRouter } from 'next/router';
import { useDocument } from '../../hooks/useDocument';
import Footer from '../../components/Footer';
import BlogNavbar from '../../components/BlogNavbar';
import PostComment from '../../components/PostComment'; 
import Reaction from '../../components/Reaction'; 
import { useState, useEffect } from 'react';
import { Post } from '@/Types';


const PostPage:  React.FC  = () => {
  const router = useRouter();
  const { postId } = router.query;

  useEffect(() => {
    console.log('Post ID:', postId)
  }, [postId])

  const { document: post, error, isPending } = useDocument<Post>('posts', postId as string);

  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [mobileMenu, setMobileMenu] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setScreenWidth(window.innerWidth);
    }
  }, []);

  if (isPending) return <p>Loading post...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!post) return <p className="text-gray-500">No post found</p>;

  return (
    <>
      <BlogNavbar 
        screenWidth={screenWidth} 
        mobileMenu={mobileMenu} 
        setMobileMenu={setMobileMenu} 
      />
      <div className="p-6 max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">{post.title}</h1>
        <p className="text-gray-700 dark:text-gray-300">{post.content}</p>

    
        <Reaction post={post} />

        <PostComment post={post} />
      </div>
      <Footer />
    </>
  );
};

export default PostPage;
