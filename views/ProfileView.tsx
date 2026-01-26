'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Grid, Film, Bookmark, UserSquare2, Settings, Plus, Heart, MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserProfile, Post, Highlight, Story } from '../types';
import { userService, postService, highlightService } from '../services/dataService';
import CommentModal from '../components/CommentModal';

interface ProfileViewProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const ProfileView: React.FC<ProfileViewProps> = ({ userId, isOwnProfile = true }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Story modal state
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [highlightStories, setHighlightStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  
  // Post modal state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [profileRes, postsRes, highlightsRes] = await Promise.all([
          userService.getProfile(userId),
          postService.getUserPosts(userId),
          highlightService.getHighlights(userId),
        ]);

        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        }
        if (postsRes.success && postsRes.data) {
          const items = Array.isArray(postsRes.data)
            ? postsRes.data
            : (postsRes.data as { items?: Post[] })?.items ?? [];
          setPosts(items);
        }
        if (highlightsRes.success && highlightsRes.data) {
          setHighlights(Array.isArray(highlightsRes.data) ? highlightsRes.data : []);
        }
      } catch (err) {
        setError('Failed to load profile');
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!profile || !userId) return;

    try {
      if (profile.isFollowing) {
        await userService.unfollowUser(profile.id, userId);
        setProfile(prev =>
          prev
            ? { ...prev, isFollowing: false, followersCount: prev.followersCount - 1 }
            : null
        );
      } else {
        await userService.followUser(profile.id, userId);
        setProfile(prev =>
          prev
            ? { ...prev, isFollowing: true, followersCount: prev.followersCount + 1 }
            : null
        );
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  // Handle highlight click - fetch and show stories
  const handleHighlightClick = useCallback(async (highlight: Highlight) => {
    if (!userId) return;
    
    setLoadingStories(true);
    try {
      const storiesRes = await highlightService.getHighlightStories(userId, highlight.id);
      if (storiesRes.success && storiesRes.data && storiesRes.data.length > 0) {
        setHighlightStories(storiesRes.data);
        setSelectedStory(storiesRes.data[0]);
        setStoryIndex(0);
      } else {
        console.log('No stories found for this highlight');
      }
    } catch (err) {
      console.error('Error loading highlight stories:', err);
    } finally {
      setLoadingStories(false);
    }
  }, [userId]);

  // Story navigation handlers
  const handlePrevStory = useCallback(() => {
    if (storyIndex > 0) {
      const prevIndex = storyIndex - 1;
      setStoryIndex(prevIndex);
      setSelectedStory(highlightStories[prevIndex]);
    }
  }, [storyIndex, highlightStories]);

  const handleNextStory = useCallback(() => {
    if (storyIndex < highlightStories.length - 1) {
      const nextIndex = storyIndex + 1;
      setStoryIndex(nextIndex);
      setSelectedStory(highlightStories[nextIndex]);
    } else {
      // Close modal if no more stories
      setSelectedStory(null);
      setHighlightStories([]);
    }
  }, [storyIndex, highlightStories]);

  // Keyboard navigation for stories
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedStory) return;
      
      if (e.key === 'ArrowLeft') {
        handlePrevStory();
      } else if (e.key === 'ArrowRight') {
        handleNextStory();
      } else if (e.key === 'Escape') {
        setSelectedStory(null);
        setHighlightStories([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStory, handlePrevStory, handleNextStory]);

  const tabs = [
    { id: 'posts', label: 'POSTS', icon: <Grid size={12} /> },
    { id: 'reels', label: 'REELS', icon: <Film size={12} /> },
    { id: 'saved', label: 'SAVED', icon: <Bookmark size={12} />, showOnlyOwn: true },
    { id: 'tagged', label: 'TAGGED', icon: <UserSquare2 size={12} /> },
  ];

  const filteredTabs = tabs.filter(tab => !tab.showOnlyOwn || isOwnProfile);

  // Render placeholder helper
  const renderPlaceholder = (count: number) => Array.from({ length: count });

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <header className="profile-header">
          {/* Avatar */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              {profile?.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="profile-avatar" />
              ) : (
                <div className="profile-avatar profile-avatar--placeholder"></div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="profile-info">
            {/* Username Row */}
            <div className="profile-username-row">
              {profile ? (
                <h2 className="profile-username">{profile.username}</h2>
              ) : (
                <div className="profile-username-placeholder"></div>
              )}
              <div className="profile-actions">
                {isOwnProfile ? (
                  <>
                    <button className="profile-btn profile-btn--edit">Edit profile</button>
                    <button className="profile-btn profile-btn--archive">View archive</button>
                    <button className="profile-btn-icon">
                      <Settings size={24} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`profile-btn ${profile?.isFollowing ? 'profile-btn--edit' : 'profile-btn--follow'}`}
                      onClick={handleFollowToggle}
                    >
                      {profile?.isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button className="profile-btn profile-btn--edit">Message</button>
                  </>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-number">{profile?.postsCount ?? 0}</span> posts
              </div>
              <div className="profile-stat profile-stat--clickable">
                <span className="profile-stat-number">
                  {typeof profile?.followersCount === 'number'
                    ? profile.followersCount.toLocaleString()
                    : 0}
                </span>{' '}
                followers
              </div>
              <div className="profile-stat profile-stat--clickable">
                <span className="profile-stat-number">{profile?.followingCount ?? 0}</span> following
              </div>
            </div>

            {/* Bio Section */}
            <div className="profile-bio">
              {profile ? (
                <>
                  <span className="profile-name">{profile.fullName}</span>
                  {profile.bio && <span className="profile-bio-text">{profile.bio}</span>}
                  {profile.website && (
                    <a href={profile.website} className="profile-website" target="_blank" rel="noopener noreferrer">
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </>
              ) : (
                <div className="profile-bio-placeholder">
                  <div className="profile-bio-placeholder-line profile-bio-placeholder-line--short"></div>
                  <div className="profile-bio-placeholder-line"></div>
                  <div className="profile-bio-placeholder-line profile-bio-placeholder-line--medium"></div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Stats */}
        <div className="profile-stats-mobile">
          <div className="profile-stat-mobile">
            <span className="profile-stat-number">{profile?.postsCount ?? 0}</span>
            <span className="profile-stat-label">posts</span>
          </div>
          <div className="profile-stat-mobile">
            <span className="profile-stat-number">
              {typeof profile?.followersCount === 'number'
                ? profile.followersCount.toLocaleString()
                : 0}
            </span>
            <span className="profile-stat-label">followers</span>
          </div>
          <div className="profile-stat-mobile">
            <span className="profile-stat-number">{profile?.followingCount ?? 0}</span>
            <span className="profile-stat-label">following</span>
          </div>
        </div>

        {/* Highlights Section */}
        <div className="profile-highlights">
          {isOwnProfile && (
            <div className="profile-highlight profile-highlight--new">
              <div className="profile-highlight-circle profile-highlight-circle--new">
                <Plus size={24} />
              </div>
              <span className="profile-highlight-name">New</span>
            </div>
          )}
          {highlights.length > 0
            ? highlights.map(highlight => (
                <div 
                  key={highlight.id} 
                  className="profile-highlight"
                  onClick={() => handleHighlightClick(highlight)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="profile-highlight-circle">
                    {highlight.coverImage ? (
                      <img src={highlight.coverImage} alt={highlight.name} />
                    ) : (
                      <div className="profile-highlight-placeholder"></div>
                    )}
                  </div>
                  <span className="profile-highlight-name">{highlight.name}</span>
                </div>
              ))
            : renderPlaceholder(4).map((_, index) => (
                <div key={index} className="profile-highlight">
                  <div className="profile-highlight-circle">
                    <div className="profile-highlight-placeholder"></div>
                  </div>
                  <span className="profile-highlight-name">Highlight</span>
                </div>
              ))}
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {filteredTabs.map(tab => (
            <button
              key={tab.id}
              className={`profile-tab ${activeTab === tab.id ? 'profile-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        <div className="profile-grid">
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--ig-secondary-text)' }}>
              Loading...
            </div>
          ) : error ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--ig-error)' }}>
              {error}
            </div>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <div 
                key={post.id} 
                className="profile-post"
                onClick={async () => {
                  // Fetch full post data with user information
                  // Preserve the original commentsCount to match the displayed count
                  const originalCommentsCount = post.commentsCount;
                  
                  setLoadingPost(true);
                  try {
                    const postRes = await postService.getPost(post.id);
                    if (postRes.success && postRes.data) {
                      // Preserve original commentsCount to match the displayed count
                      setSelectedPost({
                        ...postRes.data,
                        commentsCount: originalCommentsCount,
                      });
                    } else {
                      // Fallback: use profile data to construct post with user info
                      if (profile) {
                        setSelectedPost({
                          ...post,
                          user: {
                            id: profile.id,
                            username: profile.username,
                            fullName: profile.fullName,
                            avatar: profile.avatar,
                          },
                        });
                      }
                    }
                  } catch (err) {
                    console.error('Error loading post:', err);
                    // Fallback: use profile data
                    if (profile) {
                      setSelectedPost({
                        ...post,
                        user: {
                          id: profile.id,
                          username: profile.username,
                          fullName: profile.fullName,
                          avatar: profile.avatar,
                        },
                      });
                    }
                  } finally {
                    setLoadingPost(false);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt={`Post ${post.id}`} />
                ) : (
                  <div className="profile-post-placeholder"></div>
                )}
                <div className="profile-post-overlay">
                  <div className="profile-post-stats">
                    <span className="profile-post-stat">
                      <Heart size={19} fill="white" />
                      {post.likes.toLocaleString()}
                    </span>
                    <span className="profile-post-stat">
                      <MessageCircle size={19} fill="white" />
                      {post.commentsCount}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Empty state - show placeholders
            renderPlaceholder(9).map((_, index) => (
              <div key={index} className="profile-post">
                <div className="profile-post-placeholder"></div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Story Modal */}
      {selectedStory && (
        <div 
          className="story-modal-overlay"
          onClick={() => {
            setSelectedStory(null);
            setHighlightStories([]);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div 
            className="story-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '420px',
              width: '100%',
              maxHeight: '90vh',
              backgroundColor: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {/* Progress bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              zIndex: 10,
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#fff',
                width: `${((storyIndex + 1) / highlightStories.length) * 100}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>

            {/* Header */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={selectedStory.user.avatar || 'https://via.placeholder.com/40'}
                  alt={selectedStory.user.username}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                  {selectedStory.user.username}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                  {new Date(selectedStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedStory(null);
                  setHighlightStories([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '8px',
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Story Image */}
            <img
              src={selectedStory.imageUrl || 'https://via.placeholder.com/420x700'}
              alt="Story"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '90vh',
                objectFit: 'contain',
              }}
            />

            {/* Left navigation area (prev) */}
            <div
              onClick={handlePrevStory}
              style={{
                position: 'absolute',
                top: '60px',
                left: 0,
                bottom: 0,
                width: '30%',
                cursor: storyIndex > 0 ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingLeft: '8px',
              }}
            >
              {storyIndex > 0 && (
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ChevronLeft size={20} color="#000" />
                </div>
              )}
            </div>

            {/* Right navigation area (next) */}
            <div
              onClick={handleNextStory}
              style={{
                position: 'absolute',
                top: '60px',
                right: 0,
                bottom: 0,
                width: '30%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '8px',
              }}
            >
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ChevronRight size={20} color="#000" />
              </div>
            </div>

            {/* Story counter */}
            {highlightStories.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '12px',
              }}>
                {storyIndex + 1} / {highlightStories.length}
              </div>
            )}

            {/* Loading overlay */}
            {loadingStories && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
              }}>
                <span style={{ color: '#fff' }}>Loading stories...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {selectedPost && (
        <CommentModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
};

export default ProfileView;
