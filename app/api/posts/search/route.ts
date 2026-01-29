import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Search posts by caption, location, or author (username / fullName)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const userId = searchParams.get('userId');

    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: true, data: { items: [], pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false } } }
      );
    }

    const trimmed = query.trim();

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { caption: { contains: trimmed } },
          { location: { contains: trimmed } },
          {
            user: {
              OR: [
                { username: { contains: trimmed } },
                { fullName: { contains: trimmed } },
              ],
            },
          },
        ],
      },
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
        likes: userId ? { where: { userId }, select: { id: true } } : false,
        savedBy: userId ? { where: { userId }, select: { id: true } } : false,
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    const transformedPosts = posts.map((post) => ({
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
          page: 1,
          limit,
          total: transformedPosts.length,
          totalPages: 1,
          hasNext: false,
        },
      },
    });
  } catch (error) {
    console.error('Search posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
