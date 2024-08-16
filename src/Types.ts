export interface Like {
  uid: string;
  displayName: string;
  photoURL: string;
  createdAt: {
    toDate(): Date;
    seconds: number;
    nanoseconds: number;
  };
  id: number;
}

export interface Post {
    id: string;
    author: {
      firstName: string;
      lastName: string;
      photoURL: string;
      id: string;
      headline: string;
    };
    createdAt: {
      toDate(): Date;
      seconds: number;
      nanoseconds: number;
    };
    content: string;
    imageURL: string;
    comments: Comment[];
    likes: Like[];
    share: string;
    views: string[];
    bookmarks: Bookmark[];
    expands: number;
    title: string;
    tags: string[];
  }

  export interface Comment {
    id: string;
    displayName: string;
    photoURL: string;
    content: string;
    createdAt: {
      seconds: number;
      toDate(): Date;
      nanoseconds: number;
    };
  }
  
  export interface AvatarProps {
    src: string | null;
  }
  
  export interface BookmarkIconProps {
    post: Post;
  }
  
  export interface BookmarkedItem {
    userId: string;
  }
  
  export interface BookmarkToAdd {
    userId?: string;
    id: string;
    postId: string;
  }
  
  export interface BookmarkProps {
    userId?: string;
    postId: string;
    author: {
      firstName: string;
      lastName: string;
      photoURL: string;
      id: string;
      headline: string;
    };
    title: string;
    content: string;
    imageURL: string;
    comments: Comment[];
    likes: Like[];
    share: string;
    views: string[];
    bookmarks: BookmarkedItem[];
  }
  
  export interface UserCategoryProps {
    value: string;
    label: string;
  }

  export interface Bookmark {
    userId: string;
    id: string;
    postId: string;
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