import { useAuthContext } from "../context/AuthContext";
import { signInWithEmailAndPassword, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "../utils/firebaseConfig";
import { useEffect, useState } from "react"
import { doc, DocumentSnapshot, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { Message } from "../Types";
import router, { useRouter } from "next/router";
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


    const login = async (email: string, password: string): Promise<void> => {
        setMessage(null);
        setIsPending(true);
        setIsCancelled(false)

        try {
            //login
            const response = await signInWithEmailAndPassword(auth, email, password).catch((error) => {
                console.log("Error Logging in..");
                console.log(error);
                setIsPending(false);

                throw error;
            });
            console.log(response);
            const user: FirebaseUser = response.user;

            if (!user) {
                throw new Error("Failed to login")
            }

            // update online status
            const documentRef = doc(db, "users", user.uid);
            const userDoc: DocumentSnapshot = await getDoc(documentRef);

            if (!userDoc.exists()) {
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
            } else {
                await updateDoc(documentRef, { online: true});
            }


            

            dispatch({ type: "LOGIN", payload: user });

            setIsPending(false);
            setMessage({ type: "Success", message: "Login Successful" });
            router.push("/blog");
          } catch (error: any) {
            if (!isCancelled) {
                if (error) {
                    let errorMessage: string = "";
                    if (error.code === "auth/invalid-credential") {
                        errorMessage = "Invalid email/password, please try again";
                    }
                    setMessage({ type: "Error", message: errorMessage });
                    setIsPending(false)
                }
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