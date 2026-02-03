'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { User, AuthUser } from '../types';
import { userService } from '../services/dataService';

type ListType = 'followers' | 'following';

interface FollowListModalProps {
  title: string;
  listType: ListType;
  userId: string;
  currentUser: AuthUser | null | undefined;
  onClose: () => void;
  onCountChange?: (listType: ListType, delta: number) => void;
}

const PAGE_SIZE = 20;

const FollowListModal: React.FC<FollowListModalProps> = ({
  title,
  listType,
  userId,
  currentUser,
  onClose,
  onCountChange,
}) => {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [followToggledIds, setFollowToggledIds] = useState<Set<string>>(new Set());
  const [unfollowConfirmTarget, setUnfollowConfirmTarget] = useState<User | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const fetcher =
        listType === 'followers'
          ? userService.getFollowers(userId, pageNum, currentUser?.id)
          : userService.getFollowing(userId, pageNum, currentUser?.id);
      const res = await fetcher;
      if (!res.success || !res.data) return [];
      const list = res.data.items || [];
      if (append) {
        setItems((prev) => (pageNum === 1 ? list : [...prev, ...list]));
      }
      setHasMore(res.data.hasMore ?? false);
      return list;
    },
    [listType, userId, currentUser?.id]
  );

  useEffect(() => {
    setItems([]);
    setPage(1);
    setFollowToggledIds(new Set());
    setLoading(true);
    setHasMore(false);
    let cancelled = false;
    (async () => {
      const res =
        listType === 'followers'
          ? await userService.getFollowers(userId, 1, currentUser?.id)
          : await userService.getFollowing(userId, 1, currentUser?.id);
      if (cancelled) return;
      if (res.success && res.data) {
        setItems(res.data.items || []);
        setHasMore(res.data.hasMore ?? false);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [listType, userId, currentUser?.id]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchPage(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  }, [page, hasMore, loadingMore, fetchPage]);

  const handleFollow = useCallback(
    async (targetUserId: string) => {
      if (!currentUser?.id || targetUserId === currentUser.id) return;
      try {
        await userService.followUser(targetUserId, currentUser.id);
        setFollowToggledIds((prev) => new Set(prev).add(targetUserId));
        if (userId === currentUser.id) {
          onCountChange?.('following', 1);
        }
      } catch (err) {
        console.error('Error following:', err);
      }
    },
    [currentUser?.id, userId, onCountChange]
  );

  const handleUnfollow = useCallback(
    async (targetUserId: string) => {
      if (!currentUser?.id || targetUserId === currentUser.id) return;
      setUnfollowConfirmTarget(null);
      try {
        await userService.unfollowUser(targetUserId, currentUser.id);
        setFollowToggledIds((prev) => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
        setItems((prev) => prev.filter((u) => u.id !== targetUserId));
        if (listType === 'following') {
          onCountChange?.(listType, -1);
        }
        onClose();
      } catch (err) {
        console.error('Error unfollowing:', err);
      }
    },
    [currentUser?.id, listType, onCountChange, onClose]
  );

  const handleUnfollowConfirm = useCallback(() => {
    if (unfollowConfirmTarget) {
      handleUnfollow(unfollowConfirmTarget.id);
    }
  }, [unfollowConfirmTarget, handleUnfollow]);

  const isFollowing = useCallback(
    (user: User) => {
      if (user.isFollowing) return true;
      return followToggledIds.has(user.id);
    },
    [followToggledIds]
  );

  return (
    <div className="follow-list-modal-overlay" onClick={onClose}>
      <div
        className="follow-list-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="follow-list-modal-header">
          <h2 className="follow-list-modal-title">{title}</h2>
          <button
            type="button"
            className="follow-list-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </header>
        <div className="follow-list-modal-body">
          {loading ? (
            <div className="follow-list-modal-loading">Loading...</div>
          ) : items.length === 0 ? (
            <div className="follow-list-modal-empty">No {listType} yet.</div>
          ) : (
            <ul className="follow-list-modal-list">
              {items.map((user) => (
                <li key={user.id} className="follow-list-modal-item">
                  <img
                    src={user.avatar || 'https://via.placeholder.com/44'}
                    alt=""
                    className="follow-list-modal-avatar"
                  />
                  <div className="follow-list-modal-info">
                    <span className="follow-list-modal-username">{user.username}</span>
                    {user.fullName && (
                      <span className="follow-list-modal-fullname">{user.fullName}</span>
                    )}
                  </div>
                  {currentUser?.id && user.id !== currentUser.id && (
                    <button
                      type="button"
                      className={`follow-list-modal-btn ${isFollowing(user) ? 'follow-list-modal-btn--following' : ''}`}
                      onClick={() =>
                        isFollowing(user)
                          ? setUnfollowConfirmTarget(user)
                          : handleFollow(user.id)
                      }
                    >
                      {isFollowing(user) ? 'Following' : 'Follow'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!loading && hasMore && items.length > 0 && (
            <div className="follow-list-modal-more">
              <button
                type="button"
                className="follow-list-modal-load-more"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2차 모달: 팔로우 취소 확인 */}
      {unfollowConfirmTarget && (
        <div
          className="follow-list-unfollow-overlay"
          onClick={() => setUnfollowConfirmTarget(null)}
        >
          <div
            className="follow-list-unfollow-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="unfollow-confirm-title"
          >
            <p id="unfollow-confirm-title" className="follow-list-unfollow-message">
              팔로우를 취소하시겠습니까?
            </p>
            <div className="follow-list-unfollow-actions">
              <button
                type="button"
                className="follow-list-unfollow-btn follow-list-unfollow-btn--cancel"
                onClick={() => setUnfollowConfirmTarget(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="follow-list-unfollow-btn follow-list-unfollow-btn--confirm"
                onClick={handleUnfollowConfirm}
              >
                팔로우 취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowListModal;
