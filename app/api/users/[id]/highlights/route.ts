import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get user's highlights
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const highlights = await prisma.highlight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        stories: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            story: {
              select: {
                id: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: highlights.map(highlight => ({
        id: highlight.id,
        name: highlight.name,
        coverImage: highlight.coverImage || highlight.stories[0]?.story.imageUrl,
        storiesCount: highlight.stories.length,
      })),
    });
  } catch (error) {
    console.error('Get highlights error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a highlight
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { name, coverImage, storyIds } = await request.json();

    const highlight = await prisma.highlight.create({
      data: {
        userId,
        name,
        coverImage,
        stories: {
          create: storyIds.map((storyId: string) => ({
            storyId,
          })),
        },
      },
      include: {
        stories: {
          include: {
            story: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: highlight,
    });
  } catch (error) {
    console.error('Create highlight error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
