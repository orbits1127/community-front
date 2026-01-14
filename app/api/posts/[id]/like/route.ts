import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Like a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { userId } = await request.json();

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { success: false, error: 'Already liked' },
        { status: 400 }
      );
    }

    await prisma.like.create({
      data: {
        postId,
        userId,
      },
    });

    // Create notification
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (post && post.userId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'like',
          actorId: userId,
          recipientId: post.userId,
          postId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { liked: true },
    });
  } catch (error) {
    console.error('Like post error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Unlike a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { userId } = await request.json();

    await prisma.like.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { liked: false },
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
