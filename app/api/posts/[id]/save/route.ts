import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Save a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if already saved
    const existingSave = await prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingSave) {
      return NextResponse.json(
        { success: false, error: 'Already saved' },
        { status: 400 }
      );
    }

    await prisma.savedPost.create({
      data: {
        postId,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: { saved: true },
    });
  } catch (error) {
    console.error('Save post error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Unsave a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await prisma.savedPost.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { saved: false },
    });
  } catch (error) {
    console.error('Unsave post error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
