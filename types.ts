
export interface User {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  user: User;
  imageUrl: string;
  caption: string;
  likes: number;
  location?: string;
  createdAt: string;
  commentsCount: number;
}

export interface Story {
  id: string;
  user: User;
  hasUnseenContent: boolean;
}
