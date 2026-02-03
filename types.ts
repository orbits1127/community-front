
// ============================================================================
// User Types
// ============================================================================
export interface User {
  id: string;
  username: string;
  fullName: string;
  avatar: string | null;
  bio?: string;
  website?: string;
  isFollowing?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile extends User {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isPrivate?: boolean;
}

// ============================================================================
// Post Types
// ============================================================================
export interface Post {
  id: string;
  userId: string;
  user: User;
  imageUrl: string | null;
  caption: string;
  likes: number;
  location?: string;
  createdAt: string;
  updatedAt?: string;
  commentsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: User;
  content: string;
  likes: number;
  createdAt: string;
  isLiked?: boolean;
  replies?: Comment[];
}

// ============================================================================
// Story Types
// ============================================================================
export interface Story {
  id: string;
  userId: string;
  user: User;
  imageUrl: string | null;
  hasUnseenContent: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface Highlight {
  id: string;
  userId: string;
  name: string;
  coverImage: string | null;
  storiesCount: number;
  createdAt: string;
}

// ============================================================================
// Suggestion Types
// ============================================================================
export interface Suggestion {
  id: string;
  user: User;
  reason: string;
}

// ============================================================================
// Notification Types
// ============================================================================
export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'tag';
  actorId: string;
  actor: User;
  recipientId: string;
  postId?: string;
  post?: {
    id: string;
    imageUrl: string;
  };
  message?: string;
  isRead: boolean;
  createdAt: string;
  isOwnActivity?: boolean; // Flag to indicate if this is user's own activity
  postOwner?: User; // Post owner info (for own activities)
  followedUser?: User; // User being followed (for follow activities)
}

// ============================================================================
// Message Types
// ============================================================================
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================
/** 로그인 실패 시 API가 반환하는 에러 코드 */
export type LoginErrorCode =
  | 'EMPTY_CREDENTIALS'   // 아이디 또는 비밀번호 미입력
  | 'USER_NOT_FOUND'      // 해당 아이디/이메일 계정 없음
  | 'INVALID_PASSWORD'    // 비밀번호 불일치
  | 'SERVER_ERROR';       // 서버 내부 오류 등 기타

const LOGIN_ERROR_REASON: Record<string, string> = {
  EMPTY_CREDENTIALS: '아이디 또는 비밀번호를 입력하지 않았습니다.',
  USER_NOT_FOUND: '해당 아이디(또는 이메일)로 등록된 계정이 없습니다.',
  INVALID_PASSWORD: '비밀번호가 일치하지 않습니다.',
  SERVER_ERROR: '서버 오류로 로그인할 수 없습니다.',
};

/** 로그인 에러 코드에 따른 실패 이유 문구 */
export function getLoginErrorReason(errorCode?: string | null): string {
  if (!errorCode) return '';
  return LOGIN_ERROR_REASON[errorCode] ?? '로그인에 실패했습니다.';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  /** 로그인 API 등에서 실패 이유 구분용 */
  errorCode?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Auth Types
// ============================================================================
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string | null;
  accessToken?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  email: string;
  fullName: string;
  username: string;
  password: string;
}
