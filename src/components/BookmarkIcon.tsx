import { toast } from 'react-toastify';
import { useAuthContext } from '../context/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { BookmarkedItem, BookmarkIconProps, BookmarkProps, BookmarkToAdd } from '../Types';
import '@fortawesome/fontawesome-free/css/all.min.css'
import { v4 as uuidv4 } from "uuid";



export default function BookmarkIcon ({ post }: BookmarkIconProps) {
    const { addDocument, response: addResponse } = useFirestore("bookmarks");
    const { updateDocument, response: updateResponse } = useFirestore("posts");
    const { user } = useAuthContext();


    const author = {
        firstName: post.author?.firstName || "",
        lastName: post.author?.lastName || "",
        photoURL: post.author?.photoURL || "",
        id: post.author?.id || "",
        headline: post.author?.headline || "",
    };

    const bookmarkToAdd: BookmarkToAdd = {
        userId: user?.uid!,
        id: uuidv4(),
        postId: post.id,
    };


    const bookmark: BookmarkProps = {
        userId: user?.uid!,
        postId: post.id,
        author,
        title: post.title,
        content: post.content,
        imageURL: post.imageURL,
        comments: post.comments,
        likes: post.likes,
        share: post.share,
        views: post.views,
        bookmarks: post.bookmarks,
    };

    const bookmarked: BookmarkedItem[] = post.bookmarks.filter((bookmark: BookmarkedItem) => bookmark.userId === user?.uid);

        const handleClick = async () => {
            if (bookmarked.length) {
                toast.success("Post already bookmarked by you");
                return;
            } 

            await addDocument(bookmark);
            if (!addResponse.error) {
                    console.log("Post added to bookmark collection");

                await updateDocument(post.id, {
                    bookmarks: [...post.bookmarks, bookmarkToAdd],
                });

                if (!updateResponse.error) {
                    console.log("Post added to post collection")
                }
            }

         };

            return (
                <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" onClick={handleClick}>
                    {bookmarked.length ? (
                        <i className="fas fa-bookmark text-indigo-600"></i>
                    ) : (
                        <i className="far fa-bookmark text-gray-600 dark:text-gray-400"></i>
                    )}
                </button>
            );
        };

       
