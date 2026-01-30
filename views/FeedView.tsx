'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Post, Story, Suggestion, AuthUser, User } from '../types';
import { postService, storyService, userService, messageService } from '../services/dataService';

// =============================================================================
// 타입 정의
// =============================================================================

interface FeedViewProps {
  currentUser?: AuthUser | null;
  onOpenComments: (post: Post) => void;
  refreshKey?: number;
}

const FeedView: React.FC<FeedViewProps> = ({ currentUser, onOpenComments, refreshKey }) => {
  // =============================================================================
  // 상태: 피드 데이터 (포스트, 스토리, 추천, 로딩/에러)
  // =============================================================================
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =============================================================================
  // 상태: 공유 모달
  // =============================================================================
  const [shareModalPost, setShareModalPost] = useState<Post | null>(null);
  const [shareSearch, setShareSearch] = useState('');
  const [shareUsers, setShareUsers] = useState<User[]>([]);
  const [selectedShareUsers, setSelectedShareUsers] = useState<string[]>([]);
  const [shareSending, setShareSending] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // =============================================================================
  // 상태: 애니메이션 (좋아요 하트, 저장 북마크)
  // =============================================================================
  const [likeAnimations, setLikeAnimations] = useState<Record<string, boolean>>({});
  const [saveAnimations, setSaveAnimations] = useState<Record<string, boolean>>({});

  // =============================================================================
  // 상태: 스토리 모달 (선택된 스토리, 인덱스, 진행률)
  // =============================================================================
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);

  // =============================================================================
  // 상태: 스토리 생성 (업로드 중, 파일 input ref)
  // =============================================================================
  const [creatingStory, setCreatingStory] = useState(false);
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  // =============================================================================
  // 스토리: 추가 클릭 / 파일 선택 후 업로드
  // =============================================================================
  const handleAddStoryClick = useCallback(() => {
    if (!currentUser?.id || creatingStory) return;
    storyFileInputRef.current?.click();
  }, [currentUser?.id, creatingStory]);

  const handleStoryFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !currentUser?.id) return;
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일을 선택해 주세요.');
        e.target.value = '';
        return;
      }
      setCreatingStory(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageUrl = event.target?.result as string;
        if (!imageUrl) {
          setCreatingStory(false);
          e.target.value = '';
          return;
        }
        try {
          const res = await storyService.createStory(currentUser.id, imageUrl);
          if (res.success && res.data) {
            const d = res.data as { id: string; userId: string; user?: { id: string; username: string; fullName?: string; avatar?: string | null }; imageUrl: string | null; createdAt: string; expiresAt: string };
            const u = d.user ?? { id: currentUser.id, username: currentUser.username, fullName: currentUser.fullName ?? currentUser.username, avatar: currentUser.avatar };
            const newStory: Story = {
              id: d.id,
              userId: d.userId,
              user: { id: u.id, username: u.username, fullName: u.fullName ?? u.username, avatar: u.avatar ?? null },
              imageUrl: d.imageUrl,
              hasUnseenContent: true,
              createdAt: d.createdAt,
              expiresAt: d.expiresAt,
            };
            setStories(prev => [newStory, ...prev]);
          } else {
            alert(res.error || '스토리를 올릴 수 없습니다.');
          }
        } catch (err) {
          console.error('Error creating story:', err);
          alert('스토리를 올릴 수 없습니다.');
        } finally {
          setCreatingStory(false);
          e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    },
    [currentUser]
  );

  // =============================================================================
  // 스토리: 클릭 / 이전·다음 이동 / 키보드(좌우, ESC)
  // =============================================================================
  const handleStoryClick = useCallback((story: Story, index: number) => {
    setSelectedStory(story);
    setStoryIndex(index);
  }, []);

  const handlePrevStory = useCallback(() => {
    if (storyIndex > 0) {
      const prevIndex = storyIndex - 1;
      setStoryIndex(prevIndex);
      setSelectedStory(stories[prevIndex]);
    }
  }, [storyIndex, stories]);

  const handleNextStory = useCallback(() => {
    if (storyIndex < stories.length - 1) {
      const nextIndex = storyIndex + 1;
      setStoryIndex(nextIndex);
      setSelectedStory(stories[nextIndex]);
    } else {
      // Close modal if no more stories
      setSelectedStory(null);
    }
  }, [storyIndex, stories]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedStory) return;
      
      if (e.key === 'ArrowLeft') {
        handlePrevStory();
      } else if (e.key === 'ArrowRight') {
        handleNextStory();
      } else if (e.key === 'Escape') {
        setSelectedStory(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStory, handlePrevStory, handleNextStory]);

  // =============================================================================
  // 피드 데이터 로드 (포스트, 스토리, 추천 — 팔로우+본인만)
  // =============================================================================
  useEffect(() => {
    const fetchFeedData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch posts, stories, and suggestions in parallel
        // userId 전달 시 팔로우한 사람 + 본인 포스트만 조회
        const [postsRes, storiesRes, suggestionsRes] = await Promise.all([
          postService.getFeed(1, currentUser?.id),
          storyService.getStories(currentUser?.id),
          userService.getSuggestions(currentUser?.id),
        ]);

        if (postsRes.success && postsRes.data) {
          setPosts(postsRes.data.items);
        }
        
        // Always set stories, even if empty or failed
        if (storiesRes.success && storiesRes.data) {
          console.log('[FeedView] Stories loaded:', storiesRes.data.length);
          setStories(storiesRes.data);
        } else {
          // If API fails, log error and set empty array to show placeholders
          console.error('[FeedView] Failed to load stories:', storiesRes.error);
          setStories([]);
        }
        
        if (suggestionsRes.success && suggestionsRes.data) {
          setSuggestions(suggestionsRes.data);
        } else {
          // If API fails, log error but don't set empty array
          console.error('Failed to load suggestions:', suggestionsRes.error);
          // API should return dummy data if no users found, so this shouldn't happen
          // But if it does, set empty array to show placeholders
          setSuggestions([]);
        }
      } catch (err) {
        setError('Failed to load feed');
        console.error('Error loading feed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedData();
  }, [currentUser?.id, refreshKey]);

  // =============================================================================
  // 좋아요: 토글 + 애니메이션 + 낙관적 업데이트
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

  // 좋아요: 더블클릭으로 좋아요
  const handleDoubleClickLike = useCallback(async (post: Post) => {
    if (!post.isLiked) {
      await handleLike(post.id, false);
    } else {
      // Show animation even if already liked
      setLikeAnimations(prev => ({ ...prev, [post.id]: true }));
      setTimeout(() => {
        setLikeAnimations(prev => ({ ...prev, [post.id]: false }));
      }, 1000);
    }
  }, [handleLike]);

  // =============================================================================
  // 저장: 토글 + 애니메이션 + 낙관적 업데이트
  // =============================================================================
  const handleSave = useCallback(async (postId: string, isSaved: boolean) => {
    if (!currentUser?.id) return;

    // Trigger animation
    if (!isSaved) {
      setSaveAnimations(prev => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setSaveAnimations(prev => ({ ...prev, [postId]: false }));
      }, 300);
    }
    
    // Optimistic update
    setPosts(prev =>
      prev.map(post =>
        post.id === postId ? { ...post, isSaved: !isSaved } : post
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
          post.id === postId ? { ...post, isSaved: isSaved } : post
        )
      );
    }
  }, [currentUser?.id]);

  // =============================================================================
  // 공유: 모달 열기 / 유저 검색 / 선택 토글 / 전송
  // =============================================================================
  const handleShareClick = useCallback((post: Post) => {
    setShareModalPost(post);
    setShareSearch('');
    setSelectedShareUsers([]);
    setShareSuccess(false);
  }, []);

  // Search users for sharing
  const handleShareSearch = useCallback(async (query: string) => {
    setShareSearch(query);
    if (query.length >= 1) {
      try {
        const res = await userService.searchUsers(query);
        if (res.success && res.data) {
          setShareUsers(res.data);
        }
      } catch (err) {
        console.error('Error searching users:', err);
      }
    } else {
      setShareUsers([]);
    }
  }, []);

  // Toggle user selection for sharing
  const toggleShareUser = useCallback((userId: string) => {
    setSelectedShareUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);

  // Send shared post
  const handleSendShare = useCallback(async () => {
    if (!shareModalPost || selectedShareUsers.length === 0) return;
    
    setShareSending(true);
    try {
      // Create conversation and send message for each selected user
      for (const userId of selectedShareUsers) {
        const convRes = await messageService.createConversation([userId]);
        if (convRes.success && convRes.data) {
          await messageService.sendMessage(
            convRes.data.id,
            `Check out this post: ${shareModalPost.caption || 'Shared post'}\n[Post ID: ${shareModalPost.id}]`
          );
        }
      }
      setShareSuccess(true);
      setTimeout(() => {
        setShareModalPost(null);
        setShareSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Error sending share:', err);
    } finally {
      setShareSending(false);
    }
  }, [shareModalPost, selectedShareUsers]);

  // =============================================================================
  // 추천: 팔로우 버튼 (팔로우 후 추천 목록에서 제거)
  // =============================================================================
  const handleFollow = useCallback(async (userId: string) => {
    if (!currentUser?.id) return;
    
    try {
      await userService.followUser(userId, currentUser.id);
      // Remove from suggestions after following
      setSuggestions(prev => prev.filter(s => s.user.id !== userId));
    } catch (err) {
      console.error('Error following user:', err);
    }
  }, [currentUser?.id]);

  // =============================================================================
  // UI 헬퍼: 데이터 없을 때 스켈레톤 개수
  // =============================================================================
  const renderPlaceholder = (count: number) =>
    Array.from({ length: count });

  return (
    <div className="feed-container">
      {/* ========== 레이아웃: 왼쪽 컬럼 (피드 본문) ========== */}
      <div className="feed-main">
        {/* ---------- 구역: 스토리 트레이 (추가 버튼 + 스토리 목록) ---------- */}
        <div className="story-tray">
          <input
            ref={storyFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleStoryFileChange}
            style={{ display: 'none' }}
            aria-hidden
          />
          {currentUser && (
            <button
              type="button"
              className="story-item story-item--add"
              onClick={handleAddStoryClick}
              disabled={creatingStory}
              aria-label="스토리 추가"
            >
              <div className="story-item__ring story-item__ring--add">
                <div className="story-item__inner">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt=""
                      className="story-item__img"
                    />
                  ) : (
                    <div className="story-item__placeholder"></div>
                  )}
                  <span className="story-item__add-icon">
                    <Plus size={20} strokeWidth={2.5} />
                  </span>
                </div>
              </div>
              <span className="story-item__username">
                {creatingStory ? '올리는 중…' : '스토리'}
              </span>
            </button>
          )}
          {stories.map((story, index) => (
            <div
              key={story.id}
              className="story-item"
              onClick={() => handleStoryClick(story, index)}
              style={{ cursor: 'pointer' }}
            >
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
          ))}
        </div>

        {/* ---------- 구역: 포스트 목록 (로딩/에러/목록/빈 상태) ---------- */}
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
                {/* 포스트 헤더: 아바타, 사용자명, 위치, 더보기 */}
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

                {/* 포스트 미디어: 이미지 + 더블클릭 좋아요 + 좋아요 애니메이션 */}
                <div 
                  className="post__media"
                  onDoubleClick={() => handleDoubleClickLike(post)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt="Post" className="post__img" />
                  ) : (
                    <div className="post__image-placeholder"></div>
                  )}
                  {/* Like animation overlay */}
                  {likeAnimations[post.id] && (
                    <div className="post__like-animation">
                      <Heart size={80} fill="#fff" color="#fff" />
                    </div>
                  )}
                </div>

                {/* 포스트 액션: 좋아요 | 댓글 | 공유 | 저장 */}
                <div className="post__actions">
                  <div className="post__actions-left">
                    {/* 좋아요 버튼 */}
                    <button
                      className={`post__action-btn ${post.isLiked ? 'post__action-btn--liked' : ''}`}
                      onClick={() => handleLike(post.id, post.isLiked || false)}
                      aria-label={post.isLiked ? 'Unlike' : 'Like'}
                    >
                      <Heart 
                        size={24} 
                        fill={post.isLiked ? '#ed4956' : 'none'} 
                        color={post.isLiked ? '#ed4956' : 'currentColor'}
                        className={post.isLiked ? 'heart-liked' : ''}
                      />
                    </button>
                    {/* 댓글 버튼 */}
                    <button
                      className="post__action-btn"
                      onClick={() => onOpenComments(post)}
                      aria-label="Comment"
                    >
                      <MessageCircle size={24} />
                    </button>
                    {/* 공유 버튼 */}
                    <button
                      className="post__action-btn"
                      onClick={() => handleShareClick(post)}
                      aria-label="Share"
                    >
                      <Send size={24} />
                    </button>
                  </div>
                  {/* 저장 버튼 */}
                  <button
                    className={`post__action-btn ${saveAnimations[post.id] ? 'post__action-btn--saving' : ''}`}
                    onClick={() => handleSave(post.id, post.isSaved || false)}
                    aria-label={post.isSaved ? 'Unsave' : 'Save'}
                  >
                    <Bookmark 
                      size={24} 
                      fill={post.isSaved ? 'currentColor' : 'none'}
                      className={post.isSaved ? 'bookmark-saved' : ''}
                    />
                  </button>
                </div>

                {/* 포스트 본문: 좋아요 수, 캡션, 댓글 개수(클릭 시 댓글 열기) */}
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
            /* 빈 상태: 스켈레톤 포스트 3개 */
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

      {/* ========== 레이아웃: 오른쪽 사이드바 (추천 등) ========== */}
      <aside className="feed-sidebar">
        <div className="h-sidebar">
          {/* 현재 로그인 사용자 요약 */}
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

          {/* 추천 헤더 */}
          <div className="h-sidebar__suggestions-header">
            <span className="h-sidebar__label">Suggested for you</span>
            <button className="h-sidebar__btn h-sidebar__btn--black">See All</button>
          </div>

          {/* 추천 목록 (팔로우 버튼) */}
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

          {/* 푸터 링크 */}
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

      {/* ========== 모달: 공유 (유저 검색 → 선택 → 전송) ========== */}
      {shareModalPost && (
        <div className="share-modal-overlay" onClick={() => setShareModalPost(null)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <div className="share-modal__header">
              <h2 className="share-modal__title">Share</h2>
              <button 
                className="share-modal__close"
                onClick={() => setShareModalPost(null)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="share-modal__search">
              <input
                type="text"
                placeholder="Search..."
                value={shareSearch}
                onChange={e => handleShareSearch(e.target.value)}
                className="share-modal__input"
              />
            </div>
            
            <div className="share-modal__users">
              {shareUsers.length > 0 ? (
                shareUsers.map(user => (
                  <div 
                    key={user.id} 
                    className={`share-modal__user ${selectedShareUsers.includes(user.id) ? 'share-modal__user--selected' : ''}`}
                    onClick={() => toggleShareUser(user.id)}
                  >
                    <div className="share-modal__user-info">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="share-modal__avatar" />
                      ) : (
                        <div className="share-modal__avatar-placeholder"></div>
                      )}
                      <div className="share-modal__user-text">
                        <span className="share-modal__username">{user.username}</span>
                        <span className="share-modal__fullname">{user.fullName}</span>
                      </div>
                    </div>
                    <div className={`share-modal__checkbox ${selectedShareUsers.includes(user.id) ? 'share-modal__checkbox--checked' : ''}`}>
                      {selectedShareUsers.includes(user.id) && (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                  </div>
                ))
              ) : shareSearch ? (
                <div className="share-modal__empty">No users found</div>
              ) : (
                <div className="share-modal__empty">Search for people to share with</div>
              )}
            </div>
            
            <div className="share-modal__footer">
              <button
                className="share-modal__send-btn"
                disabled={selectedShareUsers.length === 0 || shareSending}
                onClick={handleSendShare}
              >
                {shareSuccess ? 'Sent!' : shareSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== 모달: 스토리 (진행 바, 헤더, 이미지, 좌우 네비) ========== */}
      {selectedStory && (
        <div 
          className="story-modal-overlay"
          onClick={() => setSelectedStory(null)}
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
            {/* 스토리 진행 바 */}
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
                width: '100%',
                animation: 'storyProgress 5s linear forwards',
              }} />
            </div>

            {/* 스토리 헤더 (아바타, 사용자명, 시간, 닫기) */}
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
                onClick={() => setSelectedStory(null)}
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

            {/* 스토리 이미지 */}
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

            {/* 스토리 이전(왼쪽) 영역 */}
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

            {/* 스토리 다음(오른쪽) 영역 */}
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

            {/* 스토리 카운터 (n / 전체) */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '12px',
            }}>
              {storyIndex + 1} / {stories.length}
            </div>
          </div>
        </div>
      )}

      {/* 스토리 진행 애니메이션 keyframes */}
      <style jsx global>{`
        @keyframes storyProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default FeedView;
