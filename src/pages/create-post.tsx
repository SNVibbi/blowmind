import { useAuthContext } from "../context/AuthContext";
import withAuth from "../hoc/withAuth";
import { useCategory } from "../hooks/useCategory";
import { useDocument } from "../hooks/useDocument";
import { useFirestore } from "../hooks/useFirestore";
import { useDraft } from "../hooks/useDraft";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { validateImageFile } from "../lib/imageUtils";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, ReactElement, useEffect, useState } from "react";
import '@fortawesome/fontawesome-free/css/all.min.css';
import Image from "next/image";
import { toast } from "react-toastify";

interface Draft {
    title: string;
    content: string;
}

function Create(): ReactElement {
    const { user } = useAuthContext();
    const { document: CurrentUser, error: userError } = useDocument("users", user?.uid || "defaultUserId");
    const router = useRouter();
    const { online } = useNetworkStatus();
    const { addDocument, response } = useFirestore("posts");
    const [add, setAdd] = useState(false);
    const {
        value: draft,
        setValue: setDraft,
        restored,
        clearDraft,
    } = useDraft<Draft>("create-post", { title: "", content: "" });
    const { title, content } = draft;
    const setTitle = (t: string) => setDraft((d) => ({ ...d, title: t }));
    const setContent = (c: string) => setDraft((d) => ({ ...d, content: c }));
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const { category } = useCategory();
    const [isVideoEnable] = useState(false);

    useEffect(() => {
        if (userError) {
            toast.error("Error fetching user data. Please try again.")
        }
    }, [userError]);

    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setFileUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setFile(null);
        const selected = e.target.files && e.target.files[0];

        if (!selected) {
            setFileError("Please select a file");
            return;
        }
        const validationError = validateImageFile(selected);
        if (validationError) {
            setFileError(validationError);
            return;
        }

        setFileError(null);
        setFile(selected);
        setAdd(false);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        // Duplicate-submission guard: the reducer flips isPending
        // synchronously inside addDocument, but guard here too.
        if (response.isPending) return;

        if (!online) {
            toast.error("You're offline. Reconnect to publish your post.");
            return;
        }

        if (!title.trim() || !content.trim()) {
            toast.error("Please add a title and some content.");
            return;
        }

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
            share: "",
            author,
            tags: newTags,
            commentCount: 0,
            likeCount: 0,
            bookmarkCount: 0,
            viewCount: 0,
            expands: 0,
        };

        const newId = await addDocument(post, file || undefined);

        if (newId) {
            clearDraft();
            setFile(null);
            router.push("/blog");
        }
        // On failure, addDocument already surfaced a friendly toast and the
        // draft is preserved so the user can retry without retyping.
    };

    return (
        <form className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md" onSubmit={handleSubmit}>
            {response.error && <div className="text-red-600" role="alert">{response.error}</div>}
            {restored && (title || content) && (
                <div className="flex items-center justify-between rounded-md bg-brand-50 dark:bg-brand-900/40 px-3 py-2 text-sm text-brand-700 dark:text-brand-200">
                    <span>
                        <i className="fas fa-clock-rotate-left mr-2" aria-hidden="true"></i>
                        Restored your unsaved draft.
                    </span>
                    <button
                        type="button"
                        onClick={() => { clearDraft(); setTitle(""); setContent(""); }}
                        className="underline hover:no-underline"
                    >
                        Discard
                    </button>
                </div>
            )}
            <div className="flex justify-between items-center mb-4">
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={response.isPending}
                >
                    {response.isPending ? "Publishing…" : "Publish"}
                </button>
                <button
                    type="button"
                    onClick={() => setAdd(!add)}
                    className="text-3xl text-brand-600 dark:text-brand-400"
                    aria-label={add ? "Cancel adding media" : "Add image"}
                    title={add ? "Cancel" : "Add image"}
                >
                    <i className={`fas ${add ? "fa-times-circle" : "fa-plus-circle"}`} aria-hidden="true"></i>
                </button>
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

export default withAuth(Create);
