import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get explore posts (popular posts, not from followed users)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '9');
    const userId = searchParams.get('userId');
    const skip = (page - 1) * limit;

    // Get posts ordered by likes (popular posts)
    // If userId is provided, exclude posts from followed users
    let whereClause: any = {};

    if (userId) {
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = following.map(f => f.followingId);
      followingIds.push(userId); // Exclude own posts from explore
      whereClause.userId = { notIn: followingIds };
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: [
        { createdAt: 'desc' }, // Most recent first
      ],
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
        likes: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
        savedBy: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const total = await prisma.post.count({ where: whereClause });

    // Transform posts to match expected format
    const transformedPosts = posts.map(post => {
      const isLiked = Array.isArray(post.likes) ? post.likes.length > 0 : false;
      const isSaved = Array.isArray(post.savedBy) ? post.savedBy.length > 0 : false;

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
        isLiked,
        isSaved,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: transformedPosts,
        total,
        page,
        pageSize: limit,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Get explore posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
