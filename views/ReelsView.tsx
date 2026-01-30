'use client';

import React from 'react';

// =============================================================================
// 스켈레톤: 릴스 액션 아이템 (좋아요/댓글/공유/저장 등)
// =============================================================================

const ReelActionItem: React.FC = () => (
  <div className="reel-action-item">
    <div className="reel-icon-placeholder"></div>
    <div className="reel-stat-placeholder"></div>
  </div>
);

// =============================================================================
// 스켈레톤: 릴스 한 개 (비디오 영역 + 우측 액션 버튼)
// =============================================================================

const ReelPlaceholder: React.FC = () => (
  <div className="reel-container">
    {/* 중앙: 세로형 비디오 영역 (9:16) + 하단 정보 오버레이 */}
    <div className="reel-video-placeholder">
      <div className="reel-info-overlay">
        <div className="reel-user-placeholder">
          <div className="reel-avatar-placeholder"></div>
          <div className="reel-text-placeholder"></div>
        </div>
        <div className="reel-caption-placeholder"></div>
        <div className="reel-caption-placeholder" style={{ width: '60%' }}></div>
      </div>
    </div>

    {/* 우측: 액션 버튼 (좋아요 / 댓글 / 공유 / 저장 / 더보기) */}
    <aside className="reel-actions">
      <ReelActionItem />
      <ReelActionItem />
      <ReelActionItem />
      <ReelActionItem />
      <div className="reel-icon-placeholder" style={{ borderRadius: '50%', marginTop: '10px' }}></div>
    </aside>
  </div>
);

// =============================================================================
// 릴스 뷰: 스냅 스크롤로 다음 릴스 전환 (플레이스홀더 10개)
// =============================================================================

const ReelsView: React.FC = () => {
  return (
    <div className="reels-page">
      {/* ---------- 구역: 릴스 목록 (스냅 스크롤) ---------- */}
      {Array.from({ length: 10 }).map((_, i) => (
        <ReelPlaceholder key={`reel-${i}`} />
      ))}
    </div>
  );
};

export default ReelsView;