import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get saved posts for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get saved posts
    const savedPosts = await prisma.savedPost.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
                isVerified: true,
              },
            },
            likes: {
              where: { userId },
              select: { id: true },
            },
            savedBy: {
              where: { userId },
              select: { id: true },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.savedPost.count({
      where: { userId },
    });

    // Transform to match Post type
    const items = savedPosts.map(savedPost => {
      const post = savedPost.post;
      return {
        id: post.id,
        userId: post.userId,
        user: post.user,
        imageUrl: post.imageUrl,
        caption: post.caption || '',
        likes: post._count.likes,
        commentsCount: post._count.comments,
        location: post.location,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        isLiked: post.likes.length > 0,
        isSaved: post.savedBy.length > 0,
      };
    });

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
    };

    return NextResponse.json({
      success: true,
      data: { items, pagination },
    });
  } catch (error) {
    console.error('Get saved posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
