import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get feed posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const total = await prisma.post.count();

    return NextResponse.json({
      success: true,
      data: posts.map(post => ({
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new post
export async function POST(request: NextRequest) {
  try {
    const { userId, imageUrl, caption, location } = await request.json();

    if (!userId || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'userId and imageUrl are required' },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        userId,
        imageUrl,
        caption: caption || null,
        location: location || null,
      },
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
    });

    // Transform to match FeedView expected format
    const transformedPost = {
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
    };

    return NextResponse.json({
      success: true,
      data: transformedPost,
    });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
