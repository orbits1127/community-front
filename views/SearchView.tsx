
import React, { useState } from 'react';

const SearchItemPlaceholder: React.FC = () => (
  <div className="search-page__item">
    <div className="search-page__profile-placeholder"></div>
    <div className="search-page__text-group">
      <div className="search-page__name-placeholder"></div>
      <div className="search-page__sub-placeholder"></div>
    </div>
  </div>
);

const SearchView: React.FC = () => {
  const [query, setQuery] = useState('');

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
            <div className="search-page__section-header">
              <span className="search-page__title">최근 검색 항목</span>
              <button className="search-page__clear-btn">모두 지우기</button>
            </div>
            <div className="search-page__list">
              {Array.from({ length: 6 }).map((_, i) => (
                <SearchItemPlaceholder key={`recent-${i}`} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* 검색 결과 리스트 (입력 후) */}
            <div className="search-page__section-header">
              <span className="search-page__title">결과</span>
            </div>
            <div className="search-page__list">
              {Array.from({ length: 10 }).map((_, i) => (
                <SearchItemPlaceholder key={`result-${i}`} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SearchView;
