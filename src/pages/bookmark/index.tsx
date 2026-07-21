import withAuth from "../../hoc/withAuth";
import AppShell from "../../components/AppShell";
import PostList from "../../components/PostList";
import CustomSkeleton from "../../components/CustomSkeleton";
import { useAuthContext } from "../../context/AuthContext";
import { useBookmarkedPosts } from "../../hooks/useBookmarkedPosts";
import { ErrorState } from "../../components/states/StateViews";

function Bookmarks(): JSX.Element {
  const { user } = useAuthContext();
  const { posts, error } = useBookmarkedPosts(user?.uid);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Your bookmarks
        </h1>
        {!posts && !error && <CustomSkeleton count={5} />}
        {error && <ErrorState message={error} />}
        {posts && (
          <PostList posts={posts} msg="Posts you bookmark will appear here." />
        )}
      </div>
    </AppShell>
  );
}

export default withAuth(Bookmarks);
