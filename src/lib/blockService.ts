import { db } from "../utils/firebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

/**
 * Block / mute is a personal, one-way filter: the entries in
 * blocks/{blockerUid}_{targetUid} list the users whose content the
 * blocker no longer wants to see. Filtering happens client-side against
 * this list (feed + comments); the list itself is private to its owner.
 *
 *  - "block": stronger intent (hide everywhere).
 *  - "mute":  quieter intent (hide from feed) — same filtering today,
 *             kept as a distinct type for future divergence.
 */
export type BlockType = "block" | "mute";

export interface BlockEntry {
  id: string;
  userId: string;
  targetUid: string;
  type: BlockType;
  createdAt?: { seconds: number };
}

export async function blockUser(
  blockerUid: string,
  targetUid: string,
  type: BlockType = "block"
): Promise<void> {
  if (blockerUid === targetUid) return; // can't block yourself
  await setDoc(doc(db, "blocks", `${blockerUid}_${targetUid}`), {
    userId: blockerUid,
    targetUid,
    type,
    createdAt: serverTimestamp(),
  });
}

export async function unblockUser(
  blockerUid: string,
  targetUid: string
): Promise<void> {
  await deleteDoc(doc(db, "blocks", `${blockerUid}_${targetUid}`));
}

export async function fetchBlocks(blockerUid: string): Promise<BlockEntry[]> {
  const snapshot = await getDocs(
    query(collection(db, "blocks"), where("userId", "==", blockerUid))
  );
  return snapshot.docs.map((d) => ({
    ...(d.data() as Omit<BlockEntry, "id">),
    id: d.id,
  }));
}
