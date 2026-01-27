
import {
  User,
  UserProfile,
  Post,
  Story,
  Highlight,
  Suggestion,
  Comment,
  Notification,
  Conversation,
  ApiResponse,
  PaginatedResponse,
  AuthUser,
  LoginCredentials,
  SignupData,
} from '../types';

// ============================================================================
// API Base Configuration
// ============================================================================
const API_BASE_URL = '/api';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Auth Service
// ============================================================================
export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> {
    return fetchApi<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async signup(data: SignupData): Promise<ApiResponse<AuthUser>> {
    return fetchApi<AuthUser>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<ApiResponse<void>> {
    return fetchApi<void>('/auth/logout', { method: 'POST' });
  },

  async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    return fetchApi<AuthUser>('/auth/me');
  },
};

// ============================================================================
// User Service
// ============================================================================
export const userService = {
  async getProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    return fetchApi<UserProfile>(`/users/${userId}`);
  },

  async getProfileByUsername(username: string): Promise<ApiResponse<UserProfile>> {
    return fetchApi<UserProfile>(`/users/username/${username}/profile`);
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return fetchApi<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async followUser(userId: string, currentUserId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/users/${userId}/follow`, {
      method: 'POST',
      body: JSON.stringify({ userId: currentUserId }),
    });
  },

  async unfollowUser(userId: string, currentUserId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/users/${userId}/unfollow`, {
      method: 'DELETE',
      body: JSON.stringify({ userId: currentUserId }),
    });
  },

  async getFollowers(userId: string, page = 1): Promise<ApiResponse<PaginatedResponse<User>>> {
    return fetchApi<PaginatedResponse<User>>(`/users/${userId}/followers?page=${page}`);
  },

  async getFollowing(userId: string, page = 1): Promise<ApiResponse<PaginatedResponse<User>>> {
    return fetchApi<PaginatedResponse<User>>(`/users/${userId}/following?page=${page}`);
  },

  async getSuggestions(userId?: string): Promise<ApiResponse<Suggestion[]>> {
    const params = userId ? `?userId=${userId}` : '';
    return fetchApi<Suggestion[]>(`/users/suggestions${params}`);
  },

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return fetchApi<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
  },
};

// ============================================================================
// Post Service
// ============================================================================
export const postService = {
  async getFeed(page = 1, userId?: string): Promise<ApiResponse<PaginatedResponse<Post>>> {
    const params = new URLSearchParams({ page: String(page) });
    if (userId) params.set('userId', userId);
    return fetchApi<PaginatedResponse<Post>>(`/posts/feed?${params.toString()}`);
  },

  async getPost(postId: string): Promise<ApiResponse<Post>> {
    return fetchApi<Post>(`/posts/${postId}`);
  },

  async getUserPosts(userId: string, page = 1): Promise<ApiResponse<PaginatedResponse<Post>>> {
    return fetchApi<PaginatedResponse<Post>>(`/users/${userId}/posts?page=${page}`);
  },

  async createPost(data: { userId: string; imageUrl: string; caption: string; location?: string }): Promise<ApiResponse<Post>> {
    return fetchApi<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePost(postId: string, data: Partial<Post>): Promise<ApiResponse<Post>> {
    return fetchApi<Post>(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deletePost(postId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/posts/${postId}`, { method: 'DELETE' });
  },

  async likePost(postId: string, userId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/posts/${postId}/like`, { 
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  async unlikePost(postId: string, userId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/posts/${postId}/like`, { 
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  },

  async savePost(postId: string, userId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/posts/${postId}/save`, { 
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  async unsavePost(postId: string, userId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/posts/${postId}/save`, { 
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  },

  async getSavedPosts(userId: string, page = 1): Promise<ApiResponse<PaginatedResponse<Post>>> {
    const params = new URLSearchParams({ 
      userId, 
      page: String(page)
    });
    return fetchApi<PaginatedResponse<Post>>(`/posts/saved?${params.toString()}`);
  },

  async getExplorePosts(page = 1, userId?: string, limit = 18): Promise<ApiResponse<PaginatedResponse<Post>>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (userId) params.set('userId', userId);
    return fetchApi<PaginatedResponse<Post>>(`/posts/explore?${params.toString()}`);
  },
};

// ============================================================================
// Comment Service
// ============================================================================
export const commentService = {
  async getComments(postId: string, page = 1): Promise<ApiResponse<PaginatedResponse<Comment>>> {
    return fetchApi<PaginatedResponse<Comment>>(`/posts/${postId}/comments?page=${page}`);
  },

  async createComment(postId: string, content: string): Promise<ApiResponse<Comment>> {
    return fetchApi<Comment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async deleteComment(commentId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/comments/${commentId}`, { method: 'DELETE' });
  },

  async likeComment(commentId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/comments/${commentId}/like`, { method: 'POST' });
  },

  async unlikeComment(commentId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/comments/${commentId}/unlike`, { method: 'POST' });
  },
};

// ============================================================================
// Story Service
// ============================================================================
export const storyService = {
  async getStories(userId?: string): Promise<ApiResponse<Story[]>> {
    const params = userId ? `?userId=${userId}` : '';
    return fetchApi<Story[]>(`/stories${params}`);
  },

  async getUserStories(userId: string): Promise<ApiResponse<Story[]>> {
    return fetchApi<Story[]>(`/users/${userId}/stories`);
  },

  async createStory(imageUrl: string): Promise<ApiResponse<Story>> {
    return fetchApi<Story>('/stories', {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    });
  },

  async deleteStory(storyId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/stories/${storyId}`, { method: 'DELETE' });
  },

  async markStoryAsViewed(storyId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/stories/${storyId}/view`, { method: 'POST' });
  },
};

// ============================================================================
// Highlight Service
// ============================================================================
export const highlightService = {
  async getHighlights(userId: string): Promise<ApiResponse<Highlight[]>> {
    return fetchApi<Highlight[]>(`/users/${userId}/highlights`);
  },

  async getHighlightStories(userId: string, highlightId: string): Promise<ApiResponse<Story[]>> {
    return fetchApi<Story[]>(`/users/${userId}/highlights/${highlightId}/stories`);
  },

  async createHighlight(data: { name: string; storyIds: string[] }): Promise<ApiResponse<Highlight>> {
    return fetchApi<Highlight>('/highlights', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateHighlight(highlightId: string, data: Partial<Highlight>): Promise<ApiResponse<Highlight>> {
    return fetchApi<Highlight>(`/highlights/${highlightId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteHighlight(highlightId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/highlights/${highlightId}`, { method: 'DELETE' });
  },
};

// ============================================================================
// Notification Service
// ============================================================================
export const notificationService = {
  async getNotifications(userId: string, page = 1, limit = 20): Promise<ApiResponse<Notification[]>> {
    const params = new URLSearchParams({ 
      userId, 
      page: String(page),
      limit: String(limit)
    });
    return fetchApi<Notification[]>(`/notifications?${params.toString()}`);
  },

  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/notifications/${notificationId}/read`, { method: 'POST' });
  },

  async markAllAsRead(userId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>('/notifications', { 
      method: 'PATCH',
      body: JSON.stringify({ userId })
    });
  },

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return fetchApi<{ count: number }>('/notifications/unread-count');
  },
};

// ============================================================================
// Message Service
// ============================================================================
export const messageService = {
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return fetchApi<Conversation[]>('/conversations');
  },

  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    return fetchApi<Conversation>(`/conversations/${conversationId}`);
  },

  async getMessages(conversationId: string, page = 1): Promise<ApiResponse<PaginatedResponse<import('../types').Message>>> {
    return fetchApi<PaginatedResponse<import('../types').Message>>(`/conversations/${conversationId}/messages?page=${page}`);
  },

  async sendMessage(conversationId: string, content: string): Promise<ApiResponse<import('../types').Message>> {
    return fetchApi<import('../types').Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async createConversation(participantIds: string[]): Promise<ApiResponse<Conversation>> {
    return fetchApi<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantIds }),
    });
  },

  async deleteConversation(conversationId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/conversations/${conversationId}`, { method: 'DELETE' });
  },
};

// ============================================================================
// Upload Service
// ============================================================================
export const uploadService = {
  async uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Upload Error:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
