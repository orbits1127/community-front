import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 샘플 이미지 URL들 (Unsplash)
const sampleImages = {
  avatars: [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
  ],
  posts: [
    'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=600&fit=crop',
  ],
  stories: [
    'https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1?w=400&h=700&fit=crop',
    'https://images.unsplash.com/photo-1682695797221-8164ff1fafc9?w=400&h=700&fit=crop',
    'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=400&h=700&fit=crop',
    'https://images.unsplash.com/photo-1682686581580-d99b0a1f0c9b?w=400&h=700&fit=crop',
    'https://images.unsplash.com/photo-1682686581362-7c13e3a62c3d?w=400&h=700&fit=crop',
    'https://images.unsplash.com/photo-1682695796497-31a44224d6d6?w=400&h=700&fit=crop',
    'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=400&h=700&fit=crop',
    'https://images.unsplash.com/photo-1682695794947-17061dc284dd?w=400&h=700&fit=crop',
  ],
};

// 샘플 캡션들
const captions = [
  '오늘도 좋은 하루! ☀️',
  '여행 중... 🌴',
  '맛있는 저녁 🍝',
  '새로운 시작 ✨',
  '일상의 소중함',
  '커피 한 잔의 여유 ☕',
  '운동 완료 💪',
  '주말 바이브 🎉',
  '자연 속에서 힐링 🌿',
  '행복한 순간들 💕',
  '오늘의 OOTD 👗',
  '집밥이 최고 🏠',
  '산책하기 좋은 날씨 🚶',
  '새로운 도전 🎯',
  '감사한 하루 🙏',
];

// 샘플 댓글들
const commentTexts = [
  '너무 예쁘다! 😍',
  '좋아요!',
  '우와 부럽다 ㅠㅠ',
  '나도 가고 싶어!',
  '멋있어요 👍',
  '분위기 좋다!',
  '맛있겠다 🤤',
  '어디야??',
  '대박!',
  '최고 ❤️',
];

async function main() {
  console.log('🌱 시드 데이터 생성 시작...');

  // 기존 데이터 삭제 (순서 중요 - 외래 키 관계 고려)
  console.log('🗑️ 기존 데이터 삭제 중...');
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.highlightStory.deleteMany();
  await prisma.highlight.deleteMany();
  await prisma.storyView.deleteMany();
  await prisma.story.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.commentLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  // 비밀번호 해시
  const hashedPassword = await bcrypt.hash('test', 10);

  // ============================================================================
  // 1. 사용자 생성
  // ============================================================================
  console.log('👤 사용자 생성 중...');

  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      username: 'test',
      password: hashedPassword,
      fullName: '테스트 유저',
      avatar: sampleImages.avatars[0],
      bio: '안녕하세요! 테스트 계정입니다. 🎉',
      website: 'https://example.com',
      isVerified: true,
    },
  });

  const friends = await Promise.all([
    prisma.user.create({
      data: {
        email: 'minjae@example.com',
        username: 'minjae_kim',
        password: hashedPassword,
        fullName: '김민재',
        avatar: sampleImages.avatars[1],
        bio: '여행을 사랑하는 사진작가 📸✈️',
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'soyeon@example.com',
        username: 'soyeon_park',
        password: hashedPassword,
        fullName: '박소연',
        avatar: sampleImages.avatars[2],
        bio: '일상을 기록합니다 📝',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jihoon@example.com',
        username: 'jihoon_lee',
        password: hashedPassword,
        fullName: '이지훈',
        avatar: sampleImages.avatars[3],
        bio: '헬스 & 라이프스타일 💪',
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'yuna@example.com',
        username: 'yuna_choi',
        password: hashedPassword,
        fullName: '최유나',
        avatar: sampleImages.avatars[4],
        bio: '푸드 블로거 🍜 맛집 탐방 중',
      },
    }),
    prisma.user.create({
      data: {
        email: 'hyunwoo@example.com',
        username: 'hyunwoo_jung',
        password: hashedPassword,
        fullName: '정현우',
        avatar: sampleImages.avatars[5],
        bio: '개발자 👨‍💻 | 커피 애호가 ☕',
      },
    }),
  ]);

  console.log(`✅ ${friends.length + 1}명의 사용자 생성 완료`);

  // ============================================================================
  // 2. 팔로우 관계 생성
  // ============================================================================
  console.log('🤝 팔로우 관계 생성 중...');

  // test가 모든 친구를 팔로우
  for (const friend of friends) {
    await prisma.follow.create({
      data: {
        followerId: testUser.id,
        followingId: friend.id,
      },
    });
  }

  // 일부 친구들이 test를 팔로우백
  await prisma.follow.create({
    data: { followerId: friends[0].id, followingId: testUser.id },
  });
  await prisma.follow.create({
    data: { followerId: friends[1].id, followingId: testUser.id },
  });
  await prisma.follow.create({
    data: { followerId: friends[3].id, followingId: testUser.id },
  });

  // 친구들끼리 팔로우
  await prisma.follow.create({
    data: { followerId: friends[0].id, followingId: friends[1].id },
  });
  await prisma.follow.create({
    data: { followerId: friends[2].id, followingId: friends[0].id },
  });
  await prisma.follow.create({
    data: { followerId: friends[3].id, followingId: friends[4].id },
  });

  console.log('✅ 팔로우 관계 생성 완료');

  // ============================================================================
  // 3. 게시물 생성
  // ============================================================================
  console.log('📷 게시물 생성 중...');

  const posts: any[] = [];
  let postImageIndex = 0;
  let captionIndex = 0;

  for (const friend of friends) {
    // 각 친구당 3개의 게시물
    for (let i = 0; i < 3; i++) {
      const post = await prisma.post.create({
        data: {
          userId: friend.id,
          imageUrl: sampleImages.posts[postImageIndex % sampleImages.posts.length],
          caption: captions[captionIndex % captions.length],
          location: ['서울', '부산', '제주도', '강릉', '경주'][Math.floor(Math.random() * 5)],
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // 최근 7일 내
        },
      });
      posts.push(post);
      postImageIndex++;
      captionIndex++;
    }
  }

  console.log(`✅ ${posts.length}개의 게시물 생성 완료`);

  // ============================================================================
  // 4. 스토리 생성 (24시간 유효)
  // ============================================================================
  console.log('📱 스토리 생성 중...');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24시간 후

  let storyImageIndex = 0;
  for (const friend of friends) {
    // 각 친구당 1~2개의 스토리
    const storyCount = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < storyCount; i++) {
      await prisma.story.create({
        data: {
          userId: friend.id,
          imageUrl: sampleImages.stories[storyImageIndex % sampleImages.stories.length],
          createdAt: new Date(now.getTime() - Math.random() * 12 * 60 * 60 * 1000), // 최근 12시간 내
          expiresAt: expiresAt,
        },
      });
      storyImageIndex++;
    }
  }

  console.log('✅ 스토리 생성 완료');

  // ============================================================================
  // 5. 좋아요 생성
  // ============================================================================
  console.log('❤️ 좋아요 생성 중...');

  for (const post of posts) {
    // test 유저가 일부 게시물에 좋아요
    if (Math.random() > 0.3) {
      await prisma.like.create({
        data: {
          postId: post.id,
          userId: testUser.id,
        },
      });
    }

    // 친구들도 서로 좋아요
    for (const friend of friends) {
      if (friend.id !== post.userId && Math.random() > 0.5) {
        await prisma.like.create({
          data: {
            postId: post.id,
            userId: friend.id,
          },
        });
      }
    }
  }

  console.log('✅ 좋아요 생성 완료');

  // ============================================================================
  // 6. 댓글 생성
  // ============================================================================
  console.log('💬 댓글 생성 중...');

  let commentTextIndex = 0;
  for (const post of posts) {
    // 각 게시물에 1~3개의 댓글
    const commentCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < commentCount; i++) {
      const commenter = Math.random() > 0.5 
        ? testUser 
        : friends[Math.floor(Math.random() * friends.length)];
      
      if (commenter.id !== post.userId) {
        await prisma.comment.create({
          data: {
            postId: post.id,
            userId: commenter.id,
            content: commentTexts[commentTextIndex % commentTexts.length],
            createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          },
        });
        commentTextIndex++;
      }
    }
  }

  console.log('✅ 댓글 생성 완료');

  // ============================================================================
  // 7. 알림 생성
  // ============================================================================
  console.log('🔔 알림 생성 중...');

  // 팔로우 알림
  for (let i = 0; i < 3; i++) {
    await prisma.notification.create({
      data: {
        type: 'follow',
        actorId: friends[i].id,
        recipientId: testUser.id,
        message: `${friends[i].fullName}님이 회원님을 팔로우하기 시작했습니다.`,
        createdAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000),
      },
    });
  }

  // 좋아요 알림
  for (let i = 0; i < 5; i++) {
    const randomFriend = friends[Math.floor(Math.random() * friends.length)];
    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    await prisma.notification.create({
      data: {
        type: 'like',
        actorId: randomFriend.id,
        recipientId: testUser.id,
        postId: randomPost.id,
        message: `${randomFriend.fullName}님이 회원님의 게시물을 좋아합니다.`,
        createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      },
    });
  }

  // 댓글 알림
  for (let i = 0; i < 3; i++) {
    const randomFriend = friends[Math.floor(Math.random() * friends.length)];
    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    await prisma.notification.create({
      data: {
        type: 'comment',
        actorId: randomFriend.id,
        recipientId: testUser.id,
        postId: randomPost.id,
        message: `${randomFriend.fullName}님이 댓글을 남겼습니다: "${commentTexts[i]}"`,
        createdAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000),
      },
    });
  }

  console.log('✅ 알림 생성 완료');

  // ============================================================================
  // 8. DM 대화 생성
  // ============================================================================
  console.log('✉️ DM 대화 생성 중...');

  // test와 첫 번째 친구의 대화
  const conversation1 = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: testUser.id },
          { userId: friends[0].id },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation1.id,
        senderId: friends[0].id,
        receiverId: testUser.id,
        content: '안녕! 오랜만이야 😊',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        conversationId: conversation1.id,
        senderId: testUser.id,
        receiverId: friends[0].id,
        content: '오 안녕! 잘 지내지?',
        createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      },
      {
        conversationId: conversation1.id,
        senderId: friends[0].id,
        receiverId: testUser.id,
        content: '응 잘 지내! 요즘 뭐해?',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        conversationId: conversation1.id,
        senderId: testUser.id,
        receiverId: friends[0].id,
        content: '그냥 열심히 일하고 있어 ㅋㅋ',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ],
  });

  // test와 세 번째 친구의 대화
  const conversation2 = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: testUser.id },
          { userId: friends[2].id },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation2.id,
        senderId: friends[2].id,
        receiverId: testUser.id,
        content: '내일 운동 같이 할래?',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        conversationId: conversation2.id,
        senderId: testUser.id,
        receiverId: friends[2].id,
        content: '좋아! 몇 시에?',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        conversationId: conversation2.id,
        senderId: friends[2].id,
        receiverId: testUser.id,
        content: '저녁 7시 어때?',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ DM 대화 생성 완료');

  // ============================================================================
  // 9. 하이라이트 생성
  // ============================================================================
  console.log('⭐ 하이라이트 생성 중...');

  // 첫 번째 친구의 하이라이트
  const stories = await prisma.story.findMany({
    where: { userId: friends[0].id },
  });

  if (stories.length > 0) {
    const highlight = await prisma.highlight.create({
      data: {
        userId: friends[0].id,
        name: '여행 🌴',
        coverImage: stories[0].imageUrl,
      },
    });

    for (const story of stories) {
      await prisma.highlightStory.create({
        data: {
          highlightId: highlight.id,
          storyId: story.id,
        },
      });
    }
  }

  console.log('✅ 하이라이트 생성 완료');

  // ============================================================================
  // 완료 메시지
  // ============================================================================
  console.log('\n🎉 시드 데이터 생성 완료!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 테스트 계정 정보:');
  console.log('   아이디: test');
  console.log('   비밀번호: test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👥 친구 계정: ${friends.map(f => f.username).join(', ')}`);
  console.log(`📷 게시물: ${posts.length}개`);
  console.log('📱 스토리: 활성화됨 (24시간 유효)');
  console.log('💬 댓글 & 좋아요: 생성됨');
  console.log('🔔 알림: 생성됨');
  console.log('✉️ DM 대화: 2개');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
