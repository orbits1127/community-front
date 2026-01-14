'use client';

import React from 'react';
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile } from 'lucide-react';
import { Post as PostType } from '../types';

const CommentModal: React.FC<{ post: PostType; onClose: () => void }> = ({ post, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <button className="modal-close-btn" aria-label="Close modal">
        <X size={32} />
      </button>
      
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Left Side - Image */}
        <div className="modal-image-section">
          <img src={post.imageUrl} alt="Post" className="modal-image" />
        </div>

        {/* Right Side - Details & Comments */}
        <div className="modal-content-section">
          <header className="modal-header">
            <div className="modal-user-info">
              <img src={post.user.avatar} className="modal-avatar" alt={post.user.username} />
              <span className="modal-username">{post.user.username}</span>
              <span className="modal-separator">•</span>
              <button className="modal-follow-btn">Follow</button>
            </div>
            <button className="modal-more-btn" aria-label="More options">
              <MoreHorizontal size={20} />
            </button>
          </header>

          <div className="modal-comments-section">
            {/* Caption */}
            <div className="modal-comment">
              <img src={post.user.avatar} className="modal-comment-avatar" alt={post.user.username} />
              <div className="modal-comment-content">
                <span className="modal-comment-username">{post.user.username}</span>
                <span className="modal-comment-text">{post.caption}</span>
                <div className="modal-comment-time">1d</div>
              </div>
            </div>

            {/* Dummy Comments */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="modal-comment">
                <img src={`https://picsum.photos/seed/comm-${i}/50/50`} className="modal-comment-avatar" alt={`Commenter ${i+1}`} />
                <div className="modal-comment-content">
                  <span className="modal-comment-username">fan_{i+1}</span>
                  <span className="modal-comment-text">This is an incredible shot! The lighting is perfect. ✨</span>
                  <div className="modal-comment-actions">
                    <span>2h</span>
                    <button className="modal-comment-action-btn">12 likes</button>
                    <button className="modal-comment-action-btn">Reply</button>
                  </div>
                </div>
                <button className="modal-comment-like-btn" aria-label="Like comment">
                  <Heart size={12} />
                </button>
              </div>
            ))}
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
              <input type="text" placeholder="Add a comment..." className="modal-comment-input" />
              <button className="modal-post-btn" disabled>Post</button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
