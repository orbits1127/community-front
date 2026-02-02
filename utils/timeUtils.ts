/**
 * Format a date to show time ago (e.g., "2h", "3d", "1w")
 */
export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y`;
}

/**
 * Group notifications by time period (Today, This Week, Earlier)
 */
export function groupNotificationsByTime<T extends { createdAt: string }>(
  notifications: T[]
): {
  today: T[];
  thisWeek: T[];
  earlier: T[];
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayNotifications: T[] = [];
  const thisWeekNotifications: T[] = [];
  const earlierNotifications: T[] = [];

  notifications.forEach((notification) => {
    const createdAt = new Date(notification.createdAt);

    if (createdAt >= today) {
      todayNotifications.push(notification);
    } else if (createdAt >= weekAgo) {
      thisWeekNotifications.push(notification);
    } else {
      earlierNotifications.push(notification);
    }
  });

  return {
    today: todayNotifications,
    thisWeek: thisWeekNotifications,
    earlier: earlierNotifications,
  };
}
