import withAuth from "../../hoc/withAuth";
import PostList from "../../components/PostList";
import CustomSkeleton from "../../components/CustomSkeleton";
import { useAuthContext } from "../../context/AuthContext";
import { useBookmarkedPosts } from "../../hooks/useBookmarkedPosts";

function Bookmarks(): JSX.Element {
  const { user } = useAuthContext();
  const { posts, error } = useBookmarkedPosts(user?.uid);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {!posts && !error && <CustomSkeleton count={5} />}
      {error && (
        <div className="text-red-600" role="alert">
          {error}
        </div>
      )}
      {posts && (
        <PostList posts={posts} msg="Posts you bookmark will appear here…" />
      )}
    </div>
  );
}

export default withAuth(Bookmarks);
