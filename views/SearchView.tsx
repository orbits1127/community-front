'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import { User, Post } from '../types';
import { userService, postService } from '../services/dataService';
import { AuthUser } from '../types';
import PostComponent from '../components/Post';

// =============================================================================
// 타입 정의
// =============================================================================

interface SearchViewProps {
  currentUser?: AuthUser | null;
  onOpenComments?: (post: Post) => void;
}

interface SearchHistoryItem {
  id: string;
  username: string;
  fullName: string;
  avatar: string | null;
  searchedAt: string;
}

// =============================================================================
// 스켈레톤: 검색 결과 아이템 플레이스홀더
// =============================================================================

const SearchItemPlaceholder: React.FC = () => (
  <div className="search-page__item">
    <div className="search-page__profile-placeholder"></div>
    <div className="search-page__text-group">
      <div className="search-page__name-placeholder"></div>
      <div className="search-page__sub-placeholder"></div>
    </div>
  </div>
);

const SearchView: React.FC<SearchViewProps> = ({ currentUser, onOpenComments }) => {
  // =============================================================================
  // 상태: 검색어, 최근 검색, 사용자/포스트 검색 결과, 로딩
  // =============================================================================
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchPosts, setSearchPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // =============================================================================
  // 최근 검색: 로드 / 저장 / 모두 지우기 / 항목 제거
  // =============================================================================
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const loadSearchHistory = () => {
      try {
        const stored = localStorage.getItem(`searchHistory_${currentUser.id}`);
        if (stored) {
          const history = JSON.parse(stored) as SearchHistoryItem[];
          setSearchHistory(history);
        }
      } catch (err) {
        console.error('Error loading search history:', err);
      }
    };

    loadSearchHistory();
  }, [currentUser?.id]);

  const saveSearchHistory = useCallback((item: SearchHistoryItem) => {
    if (!currentUser?.id) return;

    try {
      const stored = localStorage.getItem(`searchHistory_${currentUser.id}`);
      let history: SearchHistoryItem[] = stored ? JSON.parse(stored) : [];
      
      // Remove duplicate if exists (same user)
      history = history.filter(h => h.id !== item.id);
      
      // Add new item at the beginning
      history.unshift(item);
      
      // Limit to 10 items
      history = history.slice(0, 10);
      
      localStorage.setItem(`searchHistory_${currentUser.id}`, JSON.stringify(history));
      setSearchHistory(history);
    } catch (err) {
      console.error('Error saving search history:', err);
    }
  }, [currentUser?.id]);

  const clearSearchHistory = useCallback(() => {
    if (!currentUser?.id) return;
    
    try {
      localStorage.removeItem(`searchHistory_${currentUser.id}`);
      setSearchHistory([]);
    } catch (err) {
      console.error('Error clearing search history:', err);
    }
  }, [currentUser?.id]);

  const removeSearchHistoryItem = useCallback((itemId: string) => {
    if (!currentUser?.id) return;

    try {
      const stored = localStorage.getItem(`searchHistory_${currentUser.id}`);
      if (stored) {
        const history = JSON.parse(stored) as SearchHistoryItem[];
        const filtered = history.filter(h => h.id !== itemId);
        localStorage.setItem(`searchHistory_${currentUser.id}`, JSON.stringify(filtered));
        setSearchHistory(filtered);
      }
    } catch (err) {
      console.error('Error removing search history item:', err);
    }
  }, [currentUser?.id]);

  // =============================================================================
  // 검색: 디바운스(300ms) 후 사용자 + 포스트 동시 검색
  // =============================================================================
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchPosts([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setLoadingPosts(true);
      try {
        const [usersRes, postsRes] = await Promise.all([
          userService.searchUsers(query.trim()),
          postService.searchPosts(query.trim(), 20, currentUser?.id),
        ]);
        if (usersRes.success && usersRes.data) {
          setSearchResults(usersRes.data);
        } else {
          setSearchResults([]);
        }
        if (postsRes.success && postsRes.data?.items) {
          setSearchPosts(postsRes.data.items);
        } else {
          setSearchPosts([]);
        }
      } catch (err) {
        console.error('Error searching:', err);
        setSearchResults([]);
        setSearchPosts([]);
      } finally {
        setLoading(false);
        setLoadingPosts(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUser?.id]);

  // 검색 결과 사용자 클릭 → 최근 검색에 추가 후 검색어 비움
  const handleUserClick = useCallback((user: User) => {
    // Save to search history
    const historyItem: SearchHistoryItem = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      searchedAt: new Date().toISOString(),
    };
    saveSearchHistory(historyItem);
    
    // Clear search query to show history
    setQuery('');
  }, [saveSearchHistory]);

  // 최근 검색 항목 클릭 → 해당 항목을 맨 위로
  const handleHistoryItemClick = useCallback((item: SearchHistoryItem) => {
    // Move clicked item to top of history
    saveSearchHistory(item);
  }, [saveSearchHistory]);

  // 최근 검색에서 검색 버튼 클릭 → 해당 사용자명으로 검색 실행
  const handleSearchFromHistory = useCallback((item: SearchHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent item click
    // Set query to username to trigger search
    setQuery(item.username);
  }, []);

  return (
    <div className="search-page">
      {/* ---------- 구역: 상단 검색창 ---------- */}
      <header className="search-page__header">
        <div className="search-page__input-wrapper">
          <input 
            type="text" 
            className="search-page__input" 
            placeholder="검색" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      {/* ---------- 구역: 검색 결과 영역 (최근 검색 | 계정 + 관련 피드) ---------- */}
      <main className="search-page__content">
        {!query ? (
          <>
            {/* 최근 검색: 모두 지우기 + 목록 (클릭/검색/제거 버튼) */}
            {searchHistory.length > 0 && (
              <>
                <div className="search-page__section-header">
                  <span className="search-page__title">최근 검색 항목</span>
                  <button 
                    className="search-page__clear-btn"
                    onClick={clearSearchHistory}
                  >
                    모두 지우기
                  </button>
                </div>
                <div className="search-page__list">
                  {searchHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="search-page__item"
                      onClick={() => handleHistoryItemClick(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="search-page__profile">
                        {item.avatar ? (
                          <img 
                            src={item.avatar} 
                            alt={item.username}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            backgroundColor: 'var(--ig-elevated-separator)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--ig-primary-text)',
                            fontSize: '14px',
                            fontWeight: 600
                          }}>
                            {item.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="search-page__text-group">
                        <div className="search-page__name">{item.username}</div>
                        <div className="search-page__sub">{item.fullName}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          className="search-page__search-btn"
                          onClick={(e) => handleSearchFromHistory(item, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--ig-primary-text)'
                          }}
                          title="검색"
                        >
                          <Search size={16} />
                        </button>
                        <button
                          className="search-page__remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSearchHistoryItem(item.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--ig-secondary-text)'
                          }}
                          title="제거"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {searchHistory.length === 0 && (
              <div className="search-page__section-header">
                <span className="search-page__title">최근 검색 항목</span>
                <button className="search-page__clear-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  모두 지우기
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* 검색 결과: 계정(사용자) 목록 */}
            <div className="search-page__section-header">
              <span className="search-page__title">계정</span>
            </div>
            <div className="search-page__list">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SearchItemPlaceholder key={`loading-${i}`} />
                ))
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div 
                    key={user.id} 
                    className="search-page__item"
                    onClick={() => handleUserClick(user)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="search-page__profile">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.username}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          backgroundColor: 'var(--ig-elevated-separator)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--ig-primary-text)',
                          fontSize: '14px',
                          fontWeight: 600
                        }}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="search-page__text-group">
                      <div className="search-page__name">{user.username}</div>
                      <div className="search-page__sub">{user.fullName}</div>
                    </div>
                  </div>
                ))
              ) : (
                !loadingPosts && searchPosts.length === 0 ? (
                  <div style={{ 
                    padding: '40px 20px', 
                    textAlign: 'center', 
                    color: 'var(--ig-secondary-text)' 
                  }}>
                    검색 결과가 없습니다
                  </div>
                ) : (
                  <div style={{ padding: '12px 20px', color: 'var(--ig-secondary-text)', fontSize: '14px' }}>
                    일치하는 계정이 없습니다
                  </div>
                )
              )}
            </div>

            {/* 검색 결과: 관련 피드 (PostComponent, 댓글 열기) */}
            {(searchPosts.length > 0 || loadingPosts) && (
              <>
                <div className="search-page__section-header" style={{ marginTop: '24px' }}>
                  <span className="search-page__title">관련 피드</span>
                </div>
                <div className="search-page__feed" style={{ maxWidth: '470px', margin: '0 auto' }}>
                  {loadingPosts ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={`post-skeleton-${i}`} className="post" style={{ opacity: 0.6 }}>
                        <div style={{ height: '400px', background: 'var(--ig-elevated-separator)', borderRadius: '4px' }} />
                      </div>
                    ))
                  ) : (
                    searchPosts.map((post) => (
                      <PostComponent
                        key={post.id}
                        post={post}
                        onOpenComments={onOpenComments}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SearchView;
