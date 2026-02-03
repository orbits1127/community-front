import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DEFAULT_PAGE_SIZE = 20;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE))));
    const skip = (page - 1) * limit;

    const viewerId = searchParams.get('viewerId') ?? undefined;

    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              isVerified: true,
            },
          },
        },
      }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    let viewerFollowingIds: Set<string> = new Set();
    if (viewerId) {
      const viewerFollows = await prisma.follow.findMany({
        where: {
          followerId: viewerId,
          followingId: { in: follows.map((f) => f.following.id) },
        },
        select: { followingId: true },
      });
      viewerFollowingIds = new Set(viewerFollows.map((f) => f.followingId));
    }

    const items = follows.map((f) => {
      const u = f.following;
      return {
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        avatar: u.avatar,
        isVerified: u.isVerified,
        isFollowing: viewerFollowingIds.has(u.id),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize: limit,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Get following error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
