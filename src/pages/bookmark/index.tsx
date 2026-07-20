import { Post } from "../../Types";
import withAuth from "../../hoc/withAuth";
import PostList from "../../components/PostList";
import CustomSkeleton from "../../components/CustomSkeleton";
import { useAuthContext } from "../../context/AuthContext";
import { useCollection } from "../../hooks/useCollection";



function Bookmarks(): JSX.Element {
    const { user }: any = useAuthContext();
    const { documents: bookmarks, isPending, error } = useCollection<Post>("bookmarks", ["id", "==", user?.uid]);

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {isPending && <CustomSkeleton count={5} />}
            {error && <div className="text-red-600">{error}</div>}
            {bookmarks && (
                <PostList 
                    posts={bookmarks}
                    msg="Posts you put bookmark will appear here..." 
                />
            )}
        </div>
    )
}

export default withAuth(Bookmarks);
