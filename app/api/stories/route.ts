import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get stories from followed users (or all stories if no userId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let whereClause: { userId?: { in: string[] }; expiresAt: { gt: Date } } = {
      expiresAt: { gt: new Date() },
    };

    // If userId is provided, filter by followed users
    if (userId) {
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });

      const followingIds = following.map(f => f.followingId);
      followingIds.push(userId); // Include own stories
      whereClause.userId = { in: followingIds };
    }

    // Get stories that haven't expired
    const stories = await prisma.story.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        views: userId ? {
          where: { viewerId: userId },
          select: { id: true },
        } : false,
      },
    });

    // Transform to expected format matching Story type
    const transformedStories = stories.map(story => {
      const isViewed = Array.isArray(story.views) ? story.views.length > 0 : false;
      
      return {
        id: story.id,
        userId: story.user.id,
        user: {
          id: story.user.id,
          username: story.user.username,
          fullName: story.user.username, // Using username as fallback
          avatar: story.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
        },
        imageUrl: story.imageUrl,
        hasUnseenContent: !isViewed,
        createdAt: story.createdAt.toISOString(),
        expiresAt: story.expiresAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedStories,
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
