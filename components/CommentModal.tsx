'use client';

import React, { useEffect, useState } from 'react';
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile } from 'lucide-react';
import { Post as PostType, Comment, AuthUser } from '../types';
import { commentService } from '../services/dataService';

interface CommentModalProps {
  post: PostType;
  currentUser?: AuthUser | null;
  onClose: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ post, currentUser, onClose }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  
  // Safe access to user data with fallbacks
  const user = post.user || {
    id: '',
    username: 'unknown',
    fullName: 'Unknown User',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
  };
  const avatar = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop';
  const username = user.username || 'unknown';

  // Fetch comments when modal opens
  // Fetch exactly commentsCount comments to match the displayed count
  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        // Fetch comments with limit matching commentsCount
        const targetCount = post.commentsCount || 0;
        const limit = Math.max(targetCount, 20); // At least fetch 20, or more if commentsCount is higher
        
        // Use fetch directly to pass limit parameter
        const response = await fetch(`/api/posts/${post.id}/comments?page=1&limit=${limit}`);
        const commentsRes = await response.json();
        
        if (commentsRes.success && commentsRes.data) {
          // API returns { items: Comment[], ... } format
          const fetchedComments = commentsRes.data.items || [];
          
          // Limit to commentsCount to match the displayed number
          // If commentsCount is 2, show exactly 2 comments
          const limitedComments = targetCount > 0 
            ? fetchedComments.slice(0, targetCount)
            : fetchedComments;
          
          setComments(limitedComments);
        } else {
          // If no comments found, set empty array
          setComments([]);
        }
      } catch (err) {
        console.error('Error loading comments:', err);
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [post.id, post.commentsCount]);

  // Handle posting a comment
  const handlePostComment = async () => {
    if (!commentText.trim() || !currentUser || postingComment) return;

    setPostingComment(true);
    try {
      // Create comment via API
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          content: commentText.trim(),
        }),
      });

      const commentRes = await response.json();
      
      if (commentRes.success && commentRes.data) {
        // Transform API response to Comment type
        const newComment: Comment = {
          id: commentRes.data.id,
          postId: commentRes.data.postId,
          userId: commentRes.data.userId,
          user: {
            id: currentUser.id,
            username: currentUser.username,
            fullName: currentUser.fullName,
            avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
          },
          content: commentRes.data.content,
          likes: 0,
          createdAt: commentRes.data.createdAt || new Date().toISOString(),
        };

        // Add new comment at the beginning (most recent first)
        setComments(prev => [newComment, ...prev]);
        
        // Clear input
        setCommentText('');
      } else {
        console.error('Failed to post comment:', commentRes.error);
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <button className="modal-close-btn" aria-label="Close modal">
        <X size={32} />
      </button>
      
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Left Side - Image */}
        <div className="modal-image-section">
          <img src={post.imageUrl || 'https://via.placeholder.com/600'} alt="Post" className="modal-image" />
        </div>

        {/* Right Side - Details & Comments */}
        <div className="modal-content-section">
          <header className="modal-header">
            <div className="modal-user-info">
              <img src={avatar} className="modal-avatar" alt={username} />
              <span className="modal-username">{username}</span>
              <span className="modal-separator">•</span>
              <button className="modal-follow-btn">Follow</button>
            </div>
            <button className="modal-more-btn" aria-label="More options">
              <MoreHorizontal size={20} />
            </button>
          </header>

          <div className="modal-comments-section">
            {/* Caption */}
            {post.caption && (
              <div className="modal-comment">
                <img src={avatar} className="modal-comment-avatar" alt={username} />
                <div className="modal-comment-content">
                  <span className="modal-comment-username">{username}</span>
                  <span className="modal-comment-text">{post.caption}</span>
                  <div className="modal-comment-time">1d</div>
                </div>
              </div>
            )}

            {/* Actual Comments */}
            {loadingComments ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ig-secondary-text)' }}>
                Loading comments...
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="modal-comment">
                  <img 
                    src={comment.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'} 
                    className="modal-comment-avatar" 
                    alt={comment.user?.username || 'user'} 
                  />
                  <div className="modal-comment-content">
                    <span className="modal-comment-username">{comment.user?.username || 'unknown'}</span>
                    <span className="modal-comment-text">{comment.content}</span>
                    <div className="modal-comment-actions">
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      {comment.likes > 0 && (
                        <button className="modal-comment-action-btn">{comment.likes} likes</button>
                      )}
                      <button className="modal-comment-action-btn">Reply</button>
                    </div>
                  </div>
                  <button className="modal-comment-like-btn" aria-label="Like comment">
                    <Heart size={12} fill={comment.isLiked ? 'currentColor' : 'none'} />
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ig-secondary-text)' }}>
                No comments yet
              </div>
            )}
          </div>

          <footer className="modal-footer">
            <div className="modal-actions">
              <div className="modal-actions-left">
                <button className="modal-action-btn" aria-label="Like"><Heart size={24} /></button>
                <button className="modal-action-btn" aria-label="Comment"><MessageCircle size={24} /></button>
                <button className="modal-action-btn" aria-label="Share"><Send size={24} /></button>
              </div>
              <button className="modal-action-btn" aria-label="Save"><Bookmark size={24} /></button>
            </div>
            <div className="modal-likes">{post.likes.toLocaleString()} likes</div>
            <div className="modal-timestamp">1 day ago</div>
            
            <div className="modal-add-comment">
              <Smile size={24} className="modal-emoji-btn" />
              <input 
                type="text" 
                placeholder="Add a comment..." 
                className="modal-comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commentText.trim() && !postingComment) {
                    handlePostComment();
                  }
                }}
              />
              <button 
                className="modal-post-btn" 
                disabled={!commentText.trim() || postingComment}
                onClick={handlePostComment}
                style={{
                  opacity: commentText.trim() && !postingComment ? 1 : 0.5,
                  cursor: commentText.trim() && !postingComment ? 'pointer' : 'not-allowed',
                }}
              >
                {postingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
