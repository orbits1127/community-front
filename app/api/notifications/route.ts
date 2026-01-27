import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current user info for actor data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get notifications where user is recipient (received notifications)
    const receivedNotifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            imageUrl: true,
          },
        },
      },
    });

    // Get likes where user is the actor (user's own activities)
    const userLikes = await prisma.like.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          select: {
            id: true,
            imageUrl: true,
            userId: true,
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Get follows where user is the follower (user's own follow activities)
    const userFollows = await prisma.follow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Transform likes into notification-like objects
    const likeActivities = userLikes.map(like => ({
      id: `like-${like.id}`,
      type: 'like' as const,
      actorId: userId,
      actor: {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      recipientId: like.post.userId,
      postId: like.post.id,
      post: {
        id: like.post.id,
        imageUrl: like.post.imageUrl,
      },
      message: null,
      isRead: true, // User's own activities are always "read"
      createdAt: like.createdAt.toISOString(),
      isOwnActivity: true, // Flag to indicate this is user's own activity
      postOwner: like.post.user, // Post owner info for display
    }));

    // Transform follows into notification-like objects
    const followActivities = userFollows.map(follow => ({
      id: `follow-${follow.id}`,
      type: 'follow' as const,
      actorId: userId,
      actor: {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      recipientId: follow.followingId,
      postId: null,
      post: null,
      message: null,
      isRead: true, // User's own activities are always "read"
      createdAt: follow.createdAt.toISOString(),
      isOwnActivity: true, // Flag to indicate this is user's own activity
      followedUser: follow.following, // User being followed
    }));

    // Combine and sort all notifications by date
    const allNotifications = [
      ...receivedNotifications.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        isOwnActivity: false,
      })),
      ...likeActivities,
      ...followActivities,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const total = allNotifications.length;
    const notifications = allNotifications.slice(skip, skip + limit);

    const unreadCount = await prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const { userId, notificationIds } = await request.json();

    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          recipientId: userId,
        },
        data: { isRead: true },
      });
    } else {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: { recipientId: userId },
        data: { isRead: true },
      });
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Notifications marked as read' },
    });
  } catch (error) {
    console.error('Mark notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
