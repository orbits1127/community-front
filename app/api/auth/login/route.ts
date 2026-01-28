import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username: usernameParam, password } = body;
    const loginId = usernameParam ?? email;

    if (!loginId || !password) {
      return NextResponse.json(
        { success: false, error: '아이디와 비밀번호를 입력해 주세요.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginId },
          { username: loginId },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '해당 아이디(또는 이메일)가 데이터베이스에 없습니다.' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
