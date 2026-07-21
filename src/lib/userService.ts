import { db, storage } from "../utils/firebaseConfig";
import { User as FirebaseUser, updateProfile } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { compressAvatar, validateImageFile } from "./imageUtils";
import { ValidationError } from "./errors";

/**
 * Canonical shape of a users/{uid} document.
 *
 * NOTE on legacy data: older code wrote inconsistent fields
 * (`photoUrl` vs `photoURL`, `interest` vs `interests`). Reads should go
 * through normalizeUserProfile() until a backfill migration has run.
 */
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  photoUrl: string;
  headline: string;
  interests: string[];
  category: string;
  online: boolean;
}

export const DEFAULT_AVATAR = "/img/default-avatar.png";

function splitDisplayName(displayName: string | null): {
  firstName: string;
  lastName: string;
} {
  const [firstName = "", ...rest] = (displayName ?? "").trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

/** Normalize a raw Firestore user document into the canonical shape. */
export function normalizeUserProfile(
  data: Record<string, unknown>
): UserProfile {
  return {
    firstName: typeof data.firstName === "string" ? data.firstName : "",
    lastName: typeof data.lastName === "string" ? data.lastName : "",
    email: typeof data.email === "string" ? data.email : "",
    photoUrl:
      (typeof data.photoUrl === "string" && data.photoUrl) ||
      (typeof data.photoURL === "string" && data.photoURL) ||
      DEFAULT_AVATAR,
    headline: typeof data.headline === "string" ? data.headline : "",
    interests: Array.isArray(data.interests)
      ? (data.interests as string[])
      : Array.isArray(data.interest)
        ? (data.interest as string[])
        : [],
    category: typeof data.category === "string" ? data.category : "",
    online: data.online === true,
  };
}

/**
 * Create the users/{uid} document if it doesn't exist, or merge missing
 * fields into it if it does. NEVER overwrites existing profile data —
 * this replaces the old sign-up paths that clobbered returning users'
 * documents with a bare setDoc.
 *
 * Returns the profile as it exists after the call.
 */
export async function ensureUserProfile(
  user: FirebaseUser,
  extras: Partial<Pick<UserProfile, "firstName" | "lastName" | "photoUrl" | "category">> = {}
): Promise<{ profile: UserProfile; created: boolean }> {
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    await updateDoc(ref, { online: true, updatedAt: serverTimestamp() });
    return { profile: normalizeUserProfile(snapshot.data()), created: false };
  }

  const fromDisplayName = splitDisplayName(user.displayName);
  const profile: UserProfile = {
    firstName: extras.firstName ?? fromDisplayName.firstName,
    lastName: extras.lastName ?? fromDisplayName.lastName,
    email: user.email ?? "",
    photoUrl: extras.photoUrl ?? user.photoURL ?? DEFAULT_AVATAR,
    headline: "",
    interests: [],
    category: extras.category ?? "",
    online: true,
  };

  await setDoc(
    ref,
    { ...profile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true }
  );

  return { profile, created: true };
}

/** Best-effort online/offline flag update; never throws. */
export async function setOnlineStatus(
  uid: string,
  online: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid), { online });
  } catch {
    // Presence is cosmetic; a failure here must not block login/logout.
  }
}

/**
 * Compress and upload a new avatar to a unique per-user Storage path and
 * return its download URL. Validates type/size first.
 */
export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) throw new ValidationError(validationError);

  const compressed = await compressAvatar(file);
  const path = `thumbnails/${uid}/${uuidv4()}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, compressed, { contentType: compressed.type });
  return getDownloadURL(storageRef);
}

export interface ProfileEdits {
  firstName: string;
  lastName: string;
  headline: string;
  photoUrl?: string;
}

/**
 * Update the signed-in user's editable profile fields on both the auth
 * record (displayName/photoURL) and the users/{uid} document. Only the
 * fields the security rules permit an owner to change are written.
 */
export async function updateUserProfile(
  user: FirebaseUser,
  edits: ProfileEdits
): Promise<void> {
  const firstName = edits.firstName.trim();
  const lastName = edits.lastName.trim();
  const headline = edits.headline.trim();

  if (!firstName || firstName.length > 100) {
    throw new ValidationError("Please enter your first name.");
  }
  if (lastName.length > 100) {
    throw new ValidationError("Last name is too long.");
  }
  if (headline.length > 200) {
    throw new ValidationError("Headline must be 200 characters or fewer.");
  }

  await updateProfile(user, {
    displayName: `${firstName} ${lastName}`.trim(),
    ...(edits.photoUrl ? { photoURL: edits.photoUrl } : {}),
  });

  await updateDoc(doc(db, "users", user.uid), {
    firstName,
    lastName,
    headline,
    ...(edits.photoUrl ? { photoUrl: edits.photoUrl } : {}),
    updatedAt: serverTimestamp(),
  });
}
