import { useAuthContext } from "../context/AuthContext";
import { auth, db, storage } from "../utils/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile, User as FirebaseUser } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react"
import { Message } from "../Types";
import { Router, useRouter } from "next/router";


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
            //signup
            const res = await createUserWithEmailAndPassword(auth,email, password).catch((error) => {
                console.log("Error Signing Up");
                console.log("Error:::::: ", error);
                setIsPending(false);
                throw error;
            });

            const user = res.user as FirebaseUser;

            if (!user) {
                throw new Error("Could not complete signup");
            }

            // upload user thumbnail
            const uploadPath = `thumbnails/${user.uid}/${thumbnail.name}`;
            const storageRef = ref(storage, uploadPath);
            await uploadBytes(storageRef, thumbnail);
            const downloadURL = await getDownloadURL(storageRef);

            const [profileUpdated, documentSet] = await Promise.allSettled([
                // add display and photo_url name to user
                await updateProfile(user,{
                    displayName: `${firstName} ${lastName}`,
                    photoURL: downloadURL,
                }),
                // create a user document
                await setDoc(doc(db, "users", user.uid), {
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



            dispatch({ type: "LOGIN", payload: user });

           setIsPending(false);
           setMessage({ type: "Success", message: "Sign up successful" });
           router.push("/blog");
        }  catch (error: any) {
           if (error) {
            console.log(error);
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