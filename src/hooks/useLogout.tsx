import { useEffect, useState } from "react";
import { auth, db } from "../utils/firebaseConfig";
import { useAuthContext } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";


interface UseLogout {
  logout: () => Promise<void>;
  error: string | null;
  isPending: boolean;
}

const useLogout = (): UseLogout => {
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { user, dispatch } = useAuthContext();

  const logout = async () => {
    setError(null);
    setIsPending(true);

    try {
      if (user) {
          // Ensuring the user document exists and update online status
        const userDocRef = doc(db, "users", user.uid) 
        await updateDoc(userDocRef, { online: false });

        // Signing the user out
        await auth.signOut();

        // Dispatching logout action
        dispatch({ type: "LOGOUT" });
        toast.success("Logout successful!")

        // Updating state
        if (!isCancelled) {
          setIsPending(false);
          setError(null);
        }
      } else {
        throw new Error("No user is logged in")
      }
    } catch (err: any) {
      if (!isCancelled) {
        setError(err.message || "An unknown error occurred");
        setIsPending(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      setIsCancelled(true);
    };
  }, []);

  return { logout, error, isPending };
};

export default useLogout;
