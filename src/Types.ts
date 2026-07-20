export interface FirestoreTimestamp {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
}

export interface PostAuthor {
  firstName: string;
  lastName: string;
  photoURL: string;
  id: string;
  headline: string;
}

/**
 * posts/{postId}
 *
 * Interaction data lives in subcollections with denormalized counters on
 * the post document:
 *   posts/{postId}/comments/{commentId}
 *   posts/{postId}/likes/{uid}
 *   posts/{postId}/views/{uid}
 * Bookmarks live in the top-level bookmarks/{uid_postId} collection.
 *
 * The legacy fields (comments/likes/bookmarks/views arrays) still exist
 * on documents created before the Stage 4 migration; read counts through
 * getPostCounts() so both shapes work.
 */
export interface Post {
  id: string;
  author: PostAuthor;
  createdAt: FirestoreTimestamp;
  content: string;
  imageURL: string;
  title: string;
  tags: string[];
  share: string;
  userId?: string;

  // Denormalized counters (authoritative for migrated posts)
  commentCount?: number;
  likeCount?: number;
  bookmarkCount?: number;
  viewCount?: number;
  expands: number;

  // Legacy embedded arrays (pre-migration documents only)
  comments?: LegacyComment[];
  likes?: LegacyLike[];
  bookmarks?: LegacyBookmark[];
  views?: LegacyView[];
}

/** posts/{postId}/comments/{commentId} */
export interface Comment {
  id: string;
  userId: string;
  displayName: string;
  photoURL: string;
  content: string;
  createdAt: FirestoreTimestamp;
}

/** posts/{postId}/likes/{uid} */
export interface Like {
  uid: string;
  displayName: string;
  photoURL: string;
  createdAt: FirestoreTimestamp;
}

/** bookmarks/{uid_postId} */
export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt?: FirestoreTimestamp;
}

// ---------------------------------------------------------------------
// Legacy shapes (embedded in pre-migration post documents)
// ---------------------------------------------------------------------

export interface LegacyLike {
  uid: string;
  displayName: string;
  photoURL: string;
  createdAt: FirestoreTimestamp;
  id: number;
}

export interface LegacyComment {
  id: string;
  userId: string;
  displayName: string;
  photoURL: string;
  content: string;
  createdAt: FirestoreTimestamp;
}

export interface LegacyBookmark {
  userId: string;
  id: string;
  postId: string;
}

export interface LegacyView {
  uid: string;
  id: string;
}

// ---------------------------------------------------------------------
// Misc shared types
// ---------------------------------------------------------------------

export interface AvatarProps {
  src: string | null;
}

export interface BookmarkIconProps {
  post: Post;
}

export interface UserCategoryProps {
  value: string;
  label: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  interests: string[];
  email: string;
}

export interface Message {
  type: string;
  message: string;
}
