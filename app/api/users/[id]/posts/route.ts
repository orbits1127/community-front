import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get user's posts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const total = await prisma.post.count({ where: { userId } });

    const items = posts.map(post => {
      const { _count, ...rest } = post;
      return {
        ...rest,
        likes: _count.likes,
        commentsCount: _count.comments,
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
    console.error('Get user posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
