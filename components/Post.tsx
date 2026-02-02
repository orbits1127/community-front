
import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Post as PostType } from '../types';

interface PostProps {
  post: PostType;
  onOpenComments?: (post: PostType) => void;
}

const Post: React.FC<PostProps> = ({ post, onOpenComments }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <article className="post">
      {/* Header */}
      <header className="post__header">
        <div className="post__user-info">
          <img src={post.user.avatar ?? ''} alt={post.user.username} className="post__avatar" />
          <div className="post__user-meta">
            <span className="post__username">{post.user.username}</span>
            {post.location && <span className="post__location">{post.location}</span>}
          </div>
        </div>
        <button className="post__more-btn" aria-label="More options">
          <MoreHorizontal size={20} />
        </button>
      </header>

      {/* Media Content */}
      <div className="post__media">
        <img 
          src={post.imageUrl ?? ''} 
          alt="Post content" 
          className="post__img"
          onDoubleClick={() => setLiked(true)}
        />
      </div>

      {/* Actions (Like, Comment, Share, Save) */}
      <div className="post__actions">
        <div className="post__actions-left">
          <button onClick={() => setLiked(!liked)} className="post__action-btn" aria-label={liked ? 'Unlike' : 'Like'}>
            <Heart size={24} fill={liked ? 'var(--ig-error)' : 'none'} color={liked ? 'var(--ig-error)' : 'currentColor'} />
          </button>
          <button className="post__action-btn" onClick={() => onOpenComments?.(post)} aria-label="View comments">
            <MessageCircle size={24} />
          </button>
          <button className="post__action-btn" aria-label="Share">
            <Send size={24} />
          </button>
        </div>
        <button onClick={() => setSaved(!saved)} className="post__action-btn" aria-label={saved ? 'Unsave' : 'Save'}>
          <Bookmark size={24} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Text Content */}
      <div className="post__content">
        <div className="post__likes">{post.likes.toLocaleString()} likes</div>
        <div className="post__caption">
          <span className="post__caption-user">{post.user.username}</span>
          {post.caption}
        </div>
        <button className="post__comment-count" onClick={() => onOpenComments?.(post)}>
          View all {post.commentsCount} comments
        </button>
      </div>
    </article>
  );
};

export default Post;
