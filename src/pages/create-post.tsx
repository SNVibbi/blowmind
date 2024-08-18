import { useAuthContext } from "../context/AuthContext";
import { useCategory } from "../hooks/useCategory";
import { useDocument } from "../hooks/useDocument";
import { useFirestore } from "../hooks/useFirestore";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, ReactElement, useEffect, useState } from "react";
import '@fortawesome/fontawesome-free/css/all.min.css';
import Image from "next/image";
import { toast } from "react-toastify";

export default function Create(): ReactElement {
    const { user } = useAuthContext();
    const { document: CurrentUser, error: userError } = useDocument("users", user?.uid || "defaultUserId"); 
    const router = useRouter();
    const { addDocument, response } = useFirestore("posts");
    const [add, setAdd] = useState(false);
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const { category } = useCategory();
    const [isVideoEnable, setIsVideoEnable] = useState(false);

    useEffect(() => {
        if (userError) {
            console.error("Error fetching user data:", userError);
            toast.error("Error fetching user data. Please try again.")
        }

        if (file) {
            setFileUrl(URL.createObjectURL(file));
        }
    }, [file, userError]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setFile(null);
        let selected = e.target.files && e.target.files[0];

        if (!selected) {
            setFileError("Please select a file");
            return;
        }
        if (!selected.type.includes("image") && (!selected.type.includes("video") || !isVideoEnable)) {
            setFileError("Selected file must be an image or a video");
            return;
        }
        if (selected.size > 5000000) {
            setFileError("File size must be less than 5MB");
            return;
        }

        setFileError(null);
        setFile(selected);
        setAdd(false);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const newTags = await category(content);

        const author = {
            firstName: CurrentUser?.firstName || "Anonymous",
            lastName: CurrentUser?.lastName || "User",
            photoURL: CurrentUser?.photoURL || "",
            id: CurrentUser?.id || user?.uid || '',
            headline: CurrentUser?.headline || "",
        };


        const post = {
            title,
            content,
            comments: [],
            likes: [],
            share: "",
            bookmarks: [],
            expand: 0,
            views: [],
            author,
            tags: newTags,
        };

        console.log("Submitting post:", post)

        await addDocument(post, file || undefined);

        if (!response.error) {
            setTitle("");
            setContent("");
            setFile(null);
            router.push("/blog");
        } else {
            toast.error(`Error publishing post ${response.error}`)
            alert("Error publishing post. Please try again.");
        }
    };

    return (
        <form className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md" onSubmit={handleSubmit}>
            {response.error && <div className="text-red-600">{response.error}</div>}
            <div className="flex justify-between items-center mb-4">
                <button 
                    type="submit" 
                    className={`btn ${response.isPending ? "opacity-50 cursor-not-allowed" : ""}`} 
                    disabled={response.isPending}
                >
                    {response.isPending ? "Publishing..." : "Publish"}
                </button>
                <i 
                    onClick={() => setAdd(!add)} 
                    className={`fas ${add ? "fa-times-circle" : "fa-plus-circle"} text-3xl cursor-pointer text-blue-600 dark:text-blue-400`}
                    title={add ? "Cancel" : "Add Image/Video"}
                ></i>
            </div>
            {!add ? (
                <div className="space-y-4">
                    <input 
                        type="text" 
                        required
                        placeholder="Title"
                        className="w-full text-4xl bg-transparent border-none outline-none text-gray-800 dark:text-gray-200"
                        onChange={(e) => setTitle(e.target.value)}
                        value={title || ""}
                    />
                    {fileUrl && 
                        (<Image 
                            src={fileUrl} 
                            alt="Selected" 
                            className="w-full h-60 object-cover rounded-md" 
                            width={200}
                            height={200}
                        />
                        )}
                    <textarea 
                        name="content"
                        required
                        placeholder="Write a post..."
                        className="w-full h-96 bg-transparent border-none cursor-pointer outline-none text-gray-800 dark:text-gray-200"
                        onChange={(e) => setContent(e.target.value)}
                        value={content}
                    ></textarea>
                </div>
            ) : (
                <div className="flex gap-4">
                    <input 
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        className="hidden" 
                    />
                    <label htmlFor="file" className="cursor-pointer text-3xl text-blue-600 dark:text-blue-400" title="Add Image">
                        <i className="fas fa-image"></i>
                    </label>
                    {isVideoEnable && (
                        <label htmlFor="file" className="cursor-pointer text-3xl text-blue-600 dark:text-blue-400" title="Add Video">
                            <i className="fas fa-video"></i>
                        </label>
                    )}
                </div>
            )}
            {fileError && <div className="text-red-600 mt-2">{fileError}</div>}
        </form>
    );
}
