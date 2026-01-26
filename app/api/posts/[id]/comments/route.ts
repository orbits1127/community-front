import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        replies: {
          take: 3,
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    const total = await prisma.comment.count({
      where: { postId, parentId: null },
    });

    const transformedComments = comments.map(comment => ({
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      user: comment.user,
      content: comment.content,
      likes: comment._count.likes,
      createdAt: comment.createdAt.toISOString(),
      replies: comment.replies.map(reply => ({
        id: reply.id,
        postId: reply.postId,
        userId: reply.userId,
        user: reply.user,
        content: reply.content,
        likes: 0,
        createdAt: reply.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: transformedComments,
        total,
        page,
        pageSize: limit,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { userId, content, parentId } = await request.json();

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
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
          type: 'comment',
          actorId: userId,
          recipientId: post.userId,
          postId,
          message: content.slice(0, 100),
        },
      });
    }

    // Transform to match Comment type
    return NextResponse.json({
      success: true,
      data: {
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        user: comment.user,
        content: comment.content,
        likes: comment._count.likes,
        createdAt: comment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
