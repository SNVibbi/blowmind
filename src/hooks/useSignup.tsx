import { useAuthContext } from "../context/AuthContext";
import { auth, storage } from "../utils/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ensureUserProfile, DEFAULT_AVATAR } from "../lib/userService";
import { getErrorMessage, ValidationError } from "../lib/errors";
import { Message } from "../Types";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface UseSignup {
  signup: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    thumbnail: File | null,
    category: string
  ) => Promise<void>;
  message: Message | null;
  isPending: boolean;
}

function validateAvatar(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ValidationError(
      "Profile photo must be a JPEG, PNG, WebP, or GIF image."
    );
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new ValidationError("Profile photo must be smaller than 5 MB.");
  }
}

const useSignup = (): UseSignup => {
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { dispatch } = useAuthContext();

  const signup = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    thumbnail: File | null,
    category: string
  ) => {
    setMessage(null);
    setIsPending(true);

    try {
      if (thumbnail) {
        validateAvatar(thumbnail);
      }

      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;

      let photoUrl = DEFAULT_AVATAR;
      if (thumbnail) {
        // Unique generated path — never trust the user-provided filename.
        const uploadPath = `thumbnails/${user.uid}/${uuidv4()}`;
        const storageRef = ref(storage, uploadPath);
        await uploadBytes(storageRef, thumbnail, {
          contentType: thumbnail.type,
        });
        photoUrl = await getDownloadURL(storageRef);
      }

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`.trim(),
        photoURL: photoUrl,
      });

      await ensureUserProfile(user, { firstName, lastName, photoUrl, category });

      // Best effort — a failed verification email must not fail signup.
      try {
        await sendEmailVerification(user);
        toast.info("We sent a verification link to your email.");
      } catch {
        /* user can re-request verification later */
      }

      dispatch({ type: "LOGIN", payload: user });
      toast.success("Signup successful!");
      setMessage({ type: "Success", message: "Sign up successful" });
      router.push("/interest");
    } catch (error: unknown) {
      const friendly = getErrorMessage(error);
      toast.error(friendly);
      setMessage({ type: "Error", message: friendly });
    } finally {
      setIsPending(false);
    }
  };

  return { signup, message, isPending };
};

export default useSignup;
