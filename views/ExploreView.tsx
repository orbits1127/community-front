'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Post, AuthUser } from '../types';
import { postService } from '../services/dataService';
import CommentModal from '../components/CommentModal';

// =============================================================================
// Types
// =============================================================================

interface ExploreViewProps {
  currentUser?: AuthUser | null;
}

// =============================================================================
// Skeleton: explore card placeholder
// =============================================================================

const ExploreCardPlaceholder: React.FC = () => (
  <div className="explore-card">
    <div className="explore-card__overlay">
      <div className="explore-card__stat-placeholder">
        <div className="explore-card__icon-shape"></div>
        <div className="explore-card__text-shape"></div>
      </div>
      <div className="explore-card__stat-placeholder">
        <div className="explore-card__icon-shape"></div>
        <div className="explore-card__text-shape"></div>
      </div>
    </div>
  </div>
);

const ExploreView: React.FC<ExploreViewProps> = ({ currentUser }) => {
  // =============================================================================
  // State: posts list, loading, selected post (modal), like/save animations
  // =============================================================================
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [likeAnimations, setLikeAnimations] = useState<Record<string, boolean>>({});
  const [saveAnimations, setSaveAnimations] = useState<Record<string, boolean>>({});

  // =============================================================================
  // Explore posts load (exclude following, min 18)
  // =============================================================================
  useEffect(() => {
    const fetchExplorePosts = async () => {
      setLoading(true);
      try {
        // Pass userId to exclude followed users' posts
        // Fetch at least 18 posts
        const postsRes = await postService.getExplorePosts(1, currentUser?.id, 18);
        if (postsRes.success && postsRes.data) {
          setPosts(postsRes.data.items || []);
        }
      } catch (err) {
        console.error('Error loading explore posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExplorePosts();
  }, [currentUser?.id]);

  // =============================================================================
  // Like: toggle + animation + optimistic update
  // =============================================================================
  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!currentUser?.id) return;

    // Trigger animation
    if (!isLiked) {
      setLikeAnimations(prev => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setLikeAnimations(prev => ({ ...prev, [postId]: false }));
      }, 1000);
    }
    
    // Optimistic update
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, isLiked: !isLiked, likes: isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
    
    try {
      if (isLiked) {
        await postService.unlikePost(postId, currentUser.id);
      } else {
        await postService.likePost(postId, currentUser.id);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert on error
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, isLiked: isLiked, likes: isLiked ? post.likes : post.likes - 1 }
            : post
        )
      );
    }
  }, [currentUser?.id]);

  // =============================================================================
  // Save: toggle + animation + optimistic update
  // =============================================================================
  const handleSave = useCallback(async (postId: string, isSaved: boolean) => {
    if (!currentUser?.id) return;

    // Trigger animation
    setSaveAnimations(prev => ({ ...prev, [postId]: true }));
    setTimeout(() => {
      setSaveAnimations(prev => ({ ...prev, [postId]: false }));
    }, 500);
    
    // Optimistic update
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, isSaved: !isSaved }
          : post
      )
    );
    
    try {
      if (isSaved) {
        await postService.unsavePost(postId, currentUser.id);
      } else {
        await postService.savePost(postId, currentUser.id);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      // Revert on error
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, isSaved: isSaved }
            : post
        )
      );
    }
  }, [currentUser?.id]);

  return (
    <div className="explore-page">
      {/* ---------- Section: explore grid (loading skeleton / post cards / empty) ---------- */}
      <main className="explore-grid">
        {loading ? (
          /* Loading: 9 skeletons */
          Array.from({ length: 9 }).map((_, i) => (
            <ExploreCardPlaceholder key={`placeholder-${i}`} />
          ))
        ) : posts.length > 0 ? (
          /* Post card: click loads detail then comment modal */
          posts.map((post) => (
            <div 
              key={post.id} 
              className="explore-card"
              onClick={() => {
                // Fetch full post data before opening modal
                postService.getPost(post.id).then(res => {
                  if (res.success && res.data) {
                    setSelectedPost(res.data);
                  } else {
                    setSelectedPost(post);
                  }
                }).catch(() => {
                  setSelectedPost(post);
                });
              }}
              style={{ cursor: 'pointer' }}
            >
              {post.imageUrl ? (
                <img 
                  src={post.imageUrl} 
                  alt={post.caption || 'Post'} 
                  className="explore-card__image"
                />
              ) : (
                <div className="explore-card__placeholder"></div>
              )}
              <div className="explore-card__overlay">
                <div className="explore-card__stat">
                  <Heart size={20} fill="#fff" color="#fff" />
                  <span>{post.likes.toLocaleString()}</span>
                </div>
                <div className="explore-card__stat">
                  <MessageCircle size={20} fill="#fff" color="#fff" />
                  <span>{post.commentsCount}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          /* Empty state: 9 skeletons */
          Array.from({ length: 9 }).map((_, i) => (
            <ExploreCardPlaceholder key={`empty-${i}`} />
          ))
        )}
      </main>

      {/* ========== Modal: comments (CommentModal) ========== */}
      {selectedPost && (
        <CommentModal 
          post={selectedPost} 
          currentUser={currentUser}
          onClose={() => setSelectedPost(null)} 
        />
      )}
    </div>
  );
};

export default ExploreView;
