import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import withAuth from "../../hoc/withAuth";
import BlogNavbar from "../../components/BlogNavbar";
import Avatar from "../../components/Avatar";
import { useAuthContext } from "../../context/AuthContext";
import { useDocument } from "../../hooks/useDocument";
import { updateUserProfile, uploadAvatar } from "../../lib/userService";
import { validateImageFile } from "../../lib/imageUtils";
import { getErrorMessage } from "../../lib/errors";
import { toast } from "react-toastify";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface UserDoc {
  firstName?: string;
  lastName?: string;
  headline?: string;
  photoUrl?: string;
  photoURL?: string;
}

function EditProfile() {
  const { user } = useAuthContext();
  const router = useRouter();
  const { document: profile } = useDocument<UserDoc>("users", user?.uid);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Seed the form once the profile arrives.
  useEffect(() => {
    if (profile && !loaded) {
      setFirstName(profile.firstName ?? "");
      setLastName(profile.lastName ?? "");
      setHeadline(profile.headline ?? "");
      setLoaded(true);
    }
  }, [profile, loaded]);

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
    if (!user || isPending) return;
    setIsPending(true);
    try {
      let photoUrl: string | undefined;
      if (file) photoUrl = await uploadAvatar(user.uid, file);
      await updateUserProfile(user, { firstName, lastName, headline, photoUrl });
      toast.success("Profile updated.");
      router.push("/profile");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  const currentPhoto =
    preview || profile?.photoUrl || profile?.photoURL || user?.photoURL || null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BlogNavbar screenWidth={1024} mobileMenu={false} setMobileMenu={() => {}} />

      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Edit profile
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Update how you appear across BlowMind.
        </p>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="avatar-ring">
              <Avatar
                src={currentPhoto}
                className="h-20 w-20 border-4 border-white dark:border-gray-800"
              />
            </div>
            <label className="btn-secondary cursor-pointer">
              <i className="fas fa-camera" aria-hidden="true"></i>
              Change photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
                First name
              </label>
              <input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                maxLength={100}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm font-medium">
                Last name
              </label>
              <input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={100}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="headline" className="mb-1 block text-sm font-medium">
              Headline
            </label>
            <input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={200}
              placeholder="e.g. Writer · Coffee enthusiast"
              className="input-field"
            />
            <p className="mt-1 text-xs text-gray-400">{headline.length}/200</p>
          </div>

          <div className="flex items-center justify-between">
            <Link href="/profile" className="text-sm text-gray-500 hover:underline">
              Cancel
            </Link>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default withAuth(EditProfile);
