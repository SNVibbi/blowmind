import { db } from "../utils/firebaseConfig";
import { doc, DocumentData, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

interface UseDocumentResult<T> {
    document: T | null;
    error: string | null;
    isPending: boolean;
}

export const useDocument = <T extends DocumentData>(collectionName: string | undefined, id: string | undefined): UseDocumentResult<T> => {
    const [document, setDocument] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState<boolean>(true);

    useEffect(() => {
        // Validate Firestore instance
        if (!db) {
            console.error("Firestore instance is not initialized.");
            setError("Firestore is not initialized.");
            setIsPending(false);
            return;
        }

        // Validate collectionName and id
        if (!collectionName || typeof collectionName !== 'string' || !id || typeof id !== 'string') {
            console.error("Invalid collectionName or id provided:", { collectionName, id });
            setError("Invalid collection or document ID.");
            setIsPending(false);
            return;
        }

       
        const ref = doc(db, collectionName, id);

        const unsub = onSnapshot(
            ref,
            (snapshot) => {
                if (snapshot.exists()) {
                    setDocument({ ...snapshot.data(), id: snapshot.id } as unknown as T);
                    setError(null);
                } else {
                    setDocument(null);
                    setError("No such document exists.");
                }
                setIsPending(false);
            },
            (err) => {
                console.error("Error fetching document:", err.message);
                if (err.code === 'permission-denied') {
                    setError("You do not have permission to access this document.")
                } else {
                    setError("Failed to get document:" + err.message);
                }
                setIsPending(false);
            }
        );

    
        return () => unsub();
    }, [collectionName, id]);

    return { document, error, isPending };
};
