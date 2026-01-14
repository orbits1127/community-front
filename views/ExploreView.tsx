'use client';

import React from 'react';

const ExploreCardPlaceholder: React.FC = () => (
  <div className="explore-card">
    <div className="explore-card__overlay">
      <div className="explore-card__stat-placeholder">
        <div className="explore-card__icon-shape"></div>
        <div className="explore-card__text-shape"></div>
      </div>
      <div className="explore-card__stat-placeholder">
        <div className="explore-card__icon-shape"></div>
        <div className="explore-card__text-shape"></div>
      </div>
    </div>
  </div>
);

const ExploreView: React.FC = () => {
  return (
    <div className="explore-page">
      <main className="explore-grid">
        {Array.from({ length: 18 }).map((_, i) => (
          <ExploreCardPlaceholder key={`explore-${i}`} />
        ))}
      </main>
    </div>
  );
};

export default ExploreView;
