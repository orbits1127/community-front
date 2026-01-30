'use client';

import React, { useState, useEffect } from 'react';
import { Notification } from '../types';
import { AuthUser } from '../types';
import { notificationService } from '../services/dataService';
import { formatTimeAgo, groupNotificationsByTime } from '../utils/timeUtils';
import { Heart, UserPlus } from 'lucide-react';

// =============================================================================
// 타입 정의
// =============================================================================

interface NotificationsViewProps {
  currentUser?: AuthUser | null;
}

interface NotificationItemProps {
  notification: Notification;
}

// =============================================================================
// 알림 아이템: 팔로우 / 좋아요 타입별 렌더
// =============================================================================

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const isOwnActivity = notification.isOwnActivity || false;

  /* 팔로우 알림 */
  if (notification.type === 'follow') {
    const displayUser = isOwnActivity && notification.followedUser
      ? notification.followedUser
      : notification.actor;

    return (
      <div className="notification-item">
        <div className="notification-item__avatar">
          {displayUser.avatar ? (
            <img 
              src={displayUser.avatar} 
              alt={displayUser.username}
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
              fontSize: '18px',
              fontWeight: 600
            }}>
              {displayUser.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="notification-item__content">
          {/* Notification Text */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            flexWrap: 'wrap',
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            {isOwnActivity ? (
              <>
                <span style={{ fontWeight: 600, color: 'var(--ig-primary-text)' }}>
                  내가
                </span>
                {notification.followedUser && (
                  <>
                    <span style={{ fontWeight: 600, color: 'var(--ig-primary-text)' }}>
                      {notification.followedUser.username}
                    </span>
                    <span style={{ color: 'var(--ig-primary-text)' }}>님을</span>
                  </>
                )}
                <UserPlus 
                  size={14} 
                  fill="currentColor" 
                  color="currentColor"
                  style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' }}
                />
                <span style={{ color: 'var(--ig-primary-text)' }}>팔로우하기 시작했습니다</span>
              </>
            ) : (
              <>
                <span style={{ fontWeight: 600, color: 'var(--ig-primary-text)' }}>
                  {notification.actor.username}
                </span>
                <span style={{ color: 'var(--ig-primary-text)' }}>님이</span>
                <UserPlus 
                  size={14} 
                  fill="currentColor" 
                  color="currentColor"
                  style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' }}
                />
                <span style={{ color: 'var(--ig-primary-text)' }}>팔로우하기 시작했습니다</span>
              </>
            )}
          </div>
          <span className="notification-item__time">{formatTimeAgo(notification.createdAt)}</span>
        </div>

        <div className="notification-item__action" style={{ display: 'none' }}></div>
      </div>
    );
  }

  // Handle like notifications
  if (notification.type !== 'like' || !notification.post) {
    return null;
  }

  const displayUser = isOwnActivity && notification.postOwner 
    ? notification.postOwner 
    : notification.actor;

  return (
    <div className="notification-item">
      <div className="notification-item__avatar">
        {displayUser.avatar ? (
          <img 
            src={displayUser.avatar} 
            alt={displayUser.username}
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
            fontSize: '18px',
            fontWeight: 600
          }}>
            {displayUser.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="notification-item__content">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px', 
          flexWrap: 'wrap',
          fontSize: '14px',
          lineHeight: '1.4'
        }}>
          {isOwnActivity ? (
            <>
              <span style={{ fontWeight: 600, color: 'var(--ig-primary-text)' }}>
                내가
              </span>
              {notification.postOwner && (
                <>
                  <span style={{ fontWeight: 600, color: 'var(--ig-primary-text)' }}>
                    {notification.postOwner.username}
                  </span>
                  <span style={{ color: 'var(--ig-primary-text)' }}>님의 게시물에</span>
                </>
              )}
              <Heart 
                size={14} 
                fill="#ed4956" 
                color="#ed4956"
                style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' }}
              />
              <span style={{ color: 'var(--ig-primary-text)' }}>좋아요를 눌렀습니다</span>
            </>
          ) : (
            <>
              <span style={{ fontWeight: 600, color: 'var(--ig-primary-text)' }}>
                {notification.actor.username}
              </span>
              <span style={{ color: 'var(--ig-primary-text)' }}>님이</span>
              <Heart 
                size={14} 
                fill="#ed4956" 
                color="#ed4956"
                style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' }}
              />
              <span style={{ color: 'var(--ig-primary-text)' }}>좋아요를 눌렀습니다</span>
            </>
          )}
        </div>
        <span className="notification-item__time">{formatTimeAgo(notification.createdAt)}</span>
      </div>

      <div className="notification-item__action">
        {notification.post.imageUrl && (
          <img 
            src={notification.post.imageUrl} 
            alt="Post"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '4px'
            }}
          />
        )}
      </div>
    </div>
  );
};

const NotificationItemPlaceholder: React.FC = () => (
  <div className="notification-item">
    <div className="notification-item__avatar"></div>
    <div className="notification-item__content">
      <div className="notification-item__text-line"></div>
      <div className="notification-item__text-line" style={{ width: '40%' }}></div>
      <span className="notification-item__time">2h</span>
    </div>
    <div className="notification-item__action"></div>
  </div>
);

const NotificationsView: React.FC<NotificationsViewProps> = ({ currentUser }) => {
  // =============================================================================
  // 상태: 알림 목록, 로딩, 에러
  // =============================================================================
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =============================================================================
  // 알림 로드 (like / follow 타입만 필터)
  // =============================================================================
  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await notificationService.getNotifications(currentUser.id, 1, 100);
        
        if (response.success && response.data) {
          // Filter 'like' and 'follow' type notifications
          const filteredNotifications = response.data.filter(n => 
            n.type === 'like' || n.type === 'follow'
          );
          setNotifications(filteredNotifications);
        } else {
          setError(response.error || 'Failed to load notifications');
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser?.id]);

  // 시간대별 그룹 (Today / This Week / Earlier)
  const groupedNotifications = groupNotificationsByTime(notifications);

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <h1 className="notifications-title">Notifications</h1>

        {/* ---------- 구역: 로딩 / 에러 / 빈 상태 / 그룹별 알림 목록 ---------- */}
        {loading ? (
          <>
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
          </>
        ) : error ? (
          <div style={{ 
            padding: '40px 20px', 
            textAlign: 'center', 
            color: 'var(--ig-secondary-text)' 
          }}>
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ 
            padding: '40px 20px', 
            textAlign: 'center', 
            color: 'var(--ig-secondary-text)' 
          }}>
            알림이 없습니다
          </div>
        ) : (
          <>
            {/* 오늘 */}
            {groupedNotifications.today.length > 0 && (
              <section className="notifications-section">
                <h2 className="notifications-section-label">Today</h2>
                <div className="notifications-list">
                  {groupedNotifications.today.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              </section>
            )}

            {/* 이번 주 */}
            {groupedNotifications.thisWeek.length > 0 && (
              <section className="notifications-section">
                <h2 className="notifications-section-label">This Week</h2>
                <div className="notifications-list">
                  {groupedNotifications.thisWeek.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              </section>
            )}

            {/* 그 이전 */}
            {groupedNotifications.earlier.length > 0 && (
              <section className="notifications-section">
                <h2 className="notifications-section-label">Earlier</h2>
                <div className="notifications-list">
                  {groupedNotifications.earlier.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsView;
