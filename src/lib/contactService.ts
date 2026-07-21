import { db } from "../utils/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ValidationError } from "./errors";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

/**
 * Submit a contact message to the `contactMessages` collection.
 * Validated client-side and by security rules; readable only by admins.
 */
export async function submitContactMessage(input: ContactInput): Promise<void> {
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (name.length < 2 || name.length > 100) {
    throw new ValidationError("Please enter your name.");
  }
  if (!EMAIL_RE.test(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }
  if (message.length < 10 || message.length > 5000) {
    throw new ValidationError("Message must be between 10 and 5000 characters.");
  }

  await addDoc(collection(db, "contactMessages"), {
    name,
    email,
    message,
    status: "new",
    createdAt: serverTimestamp(),
  });
}
