import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get stories from followed users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get users that the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId); // Include own stories

    // Get stories that haven't expired
    const stories = await prisma.story.findMany({
      where: {
        userId: { in: followingIds },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        views: {
          where: { viewerId: userId },
          select: { id: true },
        },
      },
    });

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const userId = story.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: [],
          hasUnviewed: false,
        };
      }
      acc[userId].stories.push({
        ...story,
        isViewed: story.views.length > 0,
      });
      if (story.views.length === 0) {
        acc[userId].hasUnviewed = true;
      }
      return acc;
    }, {} as Record<string, unknown>);

    return NextResponse.json({
      success: true,
      data: Object.values(groupedStories),
    });
  } catch (error) {
    console.error('Get stories error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a story
export async function POST(request: NextRequest) {
  try {
    const { userId, imageUrl } = await request.json();

    const story = await prisma.story.create({
      data: {
        userId,
        imageUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: story,
    });
  } catch (error) {
    console.error('Create story error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
