import { useRouter } from 'next/router';
import { useDocument } from '../../hooks/useDocument';
import Footer from '../../components/Footer';
import BlogNavbar from '../../components/BlogNavbar';
import PostComment from '../../components/PostComment'; 
import Reaction from '../../components/Reaction'; 
import { useState, useEffect } from 'react';
import { Post } from '../../Types';
import { toast } from 'react-toastify';
import PostDetails from '@/components/PostDetails';


const PostPage:  React.FC  = () => {
  const router = useRouter();
  const { postId } = router.query;

  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [mobileMenu, setMobileMenu] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, []);

  const { document: post, error, isPending } = useDocument<Post>('posts', postId as string);

  useEffect(() => {
    if (!postId) {
      toast.error("Post ID is missing")
    }
  }, [postId]);

  if (!postId || typeof postId !== 'string') {
    return (
      <>
        <BlogNavbar 
          screenWidth={screenWidth} 
          mobileMenu={mobileMenu} 
          setMobileMenu={setMobileMenu} 
        />
        <p className='text-gray-500'>Invalid post ID.</p>;
        <Footer/>
      </>
    );
  }


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
      <div className="max-w-3xl mx-auto p-4">
        <PostDetails post={post} />
        <Reaction post={post} />
        <PostComment post={post} />
      </div>
      <Footer />
    </>
  );
};

export default PostPage;
