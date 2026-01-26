import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
        bio: true,
        website: true,
        isPrivate: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const { _count, ...userWithoutCount } = user;
    const profile = {
      ...userWithoutCount,
      postsCount: _count.posts,
      followersCount: _count.followers,
      followingCount: _count.following,
    };

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
