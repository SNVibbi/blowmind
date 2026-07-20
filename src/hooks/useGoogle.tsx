import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuthContext } from "../context/AuthContext";
import { useState } from "react";
import { auth } from "../utils/firebaseConfig";
import { ensureUserProfile } from "../lib/userService";
import { getAppError } from "../lib/errors";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

const useGoogle = () => {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { dispatch } = useAuthContext();
  const router = useRouter();

  /**
   * One flow for both "sign up" and "sign in" with Google: Firebase
   * creates the auth user if needed, and ensureUserProfile creates or
   * merges the users/{uid} document without overwriting existing data.
   */
  const signInWithGoogle = async () => {
    setError(null);
    setIsPending(true);

    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);

      const { profile, created } = await ensureUserProfile(res.user);

      dispatch({ type: "LOGIN", payload: res.user });
      toast.success(created ? "Welcome to BlowMind!" : "Welcome back!");

      if (created || profile.interests.length === 0) {
        router.push("/interest");
      } else {
        router.push("/blog");
      }
    } catch (err: unknown) {
      const appError = getAppError(err);
      setError(appError.message);
      // The user closing the popup isn't a failure worth toasting about.
      if (
        appError.code !== "auth/popup-closed-by-user" &&
        appError.code !== "auth/cancelled-popup-request"
      ) {
        toast.error(appError.message);
      }
    } finally {
      setIsPending(false);
    }
  };

  return {
    googleSignUp: signInWithGoogle,
    googleSignIn: signInWithGoogle,
    error,
    isPending,
  };
};

export default useGoogle;
