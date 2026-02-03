'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Grid, Film, Bookmark, UserSquare2, Settings, Plus, Heart, MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserProfile, Post, Highlight, Story, AuthUser } from '../types';
import { userService, postService, highlightService, storyService } from '../services/dataService';
import CommentModal from '../components/CommentModal';
import FollowListModal from '../components/FollowListModal';

// =============================================================================
// Types
// =============================================================================

interface ProfileViewProps {
  userId?: string;
  isOwnProfile?: boolean;
  currentUser?: AuthUser | null;
  onProfileUpdated?: (user: { id: string; username: string; fullName: string; avatar: string | null; bio?: string | null; website?: string | null }) => void;
}

const VALID_TAB_IDS = ['posts', 'reels', 'saved', 'tagged'] as const;

const ProfileView: React.FC<ProfileViewProps> = ({ userId, isOwnProfile = true, currentUser, onProfileUpdated }) => {
  const searchParams = useSearchParams();
  // =============================================================================
  // State: profile data (profile, posts, saved posts, highlights, tab, loading/error)
  // =============================================================================
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State: story modal (selected story, index, highlight stories list)
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [highlightStories, setHighlightStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);

  // State: post modal (selected post, detail loading)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  // State: create highlight modal (name, selected story ids, my stories list)
  const [showCreateHighlightModal, setShowCreateHighlightModal] = useState(false);
  const [createHighlightName, setCreateHighlightName] = useState('');
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loadingMyStories, setLoadingMyStories] = useState(false);
  const [creatingHighlight, setCreatingHighlight] = useState(false);
  const [createHighlightError, setCreateHighlightError] = useState<string | null>(null);

  // State: unfollow confirmation modal
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);

  // State: edit profile modal
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const editAvatarFileInputRef = useRef<HTMLInputElement>(null);

  // State: followers / following list modal
  const [followListModalType, setFollowListModalType] = useState<'followers' | 'following' | null>(null);

  // Sync activeTab with URL ?tab= (e.g. /profile?tab=saved from sidebar Saved)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && VALID_TAB_IDS.includes(tab as typeof VALID_TAB_IDS[number])) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // =============================================================================
  // Profile data load (profile, posts, highlights)
  // =============================================================================
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
          userService.getProfile(userId, currentUser?.id),
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
  }, [userId, currentUser?.id]);

  // Load saved posts when saved tab is active
  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (activeTab !== 'saved' || !userId || !isOwnProfile) {
        return;
      }

      setLoadingSaved(true);
      try {
        const savedRes = await postService.getSavedPosts(userId, 1);
        if (savedRes.success && savedRes.data) {
          const items = Array.isArray(savedRes.data)
            ? savedRes.data
            : (savedRes.data as { items?: Post[] })?.items ?? [];
          setSavedPosts(items);
        }
      } catch (err) {
        console.error('Error loading saved posts:', err);
        setSavedPosts([]);
      } finally {
        setLoadingSaved(false);
      }
    };

    fetchSavedPosts();
  }, [activeTab, userId, isOwnProfile]);

  // =============================================================================
  // Follow: follow / unfollow (unfollow 시 확인 모달)
  // =============================================================================
  const handleFollowToggle = async () => {
    if (!profile || !currentUser?.id) return;
    if (profile.isFollowing) {
      setShowUnfollowConfirm(true);
      return;
    }
    try {
      await userService.followUser(profile.id, currentUser.id);
      setProfile(prev =>
        prev
          ? { ...prev, isFollowing: true, followersCount: prev.followersCount + 1 }
          : null
      );
    } catch (err) {
      console.error('Error following:', err);
    }
  };

  const handleUnfollowConfirm = async () => {
    if (!profile || !currentUser?.id) return;
    try {
      await userService.unfollowUser(profile.id, currentUser.id);
      setProfile(prev =>
        prev
          ? { ...prev, isFollowing: false, followersCount: prev.followersCount - 1 }
          : null
      );
      setShowUnfollowConfirm(false);
    } catch (err) {
      console.error('Error unfollowing:', err);
    }
  };

  // =============================================================================
  // Highlight: open create modal / story selection toggle / create highlight
  // =============================================================================
  const handleOpenCreateHighlight = useCallback(async () => {
    if (!userId) return;
    setShowCreateHighlightModal(true);
    setCreateHighlightName('');
    setSelectedStoryIds([]);
    setCreateHighlightError(null);
    setLoadingMyStories(true);
    try {
      const res = await storyService.getStories(userId);
      if (res.success && res.data) {
        const mine = res.data.filter(s => s.userId === userId);
        setMyStories(mine);
      } else {
        setMyStories([]);
      }
    } catch (err) {
      console.error('Error loading stories:', err);
      setMyStories([]);
    } finally {
      setLoadingMyStories(false);
    }
  }, [userId]);

  const handleOpenEditProfile = useCallback(() => {
    if (!profile) return;
    setEditFullName(profile.fullName ?? '');
    setEditUsername(profile.username ?? '');
    setEditBio(profile.bio ?? '');
    setEditWebsite(profile.website ?? '');
    setEditAvatar(profile.avatar ?? '');
    setEditError(null);
    setShowEditProfileModal(true);
  }, [profile]);

  const handleEditAvatarFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') setEditAvatar(result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const handleSubmitEditProfile = useCallback(async () => {
    if (!userId || !editUsername.trim()) {
      setEditError('사용자 이름을 입력해 주세요.');
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      const res = await userService.updateProfile(userId, {
        fullName: editFullName.trim(),
        username: editUsername.trim(),
        bio: editBio.trim() || undefined,
        website: editWebsite.trim() || undefined,
        avatar: editAvatar.trim() || undefined,
      });
      if (res.success && res.data) {
        setProfile(prev => prev ? { ...prev, ...res.data } : null);
        onProfileUpdated?.(res.data);
        setShowEditProfileModal(false);
      } else {
        setEditError(res.error ?? '프로필 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setEditError('프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setEditSubmitting(false);
    }
  }, [userId, editFullName, editUsername, editBio, editWebsite, editAvatar, onProfileUpdated]);

  const toggleStoryForHighlight = (storyId: string) => {
    setSelectedStoryIds(prev =>
      prev.includes(storyId) ? prev.filter(id => id !== storyId) : [...prev, storyId]
    );
  };

  const handleCreateHighlight = useCallback(async () => {
    if (!userId || !createHighlightName.trim()) {
      setCreateHighlightError('하이라이트 이름을 입력해 주세요.');
      return;
    }
    if (selectedStoryIds.length === 0) {
      setCreateHighlightError('스토리를 하나 이상 선택해 주세요.');
      return;
    }
    setCreatingHighlight(true);
    setCreateHighlightError(null);
    try {
      const res = await highlightService.createHighlight(userId, {
        name: createHighlightName.trim(),
        storyIds: selectedStoryIds,
      });
      if (res.success && res.data) {
        const created = res.data as Highlight & { stories?: { story?: { imageUrl?: string } }[] };
        setHighlights(prev => [{
          id: created.id,
          userId: created.userId,
          name: created.name,
          coverImage: created.coverImage ?? created.stories?.[0]?.story?.imageUrl ?? null,
          storiesCount: Array.isArray(created.stories) ? created.stories.length : 0,
          createdAt: created.createdAt ?? new Date().toISOString(),
        }, ...prev]);
        setShowCreateHighlightModal(false);
        setCreateHighlightName('');
        setSelectedStoryIds([]);
      } else {
        setCreateHighlightError(res.error || '하이라이트를 만들 수 없습니다.');
      }
    } catch (err) {
      console.error('Error creating highlight:', err);
      setCreateHighlightError('하이라이트를 만들 수 없습니다.');
    } finally {
      setCreatingHighlight(false);
    }
  }, [userId, createHighlightName, selectedStoryIds]);

  // Highlight click: load stories then show modal
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

  // =============================================================================
  // Story modal: prev/next navigation, keyboard (arrows, ESC)
  // =============================================================================
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

  // Tab definitions (POSTS, REELS, SAVED, TAGGED) — SAVED only for own profile
  const tabs = [
    { id: 'posts', label: 'POSTS', icon: <Grid size={12} /> },
    { id: 'reels', label: 'REELS', icon: <Film size={12} /> },
    { id: 'saved', label: 'SAVED', icon: <Bookmark size={12} />, showOnlyOwn: true },
    { id: 'tagged', label: 'TAGGED', icon: <UserSquare2 size={12} /> },
  ];

  const filteredTabs = tabs.filter(tab => !tab.showOnlyOwn || isOwnProfile);

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* ---------- Section: profile header (avatar, username, actions, stats, bio) ---------- */}
        <header className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              {profile?.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="profile-avatar" />
              ) : (
                <div className="profile-avatar profile-avatar--placeholder"></div>
              )}
            </div>
          </div>

          <div className="profile-info">
            {/* Username row + buttons (Edit/Follow, Message, Settings) */}
            <div className="profile-username-row">
              {profile ? (
                <h2 className="profile-username">{profile.username}</h2>
              ) : (
                <div className="profile-username-placeholder"></div>
              )}
              <div className="profile-actions">
                {isOwnProfile ? (
                  <>
                    <button type="button" className="profile-btn profile-btn--edit" onClick={handleOpenEditProfile}>
                      Edit profile
                    </button>
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
                      {profile?.isFollowing ? '팔로우 취소' : 'Follow'}
                    </button>
                    <button className="profile-btn profile-btn--edit">Message</button>
                  </>
                )}
              </div>
            </div>

            {/* Stats row: posts / followers / following */}
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-number">{profile?.postsCount ?? 0}</span> posts
              </div>
              <button
                type="button"
                className="profile-stat profile-stat--clickable"
                onClick={() => profile?.id && setFollowListModalType('followers')}
              >
                <span className="profile-stat-number">
                  {typeof profile?.followersCount === 'number'
                    ? profile.followersCount.toLocaleString()
                    : 0}
                </span>{' '}
                followers
              </button>
              <button
                type="button"
                className="profile-stat profile-stat--clickable"
                onClick={() => profile?.id && setFollowListModalType('following')}
              >
                <span className="profile-stat-number">{profile?.followingCount ?? 0}</span> following
              </button>
            </div>

            {/* Bio: name, description, website */}
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

        {/* Mobile stats (posts / followers / following) */}
        <div className="profile-stats-mobile">
          <div className="profile-stat-mobile">
            <span className="profile-stat-number">{profile?.postsCount ?? 0}</span>
            <span className="profile-stat-label">posts</span>
          </div>
          <button
            type="button"
            className="profile-stat-mobile"
            onClick={() => profile?.id && setFollowListModalType('followers')}
          >
            <span className="profile-stat-number">
              {typeof profile?.followersCount === 'number'
                ? profile.followersCount.toLocaleString()
                : 0}
            </span>
            <span className="profile-stat-label">followers</span>
          </button>
          <button
            type="button"
            className="profile-stat-mobile"
            onClick={() => profile?.id && setFollowListModalType('following')}
          >
            <span className="profile-stat-number">{profile?.followingCount ?? 0}</span>
            <span className="profile-stat-label">following</span>
          </button>
        </div>

        {/* ---------- Section: highlights (new + list, click opens story modal) — 숨김: 본인도 하이라이트 없고, 타인은 하이라이트 없을 때 ---------- */}
        {(isOwnProfile || highlights.length > 0) && (
          <div className="profile-highlights">
            {isOwnProfile && (
              <button
                type="button"
                className="profile-highlight profile-highlight--new"
                onClick={handleOpenCreateHighlight}
                aria-label="새 하이라이트 만들기"
              >
                <div className="profile-highlight-circle profile-highlight-circle--new">
                  <Plus size={24} />
                </div>
                <span className="profile-highlight-name">New</span>
              </button>
            )}
            {highlights.length > 0 && highlights.map(highlight => (
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
            ))}
          </div>
        )}

        {/* ---------- Section: tabs (POSTS / REELS / SAVED / TAGGED) ---------- */}
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

        {/* ---------- Section: post grid (saved tab | posts tab, click opens post modal) ---------- */}
        <div className="profile-grid">
          {activeTab === 'saved' ? (
            /* Saved posts view */
            loadingSaved ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--ig-secondary-text)' }}>
                Loading...
              </div>
            ) : savedPosts.length > 0 ? (
              savedPosts.map(post => (
                <div 
                  key={post.id} 
                  className="profile-post"
                  onClick={async () => {
                    const originalCommentsCount = post.commentsCount;
                    setLoadingPost(true);
                    try {
                      const postRes = await postService.getPost(post.id);
                      if (postRes.success && postRes.data) {
                        setSelectedPost({
                          ...postRes.data,
                          commentsCount: originalCommentsCount,
                        });
                      } else {
                        if (profile) {
                          setSelectedPost({
                            ...post,
                            user: post.user || {
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
                      if (profile) {
                        setSelectedPost({
                          ...post,
                          user: post.user || {
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
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--ig-secondary-text)' }}>
                저장된 게시물이 없습니다
              </div>
            )
          ) : activeTab === 'reels' || activeTab === 'tagged' ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--ig-secondary-text)' }}>
              저장된 게시물이 없습니다
            </div>
          ) : loading ? (
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
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--ig-secondary-text)' }}>
              저장된 게시물이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* ========== Modal: 팔로우 취소 확인 ========== */}
      {showUnfollowConfirm && (
        <div
          className="story-modal-overlay"
          onClick={() => setShowUnfollowConfirm(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--ig-primary-background)',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              padding: '24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}
          >
            <p style={{ fontSize: '16px', textAlign: 'center', marginBottom: '20px', color: 'var(--ig-primary-text)' }}>
              팔로우를 취소하시겠습니까?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowUnfollowConfirm(false)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--ig-primary-text)',
                  backgroundColor: 'var(--ig-secondary-background)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleUnfollowConfirm}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: '#ed4956',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Modal: edit profile (name, username, bio, website, avatar) ========== */}
      {showEditProfileModal && (
        <div
          className="story-modal-overlay"
          onClick={() => !editSubmitting && setShowEditProfileModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--ig-primary-background)',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{
              padding: '16px 16px 12px',
              borderBottom: '1px solid var(--ig-separator)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <button
                type="button"
                onClick={() => !editSubmitting && setShowEditProfileModal(false)}
                style={{ padding: '4px', color: 'var(--ig-primary-text)' }}
                aria-label="닫기"
              >
                <X size={24} />
              </button>
              <span style={{ fontWeight: 600, fontSize: '16px' }}>프로필 수정</span>
              <button
                type="button"
                disabled={editSubmitting}
                onClick={handleSubmitEditProfile}
                style={{
                  padding: '4px 8px',
                  color: editSubmitting ? 'var(--ig-secondary-text)' : 'var(--ig-link)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: editSubmitting ? 'wait' : 'pointer',
                }}
              >
                {editSubmitting ? '저장 중…' : '저장'}
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {editError && (
                <div style={{ color: 'var(--ig-error)', fontSize: '14px' }}>{editError}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    backgroundColor: 'var(--ig-secondary-bg)',
                    flexShrink: 0,
                  }}
                >
                  {editAvatar ? (
                    <img
                      src={editAvatar}
                      alt="프로필 미리보기"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ig-secondary-text)' }}>
                      <UserSquare2 size={40} />
                    </div>
                  )}
                </div>
                <input
                  ref={editAvatarFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditAvatarFileChange}
                  style={{ display: 'none' }}
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => editAvatarFileInputRef.current?.click()}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--ig-link)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  사진 올리기
                </button>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--ig-primary-text)' }}>
                  이름
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="이름"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--ig-separator)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--ig-primary-text)',
                    backgroundColor: 'var(--ig-secondary-background)',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--ig-primary-text)' }}>
                  사용자 이름
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="username"
                  autoComplete="username"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--ig-separator)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--ig-primary-text)',
                    backgroundColor: 'var(--ig-secondary-background)',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--ig-primary-text)' }}>
                  웹사이트
                </label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--ig-separator)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--ig-primary-text)',
                    backgroundColor: 'var(--ig-secondary-background)',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--ig-primary-text)' }}>
                  소개
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="소개"
                  rows={3}
                  maxLength={150}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--ig-separator)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--ig-primary-text)',
                    backgroundColor: 'var(--ig-secondary-background)',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== Modal: create highlight (name input, story selection, create) ========== */}
      {showCreateHighlightModal && (
        <div
          className="story-modal-overlay"
          onClick={() => !creatingHighlight && setShowCreateHighlightModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="create-highlight-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--ig-primary-background)',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{
              padding: '16px 16px 12px',
              borderBottom: '1px solid var(--ig-separator)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <button
                type="button"
                onClick={() => !creatingHighlight && setShowCreateHighlightModal(false)}
                style={{ padding: '4px', color: 'var(--ig-primary-text)' }}
                aria-label="닫기"
              >
                <X size={24} />
              </button>
              <span style={{ fontWeight: 600, fontSize: '16px' }}>새 하이라이트</span>
              <button
                type="button"
                disabled={creatingHighlight || !createHighlightName.trim() || selectedStoryIds.length === 0}
                onClick={handleCreateHighlight}
                style={{
                  padding: '4px 8px',
                  color: creatingHighlight || !createHighlightName.trim() || selectedStoryIds.length === 0
                    ? 'var(--ig-secondary-text)'
                    : 'var(--ig-link)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: creatingHighlight ? 'wait' : 'pointer',
                }}
              >
                {creatingHighlight ? '만드는 중…' : '만들기'}
              </button>
            </div>
            <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--ig-secondary-text)' }}>
                이름
              </label>
              <input
                type="text"
                value={createHighlightName}
                onChange={(e) => setCreateHighlightName(e.target.value)}
                placeholder="하이라이트 이름"
                maxLength={50}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--ig-separator)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                }}
              />
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--ig-secondary-text)' }}>
                스토리 선택
              </label>
              {loadingMyStories ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--ig-secondary-text)' }}>
                  스토리 불러오는 중…
                </div>
              ) : myStories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--ig-secondary-text)', fontSize: '14px' }}>
                  올린 스토리가 없습니다. 스토리를 먼저 올린 뒤 하이라이트에 추가할 수 있습니다.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                }}>
                  {myStories.map((story) => (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => toggleStoryForHighlight(story.id)}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        padding: 0,
                        border: selectedStoryIds.includes(story.id) ? '3px solid var(--ig-link)' : '2px solid var(--ig-separator)',
                        cursor: 'pointer',
                        background: '#000',
                      }}
                    >
                      {story.imageUrl ? (
                        <img
                          src={story.imageUrl}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--ig-secondary-background)' }} />
                      )}
                      {selectedStoryIds.includes(story.id) && (
                        <span style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'var(--ig-link)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {createHighlightError && (
                <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--ig-error)' }}>
                  {createHighlightError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== Modal: story (progress bar, header, image, prev/next nav) ========== */}
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
            {/* Story progress bar */}
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

            {/* Story header (avatar, username, time, close) */}
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

            {/* Story image */}
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

            {/* Story prev (left) area */}
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

            {/* Story next (right) area */}
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

            {/* Story counter (n / total) */}
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

            {/* Story loading overlay */}
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

      {/* ========== Modal: followers / following list ========== */}
      {followListModalType && profile?.id && (
        <FollowListModal
          title={followListModalType === 'followers' ? 'Followers' : 'Following'}
          listType={followListModalType}
          userId={profile.id}
          currentUser={currentUser}
          onClose={() => setFollowListModalType(null)}
          onCountChange={(type, delta) => {
            if (!profile) return;
            if (type === 'followers') {
              setProfile((prev) =>
                prev ? { ...prev, followersCount: Math.max(0, prev.followersCount + delta) } : null
              );
            } else {
              setProfile((prev) =>
                prev ? { ...prev, followingCount: Math.max(0, prev.followingCount + delta) } : null
              );
            }
          }}
        />
      )}

      {/* ========== Modal: comments (CommentModal, update post count on new comment) ========== */}
      {selectedPost && (
        <CommentModal 
          post={selectedPost} 
          currentUser={currentUser}
          onClose={() => setSelectedPost(null)}
          onCommentAdded={(postId, newCommentsCount) => {
            setPosts(prev => prev.map(p => 
              p.id === postId 
                ? { ...p, commentsCount: newCommentsCount }
                : p
            ));
            setSelectedPost(prev => prev && prev.id === postId
              ? { ...prev, commentsCount: newCommentsCount }
              : prev
            );
          }}
          onPostDeleted={(postId) => {
            setSelectedPost(null);
            setPosts(prev => prev.filter(p => p.id !== postId));
          }}
          onPostEdit={(updatedPost) => {
            setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
            setSelectedPost(prev => prev && prev.id === updatedPost.id ? { ...prev, ...updatedPost } : prev);
          }}
        />
      )}
    </div>
  );
};

export default ProfileView;
