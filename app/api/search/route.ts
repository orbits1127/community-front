import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Search users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
        isVerified: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: users.map(user => ({
        ...user,
        followersCount: user._count.followers,
      })),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
