import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const post = await prisma.post.findUnique({
      where: { id },
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
        comments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
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
            comments: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    const { _count, ...postData } = post;
    
    return NextResponse.json({
      success: true,
      data: {
        ...postData,
        likes: _count.likes,
        commentsCount: _count.comments,
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update post (caption, imageUrl, location)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { caption, imageUrl, location } = body;

    const updateData: { caption?: string; imageUrl?: string; location?: string } = {};
    if (caption !== undefined) updateData.caption = caption ?? '';
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (location !== undefined) updateData.location = location;

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
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

    const { _count, ...postData } = post;
    return NextResponse.json({
      success: true,
      data: {
        ...postData,
        likes: _count.likes,
        commentsCount: _count.comments,
      },
    });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Post deleted successfully' },
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
