'use client';

import React from 'react';

const NotificationItemPlaceholder: React.FC = () => (
  <div className="notification-item">
    {/* 원형 프로필 placeholder */}
    <div className="notification-item__avatar"></div>
    
    <div className="notification-item__content">
      {/* 알림 텍스트 placeholder */}
      <div className="notification-item__text-line"></div>
      <div className="notification-item__text-line" style={{ width: '40%' }}></div>
      {/* 시간 표시 placeholder */}
      <span className="notification-item__time">2h</span>
    </div>

    {/* 알림 유형에 따른 우측 액션 placeholder (팔로우 버튼 또는 포스트 썸네일) */}
    <div className="notification-item__action"></div>
  </div>
);

const NotificationsView: React.FC = () => {
  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <h1 className="notifications-title">Notifications</h1>
        
        <section className="notifications-section">
          <h2 className="notifications-section-label">Today</h2>
          <div className="notifications-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <NotificationItemPlaceholder key={`notif-today-${i}`} />
            ))}
          </div>
        </section>

        <section className="notifications-section">
          <h2 className="notifications-section-label">This Week</h2>
          <div className="notifications-list">
            {Array.from({ length: 8 }).map((_, i) => (
              <NotificationItemPlaceholder key={`notif-week-${i}`} />
            ))}
          </div>
        </section>

        <section className="notifications-section">
          <h2 className="notifications-section-label">Earlier</h2>
          <div className="notifications-list">
            {Array.from({ length: 5 }).map((_, i) => (
              <NotificationItemPlaceholder key={`notif-earlier-${i}`} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default NotificationsView;
