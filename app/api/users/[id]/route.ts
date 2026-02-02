import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const SESSION_COOKIE_NAME = 'session_token';

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.userId !== id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: { fullName?: string; username?: string; avatar?: string | null; bio?: string | null; website?: string | null } = {};

    if (typeof body.fullName === 'string') updates.fullName = body.fullName.trim();
    if (typeof body.username === 'string') updates.username = body.username.trim();
    if (body.avatar !== undefined) updates.avatar = body.avatar === '' ? null : body.avatar;
    if (body.bio !== undefined) updates.bio = body.bio === '' ? null : body.bio;
    if (body.website !== undefined) updates.website = body.website === '' ? null : body.website;

    const user = await prisma.user.update({
      where: { id },
      data: updates,
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
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 409 }
      );
    }
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
