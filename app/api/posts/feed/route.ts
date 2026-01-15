import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get feed posts (posts from followed users)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    const skip = (page - 1) * limit;

    let whereClause = {};

    // If userId is provided, get posts from followed users
    if (userId) {
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = following.map(f => f.followingId);
      followingIds.push(userId); // Include own posts
      whereClause = { userId: { in: followingIds } };
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
    const transformedPosts = posts.map(post => ({
      id: post.id,
      user: {
        id: post.user.id,
        username: post.user.username,
        name: post.user.fullName,
        avatar: post.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
        isVerified: post.user.isVerified,
      },
      imageUrl: post.imageUrl,
      caption: post.caption || '',
      location: post.location,
      likes: post._count.likes,
      commentsCount: post._count.comments,
      isLiked: Array.isArray(post.likes) && post.likes.length > 0,
      isSaved: Array.isArray(post.savedBy) && post.savedBy.length > 0,
      createdAt: post.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: transformedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Get feed error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
