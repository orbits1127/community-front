
import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Post as PostType } from '../types';

const Post: React.FC<{ post: PostType }> = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <article className="post">
      {/* Header */}
      <header className="post__header">
        <div className="post__user-info">
          <img src={post.user.avatar} alt={post.user.username} className="post__avatar" />
          <div className="post__user-meta">
            <span className="post__username">{post.user.username}</span>
            {post.location && <span className="post__location">{post.location}</span>}
          </div>
        </div>
        <button className="post__more-btn">
          <MoreHorizontal size={20} />
        </button>
      </header>

      {/* Media Content */}
      <div className="post__media">
        <img 
          src={post.imageUrl} 
          alt="Post content" 
          className="post__img"
          onDoubleClick={() => setLiked(true)}
        />
      </div>

      {/* Actions (Like, Comment, Share, Save) */}
      <div className="post__actions">
        <div className="post__actions-left">
          <button onClick={() => setLiked(!liked)} className="post__action-btn">
            <Heart size={24} fill={liked ? 'var(--ig-error)' : 'none'} color={liked ? 'var(--ig-error)' : 'currentColor'} />
          </button>
          <button className="post__action-btn"><MessageCircle size={24} /></button>
          <button className="post__action-btn"><Send size={24} /></button>
        </div>
        <button onClick={() => setSaved(!saved)} className="post__action-btn">
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
        <div className="post__comment-count">View all {post.commentsCount} comments</div>
      </div>
    </article>
  );
};

export default Post;
