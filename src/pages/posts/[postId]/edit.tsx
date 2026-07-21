import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import withAuth from "../../../hoc/withAuth";
import AppShell from "../../../components/AppShell";
import { useAuthContext } from "../../../context/AuthContext";
import { useDocument } from "../../../hooks/useDocument";
import { useFirestore } from "../../../hooks/useFirestore";
import { validateImageFile } from "../../../lib/imageUtils";
import { detectSpam } from "../../../lib/spam";
import { Post } from "../../../Types";
import { LoadingState, ErrorState } from "../../../components/states/StateViews";
import { toast } from "react-toastify";
import "@fortawesome/fontawesome-free/css/all.min.css";

function EditPost() {
  const router = useRouter();
  const { user } = useAuthContext();
  const postId = typeof router.query.postId === "string" ? router.query.postId : undefined;

  const { document: post, error, isPending } = useDocument<Post>("posts", postId);
  const { updateDocument, response } = useFirestore("posts");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (post && !seeded) {
      setTitle(post.title ?? "");
      setContent(post.content ?? "");
      setSeeded(true);
    }
  }, [post, seeded]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const err = validateImageFile(selected);
    if (err) {
      toast.error(err);
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!postId || response.isPending) return;

    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    const spam = detectSpam(`${title} ${content}`);
    if (spam.spam) {
      toast.error(spam.reason ?? "This looks like spam.");
      return;
    }

    const updated = await updateDocument(
      postId,
      { title: title.trim(), content: content.trim() },
      file ?? undefined
    );
    if (updated) router.push(`/posts/${postId}`);
  };

  // Guard: only the author may edit.
  const isOwner = post && user && post.author?.id === user.uid;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Edit post
        </h1>

        {isPending && <LoadingState label="Loading post…" />}
        {error && <ErrorState message={error} />}
        {post && !isOwner && (
          <ErrorState message="You can only edit your own posts." />
        )}

        {post && isOwner && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
          >
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium">
                Title
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                className="input-field text-lg font-semibold"
              />
            </div>

            <div>
              <label htmlFor="content" className="mb-1 block text-sm font-medium">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={12}
                className="input-field"
              />
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium">Cover image</span>
              {(preview || post.imageURL) && (
                <Image
                  src={preview || post.imageURL}
                  alt="Cover preview"
                  width={640}
                  height={320}
                  className="mb-2 max-h-56 w-full rounded-lg object-cover"
                  unoptimized={!!preview}
                />
              )}
              <label className="btn-secondary cursor-pointer">
                <i className="fas fa-image" aria-hidden="true"></i>
                {post.imageURL || preview ? "Replace image" : "Add image"}
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <Link href={`/posts/${postId}`} className="text-sm text-gray-500 hover:underline">
                Cancel
              </Link>
              <button type="submit" disabled={response.isPending} className="btn-primary">
                {response.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}

export default withAuth(EditPost);
