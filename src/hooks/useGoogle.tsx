import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuthContext } from "../context/AuthContext";
import { useEffect, useState } from "react"
import { auth, db } from "../utils/firebaseConfig";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import "firebase/compat/auth"
import { toast } from "react-toastify";




const useGoogle = () => {
    const [isCancelled, setIsCancelled] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);
    const { dispatch } = useAuthContext();

    const googleSignUp = async () => {
        setError(null);
        setIsPending(true);

        try {
            const provider = new GoogleAuthProvider();
            const res = await signInWithPopup(auth, provider);

            if (!res) {
                throw new Error("Could not complete signup")
            }

            if (res.user.displayName) {
                const splitName: string[] = res.user.displayName.split(" ");
                const firstName: string = splitName[0];
                const lastName: string = splitName[1];

                // creating a user document
                await setDoc(doc(db, "users", res.user.uid), {
                    photoUrl: res.user.photoURL,
                    email: res.user.email,
                    firstName: firstName,
                    lastName: lastName,
                    headline: "",
                    online: true,
                    interests: [],
                });

                dispatch({ type: "LOGIN", payload: res.user });

                if(!isCancelled) {
                    setIsPending(false);
                    setError(null);
                    toast.success("Signup successful!")
                }
            }
        } catch (err: any) {
            if (!isCancelled) {
                setError(err.message)
                setIsPending(false);
                toast.error(`Signup failed: ${err.message}`)
            }
        }
    };

    const googleSignIn = async () => {
        setError(null);
        setIsPending(true);

        try {
            const provider = new GoogleAuthProvider();
            const res = await signInWithPopup(auth, provider);

            if (!res) {
                throw new Error("Could not complete sign-in");
            }

            //update user document
            await updateDoc(doc(db, "users", res.user.uid), {
                online: true,
            });

            dispatch({ type: "LOGIN", payload: res.user });

            if (!isCancelled) {
                setIsPending(false);
                setError(null);
                toast.success("Sign-in successful!")
            }
        }catch (err: any) {
            if (!isCancelled) {
                setError(err.message);
                setIsPending(false);
                toast.error(`Sign-in failed: ${err.message}`);
            }
        }
    };

    useEffect(() => {
        return () => {
            setIsCancelled(true);
        };
    }, []);

    return { googleSignUp, googleSignIn, error, isPending };
};

export default useGoogle;