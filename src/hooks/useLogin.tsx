import { useAuthContext } from "../context/AuthContext";
import { signInWithEmailAndPassword, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "../utils/firebaseConfig";
import { useEffect, useState } from "react"
import { doc, DocumentSnapshot, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { Message } from "../Types";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
interface UseLogin {
    login: (email: string, password: string) => Promise<void>;
    message: Message | null | undefined;
    isPending: boolean;
}


const useLogin = (): UseLogin => {
    const [isCancelled, setIsCancelled] = useState(false);
    const [message, setMessage] = useState<Message | null | undefined>(null);
    const [isPending, setIsPending] = useState(false);
    const { dispatch } = useAuthContext();
    const router = useRouter();


    const login = async (email: string, password: string): Promise<void> => {
        setMessage(null);
        setIsPending(true);
        setIsCancelled(false)

        try {
            //login
            const response = await signInWithEmailAndPassword(auth, email, password).catch((error) => {
                console.log("Error Logging in..", error);
                setIsPending(false);
                throw error;
            })
                
            const user: FirebaseUser = response.user;

            if (!user) {
                throw new Error("Failed to login")
            }

            // Checking if the user has selected their interests
            const documentRef = doc(db, "users", user.uid);
            const userDoc: DocumentSnapshot = await getDoc(documentRef);
            if (!userDoc.exists()) {
                // If the user's document doesn't exist, create it
                const [firstName, ...lastNameArr] = user.displayName?.split(" ") || [" "];
                const lastName = lastNameArr.join(" "); 

                await setDoc(documentRef, {
                    online: true,
                    email: user.email,
                    firstName,
                    lastName,
                    photoURL: user.photoURL || "",
                    interest: [],
                    headline:"",
                });
                // Redirecting to interest selection since it's a new user
                router.push("/interest");
            } else {
                // If the user document exists, check if interests are selected
                const userData = userDoc.data();
                if (userData && userData.interests && userData.interests.length > 0) {
                    // User has selected interests, redirecting to main content
                    router.push("/blog");
                } else {
                    // User hasn't selected interests, redirecting to the interest selection
                    router.push("/interest");
                }
                // Updating online status
                await updateDoc(documentRef, { online: true});
            }


            

            dispatch({ type: "LOGIN", payload: user });
            toast.success("Login successful!");

            setIsPending(false);
            setMessage({ type: "Success", message: "Login Successful" });
          } catch (error: any) {
            if (!isCancelled) {
                toast.error("Login error:", error)
                    let errorMessage: string = "An error occurred during login.";
                    if (error.code === "auth/invalid-credential") {
                        errorMessage = "Invalid email/password, please try again";
                    }
                    setMessage({ type: "Error", message: errorMessage });
                    setIsPending(false)
            }
          }
    };

    useEffect(() => {
        return () => {
            setIsCancelled(true);
        }
    }, []);

    return { login, isPending, message };

};

export default useLogin;