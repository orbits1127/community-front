'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import { User } from '../types';
import { userService } from '../services/dataService';
import { AuthUser } from '../types';

interface SearchViewProps {
  currentUser?: AuthUser | null;
}

interface SearchHistoryItem {
  id: string;
  username: string;
  fullName: string;
  avatar: string | null;
  searchedAt: string;
}

const SearchItemPlaceholder: React.FC = () => (
  <div className="search-page__item">
    <div className="search-page__profile-placeholder"></div>
    <div className="search-page__text-group">
      <div className="search-page__name-placeholder"></div>
      <div className="search-page__sub-placeholder"></div>
    </div>
  </div>
);

const SearchView: React.FC<SearchViewProps> = ({ currentUser }) => {
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Load search history from localStorage on mount
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

  // Save search history to localStorage
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

  // Clear all search history
  const clearSearchHistory = useCallback(() => {
    if (!currentUser?.id) return;
    
    try {
      localStorage.removeItem(`searchHistory_${currentUser.id}`);
      setSearchHistory([]);
    } catch (err) {
      console.error('Error clearing search history:', err);
    }
  }, [currentUser?.id]);

  // Remove single item from search history
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

  // Handle search with debounce
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await userService.searchUsers(query.trim());
        if (response.success && response.data) {
          setSearchResults(response.data);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Error searching users:', err);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    setDebounceTimer(timer);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [query]);

  // Handle user click from search results
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

  // Handle user click from search history
  const handleHistoryItemClick = useCallback((item: SearchHistoryItem) => {
    // Move clicked item to top of history
    saveSearchHistory(item);
  }, [saveSearchHistory]);

  // Handle search button click from search history
  const handleSearchFromHistory = useCallback((item: SearchHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent item click
    // Set query to username to trigger search
    setQuery(item.username);
  }, []);

  return (
    <div className="search-page">
      {/* 1. 상단 중앙 정렬 검색창 */}
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

      {/* 2. 검색 입력창 하단 결과 영역 */}
      <main className="search-page__content">
        {!query ? (
          <>
            {/* 최근 검색 리스트 */}
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
            {/* 검색 결과 리스트 (입력 후) */}
            <div className="search-page__section-header">
              <span className="search-page__title">결과</span>
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
                <div style={{ 
                  padding: '40px 20px', 
                  textAlign: 'center', 
                  color: 'var(--ig-secondary-text)' 
                }}>
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SearchView;
