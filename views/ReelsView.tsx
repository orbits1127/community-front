'use client';

import React from 'react';

// =============================================================================
// Skeleton: reel action item (like/comment/share/save etc.)
// =============================================================================

const ReelActionItem: React.FC = () => (
  <div className="reel-action-item">
    <div className="reel-icon-placeholder"></div>
    <div className="reel-stat-placeholder"></div>
  </div>
);

// =============================================================================
// Skeleton: single reel (video area + right action buttons)
// =============================================================================

const ReelPlaceholder: React.FC = () => (
  <div className="reel-container">
    {/* Center: vertical video area (9:16) + bottom info overlay */}
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

    {/* Right: action buttons (like / comment / share / save / more) */}
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
// Reels view: snap scroll to next reel (10 placeholders)
// =============================================================================

const ReelsView: React.FC = () => {
  return (
    <div className="reels-page">
      {/* ---------- Section: reels list (snap scroll) ---------- */}
      {Array.from({ length: 10 }).map((_, i) => (
        <ReelPlaceholder key={`reel-${i}`} />
      ))}
    </div>
  );
};

export default ReelsView;