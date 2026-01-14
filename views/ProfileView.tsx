'use client';

import React, { useEffect, useState } from 'react';
import { Grid, Film, Bookmark, UserSquare2, Settings, Plus, Heart, MessageCircle } from 'lucide-react';
import { UserProfile, Post, Highlight } from '../types';
import { userService, postService, highlightService } from '../services/dataService';

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
          setPosts(postsRes.data.items);
        }
        if (highlightsRes.success && highlightsRes.data) {
          setHighlights(highlightsRes.data);
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
    if (!profile) return;

    try {
      if (profile.isFollowing) {
        await userService.unfollowUser(profile.id);
        setProfile(prev =>
          prev
            ? { ...prev, isFollowing: false, followersCount: prev.followersCount - 1 }
            : null
        );
      } else {
        await userService.followUser(profile.id);
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
                <div key={highlight.id} className="profile-highlight">
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
              <div key={post.id} className="profile-post">
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
    </div>
  );
};

export default ProfileView;
