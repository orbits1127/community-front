import React from 'react';

const ReelActionItem: React.FC = () => (
  <div className="reel-action-item">
    <div className="reel-icon-placeholder"></div>
    <div className="reel-stat-placeholder"></div>
  </div>
);

const ReelPlaceholder: React.FC = () => (
  <div className="reel-container">
    {/* 1. 화면 중앙 세로형 비디오 placeholder (9:16 비율) */}
    <div className="reel-video-placeholder">
      {/* 하단 정보 오버레이 placeholder */}
      <div className="reel-info-overlay">
        <div className="reel-user-placeholder">
          <div className="reel-avatar-placeholder"></div>
          <div className="reel-text-placeholder"></div>
        </div>
        <div className="reel-caption-placeholder"></div>
        <div className="reel-caption-placeholder" style={{ width: '60%' }}></div>
      </div>
    </div>

    {/* 2. 우측 액션 버튼 세로 정렬 */}
    <aside className="reel-actions">
      <ReelActionItem /> {/* Like placeholder */}
      <ReelActionItem /> {/* Comment placeholder */}
      <ReelActionItem /> {/* Share placeholder */}
      <ReelActionItem /> {/* Save placeholder */}
      <div className="reel-icon-placeholder" style={{ borderRadius: '50%', marginTop: '10px' }}></div> {/* More placeholder */}
    </aside>
  </div>
);

const ReelsView: React.FC = () => {
  return (
    <div className="reels-page">
      {/* 스크롤 시 다음 릴스로 전환되는 구조적 힌트 표현 (Snap Scroll) */}
      {Array.from({ length: 10 }).map((_, i) => (
        <ReelPlaceholder key={`reel-${i}`} />
      ))}
    </div>
  );
};

export default ReelsView;