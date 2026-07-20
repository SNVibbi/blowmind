import { useState } from "react";
import { auth } from "../utils/firebaseConfig";
import { useAuthContext } from "../context/AuthContext";
import { setOnlineStatus } from "../lib/userService";
import { getErrorMessage } from "../lib/errors";
import { toast } from "react-toastify";

interface UseLogout {
  logout: () => Promise<void>;
  error: string | null;
  isPending: boolean;
}

const useLogout = (): UseLogout => {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { user, dispatch } = useAuthContext();

  const logout = async () => {
    setError(null);
    setIsPending(true);

    try {
      // Best-effort presence update; must never block signing out.
      if (user) {
        await setOnlineStatus(user.uid, false);
      }

      await auth.signOut();
      dispatch({ type: "LOGOUT" });
      toast.success("Logged out. See you soon!");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  return { logout, error, isPending };
};

export default useLogout;
