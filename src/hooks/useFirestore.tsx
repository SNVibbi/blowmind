import { useAuthContext } from "../context/AuthContext";
import { db, storage, Timestamp } from "../utils/firebaseConfig";
import { collection, doc, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { useEffect, useReducer, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"



interface FirestoreState {
    document: any | null;
    isPending: boolean;
    error: string | null;
    success: boolean |null;
}

type FirestoreAction = 
    | { type: "IS_PENDING" }
    | { type: "ADDED_DOCUMENT"; payload: any }
    | { type: "DELETED_DOCUMENT" }
    | { type: "UPDATED_DOCUMENT"; payload: any }
    | { type: "ERROR"; payload: string };


const initialState: FirestoreState = {
    document: null,
    isPending: false,
    error: null,
    success: null,
};

const firestoreReducer = (state: FirestoreState, action: FirestoreAction): FirestoreState => {
    switch (action.type) {
        case "IS_PENDING":
            return { ...state, isPending: true, success: false, error:null };
        case "ADDED_DOCUMENT":
            return { ...state, isPending: false, document: action.payload, success: true };
        case "DELETED_DOCUMENT":
            return { ...state, isPending:false, success: true };
        case "UPDATED_DOCUMENT":
            return { ...state, isPending: false, document: action.payload, success: true };
        case "ERROR":
            return { ...state, isPending: false, error: action.payload };
        default:
            return state;
    }
};

export const useFirestore = (collectionName: string) => {
    const [response, dispatch] = useReducer(firestoreReducer, initialState);
    const [isCancelled, setIsCancelled] = useState(false);

    const { user } = useAuthContext();

    const colRef = collection(db, collectionName);

    const dispatchIfNotCancelled = (action: FirestoreAction) => {
        if (!isCancelled) {
            dispatch(action)
        }
    };

    const addDocument = async (doc: any, image?: File) => {
        dispatch({ type: "IS_PENDING" });
        try {
            const createdAt = Timestamp.fromDate(new Date());
            let downloadURL = "";

            if (image) {
                const uploadPath = `images/${image.name}`;
                const imageRef = ref(storage,uploadPath);
                await uploadBytes(imageRef, image)
                downloadURL = await getDownloadURL(imageRef);
            }

            const addedDocument = await addDoc(colRef, { ...doc, createdAt, imageURL: downloadURL });
            dispatchIfNotCancelled({ type: "ADDED_DOCUMENT", payload: addedDocument });

        } catch (err:any) {
            dispatchIfNotCancelled({ type:"ERROR", payload: err.message });
        }
    };

    const deleteDocument = async (id: string) => {
        dispatch({ type: "IS_PENDING" });
        try {
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
            dispatchIfNotCancelled({ type: "DELETED_DOCUMENT" });
        } catch (err: any) {
            dispatchIfNotCancelled({ type: "ERROR", payload: "Could not delete" });
        }
    };

    const updateDocument = async (id: string, updates: any) => {
        dispatch({ type: "IS_PENDING" });
        try {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef,updates);
            dispatchIfNotCancelled({ type: "UPDATED_DOCUMENT", payload: updates });
            return updates;
        } catch (err: any) {
            dispatchIfNotCancelled({ type: "ERROR", payload: err.message });
            return null;
        }
    };

    useEffect(() => {
        return () => setIsCancelled(true);
    }, []);

    return { addDocument, deleteDocument, updateDocument, response };
};