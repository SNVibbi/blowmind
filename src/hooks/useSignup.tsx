import { useAuthContext } from "../context/AuthContext";
import { auth, db, storage } from "../utils/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile, User as FirebaseUser } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react"
import { Message } from "../Types";
import { useRouter } from "next/router";
import { toast } from "react-toastify";


interface UseSignup {
    signup: (
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        thumbnail: File,
        category: string
    ) => Promise<void>;
    message: Message | null | undefined;
    isPending: boolean;
}



const useSignup = (): UseSignup => {
    const router = useRouter();
    const [isCancelled, setIsCancelled] = useState(false);
    const [message, setMessage] = useState<Message | null | undefined>(null);
    const [isPending, setIsPending] = useState(false);
    const { dispatch } = useAuthContext();


    const signup = async (
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        thumbnail: File,
        category: string
    ) => {
        setMessage(null);
        setIsPending(true);

        try {
            //signup users
            const res = await createUserWithEmailAndPassword(auth,email, password).catch((error) => {
                console.log("Error Signing Up",error);
                setIsPending(false);
                throw error;
            });

            const user = res.user as FirebaseUser;

            if (!user) {
                throw new Error("Could not complete signup");
            }

            // uploading user thumbnail
            const uploadPath = `thumbnails/${user.uid}/${thumbnail.name}`;
            const storageRef = ref(storage, uploadPath);
            await uploadBytes(storageRef, thumbnail);
            const downloadURL = await getDownloadURL(storageRef);

            const [profileUpdated, documentSet] = await Promise.allSettled([
                updateProfile(user,{
                    displayName: `${firstName} ${lastName}`,
                    photoURL: downloadURL,
                }),
                // creating a user document
                setDoc(doc(db, "users", user.uid), {
                    online: true,
                    firstName,
                    photoUrl: downloadURL,
                    interests: [],
                    email,
                    lastName,
                    headline: "",
                    category,
                }),
            ]);

            if (profileUpdated.status === "rejected"){
                toast.error("Profile update failed:", profileUpdated.reason);
            }

            if (documentSet.status === "rejected") {
                toast.error("Document creation failed:", documentSet.reason);
            }


            dispatch({ type: "LOGIN", payload: user });
            toast.success("Signup successful!");

           setIsPending(false);
           setMessage({ type: "Success", message: "Sign up successful" });
           router.push("/interest");
        }  catch (error: any) {
           if (!isCancelled) {
            toast.error("Signup error:",error);
            let errorMessage: string = "";
            if (error.code === "auth/email-already-in-use") {
                errorMessage = "Email Already Exists please register with a different email";
            }
            setMessage({ type: "Error", message: errorMessage });
            setIsPending(false)
           }
        }
    };

    useEffect(() => {
        return () => {
            setIsCancelled(true);
        };
    }, []);

    return { signup, message, isPending };
};

export default useSignup;