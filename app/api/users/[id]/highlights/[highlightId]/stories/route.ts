import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get stories for a specific highlight
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; highlightId: string }> }
) {
  try {
    const { id: userId, highlightId } = await params;

    // Get the highlight with its stories
    const highlight = await prisma.highlight.findFirst({
      where: {
        id: highlightId,
        userId, // Ensure the highlight belongs to the user
      },
      include: {
        stories: {
          orderBy: { createdAt: 'asc' },
          include: {
            story: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true,
                    fullName: true,
                  },
                },
                views: userId ? {
                  where: { viewerId: userId },
                  select: { id: true },
                } : false,
              },
            },
          },
        },
      },
    });

    if (!highlight) {
      return NextResponse.json(
        { success: false, error: 'Highlight not found' },
        { status: 404 }
      );
    }

    // Transform to expected format matching Story type
    const transformedStories = highlight.stories.map((highlightStory) => {
      const story = highlightStory.story;
      const isViewed = Array.isArray(story.views) ? story.views.length > 0 : false;
      
      return {
        id: story.id,
        userId: story.user.id,
        user: {
          id: story.user.id,
          username: story.user.username,
          fullName: story.user.fullName || story.user.username,
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
    console.error('Get highlight stories error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
