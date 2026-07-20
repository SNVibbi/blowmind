import { useAuthContext } from "../context/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../utils/firebaseConfig";
import { useState } from "react";
import { ensureUserProfile } from "../lib/userService";
import { getErrorMessage } from "../lib/errors";
import { Message } from "../Types";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

interface UseLogin {
  login: (email: string, password: string) => Promise<void>;
  message: Message | null;
  isPending: boolean;
}

const useLogin = (): UseLogin => {
  const [message, setMessage] = useState<Message | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { dispatch } = useAuthContext();
  const router = useRouter();

  const login = async (email: string, password: string): Promise<void> => {
    setMessage(null);
    setIsPending(true);

    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      const user = response.user;

      // Creates the profile document if it's missing (legacy accounts),
      // otherwise just marks the user online without touching their data.
      const { profile, created } = await ensureUserProfile(user);

      dispatch({ type: "LOGIN", payload: user });
      toast.success("Login successful!");
      setMessage({ type: "Success", message: "Login successful" });

      const redirectTo =
        typeof router.query.redirect === "string" ? router.query.redirect : null;

      if (created || profile.interests.length === 0) {
        router.push("/interest");
      } else {
        router.push(redirectTo ?? "/blog");
      }
    } catch (error: unknown) {
      const friendly = getErrorMessage(error);
      toast.error(friendly);
      setMessage({ type: "Error", message: friendly });
    } finally {
      setIsPending(false);
    }
  };

  return { login, isPending, message };
};

export default useLogin;
