import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get user suggestions (users not followed by current user)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '5');

    // If no userId provided, return random users
    if (!userId) {
      const randomUsers = await prisma.user.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          isVerified: true,
        },
      });

      // If no users in database, return dummy data
      if (randomUsers.length === 0) {
        const dummySuggestions = Array.from({ length: limit }).map((_, index) => ({
          id: `dummy-${index}`,
          user: {
            id: `dummy-user-${index}`,
            username: `user_${index + 1}`,
            fullName: `User ${index + 1}`,
            avatar: `https://picsum.photos/seed/suggestion-${index}/150/150`,
            isVerified: false,
          },
          reason: index === 0 
            ? 'Followed by art_daily + 5 more'
            : index === 1
            ? 'New to Instagram'
            : 'Suggested for you',
        }));

        return NextResponse.json({
          success: true,
          data: dummySuggestions,
        });
      }

      const suggestions = randomUsers.map((user, index) => ({
        id: user.id,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar || `https://picsum.photos/seed/suggestion-${user.id}/150/150`,
          isVerified: user.isVerified || false,
        },
        reason: index === 0 
          ? 'Followed by art_daily + 5 more'
          : index === 1
          ? 'New to Instagram'
          : 'Suggested for you',
      }));

      return NextResponse.json({
        success: true,
        data: suggestions,
      });
    }

    // Get users that the current user is following
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId); // Exclude self

    // Get random users not in following list
    let allUsers = await prisma.user.findMany({
      where: {
        id: { notIn: followingIds },
      },
      take: limit * 3, // Get more to randomize
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
    });

    // If no users found, get any users (except self)
    if (allUsers.length === 0) {
      allUsers = await prisma.user.findMany({
        where: {
          id: { not: userId },
        },
        take: limit,
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              followers: true,
            },
          },
        },
      });
    }

    // If still no users, create dummy suggestions
    if (allUsers.length === 0) {
      const dummySuggestions = Array.from({ length: limit }).map((_, index) => ({
        id: `dummy-${index}`,
        user: {
          id: `dummy-user-${index}`,
          username: `user_${index + 1}`,
          fullName: `User ${index + 1}`,
          avatar: `https://picsum.photos/seed/suggestion-${index}/150/150`,
          isVerified: false,
        },
        reason: index === 0 
          ? 'Followed by art_daily + 5 more'
          : index === 1
          ? 'New to Instagram'
          : 'Suggested for you',
      }));

      return NextResponse.json({
        success: true,
        data: dummySuggestions,
      });
    }

    // Shuffle and take limit
    const shuffled = allUsers.sort(() => 0.5 - Math.random());
    const selectedUsers = shuffled.slice(0, limit);

    // Generate suggestions with reasons
    const suggestions = selectedUsers.map((user, index) => {
      let reason = 'Suggested for you';
      
      // Generate varied reasons
      if (user._count.followers > 10) {
        const randomFollower = Math.floor(Math.random() * 5) + 1;
        reason = `Followed by ${randomFollower} people you follow`;
      } else if (new Date(user.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        reason = 'New to Instagram';
      } else if (index % 2 === 0) {
        reason = 'Suggested for you';
      } else {
        const randomName = ['art_daily', 'dev_team', 'photo_lover', 'tech_insider'][Math.floor(Math.random() * 4)];
        reason = `Followed by ${randomName} + ${Math.floor(Math.random() * 5) + 1} more`;
      }

      return {
        id: user.id,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar || `https://picsum.photos/seed/suggestion-${user.id}/150/150`,
          isVerified: user.isVerified || false,
        },
        reason,
      };
    });

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
