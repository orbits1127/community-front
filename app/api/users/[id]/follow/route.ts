import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Follow a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: followingId } = await params;
    const { userId: followerId } = await request.json();

    if (followerId === followingId) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { success: false, error: 'Already following' },
        { status: 400 }
      );
    }

    await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        type: 'follow',
        actorId: followerId,
        recipientId: followingId,
      },
    });

    return NextResponse.json({
      success: true,
      data: { following: true },
    });
  } catch (error) {
    console.error('Follow user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Unfollow a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: followingId } = await params;
    const { userId: followerId } = await request.json();

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { following: false },
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
