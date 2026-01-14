'use client';

import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Post, Story, Suggestion, User } from '../types';
import { postService, storyService, userService } from '../services/dataService';

interface FeedViewProps {
  currentUser?: User | null;
  onOpenComments: (post: Post) => void;
}

const FeedView: React.FC<FeedViewProps> = ({ currentUser, onOpenComments }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch feed data
  useEffect(() => {
    const fetchFeedData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch posts, stories, and suggestions in parallel
        const [postsRes, storiesRes, suggestionsRes] = await Promise.all([
          postService.getFeed(),
          storyService.getStories(),
          userService.getSuggestions(),
        ]);

        if (postsRes.success && postsRes.data) {
          setPosts(postsRes.data.items);
        }
        if (storiesRes.success && storiesRes.data) {
          setStories(storiesRes.data);
        }
        if (suggestionsRes.success && suggestionsRes.data) {
          setSuggestions(suggestionsRes.data);
        }
      } catch (err) {
        setError('Failed to load feed');
        console.error('Error loading feed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedData();
  }, []);

  // Handle post like
  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }
      // Update local state
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, isLiked: !isLiked, likes: isLiked ? post.likes - 1 : post.likes + 1 }
            : post
        )
      );
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Handle post save
  const handleSave = async (postId: string, isSaved: boolean) => {
    try {
      if (isSaved) {
        await postService.unsavePost(postId);
      } else {
        await postService.savePost(postId);
      }
      // Update local state
      setPosts(prev =>
        prev.map(post =>
          post.id === postId ? { ...post, isSaved: !isSaved } : post
        )
      );
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  // Handle follow suggestion
  const handleFollow = async (userId: string) => {
    try {
      await userService.followUser(userId);
      // Remove from suggestions after following
      setSuggestions(prev => prev.filter(s => s.user.id !== userId));
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  // Render placeholder when no data
  const renderPlaceholder = (count: number) =>
    Array.from({ length: count });

  return (
    <div className="feed-container">
      {/* Left Column: Feed Content */}
      <div className="feed-main">
        {/* Stories */}
        <div className="story-tray">
          {stories.length > 0
            ? stories.map(story => (
                <div key={story.id} className="story-item">
                  <div className="story-item__ring">
                    <div className="story-item__inner">
                      {story.user.avatar ? (
                        <img
                          src={story.user.avatar}
                          alt={story.user.username}
                          className="story-item__img"
                        />
                      ) : (
                        <div className="story-item__placeholder"></div>
                      )}
                    </div>
                  </div>
                  <span className="story-item__username">{story.user.username}</span>
                </div>
              ))
            : renderPlaceholder(8).map((_, index) => (
                <div key={index} className="story-item">
                  <div className="story-item__ring">
                    <div className="story-item__inner">
                      <div className="story-item__placeholder"></div>
                    </div>
                  </div>
                  <span className="story-item__username">username</span>
                </div>
              ))}
        </div>

        {/* Posts */}
        <div className="feed-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ig-secondary-text)' }}>
              Loading...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ig-error)' }}>
              {error}
            </div>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <article key={post.id} className="post">
                {/* Post Header */}
                <div className="post__header">
                  <div className="post__user-info">
                    {post.user.avatar ? (
                      <img src={post.user.avatar} alt={post.user.username} className="post__avatar" />
                    ) : (
                      <div className="post__avatar-placeholder"></div>
                    )}
                    <div className="post__user-meta">
                      <span className="post__username">{post.user.username}</span>
                      {post.location && <span className="post__location">{post.location}</span>}
                    </div>
                  </div>
                  <button className="post__more-btn">
                    <MoreHorizontal size={24} />
                  </button>
                </div>

                {/* Post Image */}
                <div className="post__media">
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt="Post" className="post__img" />
                  ) : (
                    <div className="post__image-placeholder"></div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="post__actions">
                  <div className="post__actions-left">
                    <button
                      className="post__action-btn"
                      onClick={() => handleLike(post.id, post.isLiked || false)}
                    >
                      <Heart size={24} fill={post.isLiked ? '#ed4956' : 'none'} color={post.isLiked ? '#ed4956' : 'currentColor'} />
                    </button>
                    <button className="post__action-btn" onClick={() => onOpenComments(post)}>
                      <MessageCircle size={24} />
                    </button>
                    <button className="post__action-btn">
                      <Send size={24} />
                    </button>
                  </div>
                  <button
                    className="post__action-btn"
                    onClick={() => handleSave(post.id, post.isSaved || false)}
                  >
                    <Bookmark size={24} fill={post.isSaved ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Post Content */}
                <div className="post__content">
                  <div className="post__likes">{post.likes.toLocaleString()} likes</div>
                  <div className="post__caption">
                    <span className="post__caption-user">{post.user.username}</span>
                    {post.caption}
                  </div>
                  {post.commentsCount > 0 && (
                    <button className="post__comment-count" onClick={() => onOpenComments(post)}>
                      View all {post.commentsCount} comments
                    </button>
                  )}
                </div>
              </article>
            ))
          ) : (
            // Empty state - show placeholders
            renderPlaceholder(3).map((_, index) => (
              <article key={index} className="post">
                <div className="post__header">
                  <div className="post__user-info">
                    <div className="post__avatar-placeholder"></div>
                    <div className="post__user-meta">
                      <div className="post__username-placeholder"></div>
                      <div className="post__location-placeholder"></div>
                    </div>
                  </div>
                  <button className="post__more-btn">
                    <MoreHorizontal size={24} />
                  </button>
                </div>
                <div className="post__media">
                  <div className="post__image-placeholder"></div>
                </div>
                <div className="post__actions">
                  <div className="post__actions-left">
                    <button className="post__action-btn"><Heart size={24} /></button>
                    <button className="post__action-btn"><MessageCircle size={24} /></button>
                    <button className="post__action-btn"><Send size={24} /></button>
                  </div>
                  <button className="post__action-btn"><Bookmark size={24} /></button>
                </div>
                <div className="post__content">
                  <div className="post__likes-placeholder"></div>
                  <div className="post__caption-placeholder">
                    <div className="post__caption-line"></div>
                    <div className="post__caption-line post__caption-line--short"></div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Suggestions Sidebar */}
      <aside className="feed-sidebar">
        <div className="h-sidebar">
          {/* Current User */}
          <div className="h-sidebar__user-summary">
            <div className="h-sidebar__profile">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.username} className="h-sidebar__avatar" />
              ) : (
                <div className="h-sidebar__avatar-placeholder"></div>
              )}
              <div className="h-sidebar__user-info">
                {currentUser ? (
                  <>
                    <span className="h-sidebar__username">{currentUser.username}</span>
                    <span className="h-sidebar__fullname">{currentUser.fullName}</span>
                  </>
                ) : (
                  <>
                    <div className="h-sidebar__username-placeholder"></div>
                    <div className="h-sidebar__fullname-placeholder"></div>
                  </>
                )}
              </div>
            </div>
            <button className="h-sidebar__btn">Switch</button>
          </div>

          {/* Suggestions Header */}
          <div className="h-sidebar__suggestions-header">
            <span className="h-sidebar__label">Suggested for you</span>
            <button className="h-sidebar__btn h-sidebar__btn--black">See All</button>
          </div>

          {/* Suggestions List */}
          <div className="h-sidebar__list">
            {suggestions.length > 0
              ? suggestions.map(suggestion => (
                  <div key={suggestion.id} className="h-sidebar__item">
                    <div className="h-sidebar__suggested-user">
                      {suggestion.user.avatar ? (
                        <img
                          src={suggestion.user.avatar}
                          alt={suggestion.user.username}
                          className="h-sidebar__avatar-small"
                        />
                      ) : (
                        <div className="h-sidebar__avatar-small-placeholder"></div>
                      )}
                      <div className="h-sidebar__suggested-info">
                        <span className="h-sidebar__username">{suggestion.user.username}</span>
                        <span className="h-sidebar__reason">{suggestion.reason}</span>
                      </div>
                    </div>
                    <button
                      className="h-sidebar__btn"
                      onClick={() => handleFollow(suggestion.user.id)}
                    >
                      Follow
                    </button>
                  </div>
                ))
              : renderPlaceholder(5).map((_, index) => (
                  <div key={index} className="h-sidebar__item">
                    <div className="h-sidebar__suggested-user">
                      <div className="h-sidebar__avatar-small-placeholder"></div>
                      <div className="h-sidebar__suggested-info">
                        <div className="h-sidebar__username-placeholder"></div>
                        <span className="h-sidebar__reason">Suggested for you</span>
                      </div>
                    </div>
                    <button className="h-sidebar__btn">Follow</button>
                  </div>
                ))}
          </div>

          {/* Footer Links */}
          <div className="h-sidebar__footer">
            <div className="h-sidebar__links">
              <span className="h-sidebar__link">About</span>
              <span className="h-sidebar__dot">·</span>
              <span className="h-sidebar__link">Help</span>
              <span className="h-sidebar__dot">·</span>
              <span className="h-sidebar__link">Press</span>
              <span className="h-sidebar__dot">·</span>
              <span className="h-sidebar__link">API</span>
              <span className="h-sidebar__dot">·</span>
              <span className="h-sidebar__link">Jobs</span>
              <span className="h-sidebar__dot">·</span>
              <span className="h-sidebar__link">Privacy</span>
              <span className="h-sidebar__dot">·</span>
              <span className="h-sidebar__link">Terms</span>
            </div>
            <span className="h-sidebar__copyright">© 2026 INSTAGRAM FROM META</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default FeedView;
