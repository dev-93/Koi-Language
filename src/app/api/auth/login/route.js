import { NextResponse } from 'next/server';

/**
 * @deprecated Google OAuth (NextAuth.js)로 전환되었습니다.
 * 이 엔드포인트는 더 이상 사용되지 않습니다.
 * 새 인증 경로: /api/auth/signin (NextAuth.js)
 */
export async function POST() {
    return NextResponse.json(
        {
            success: false,
            message: '이 로그인 방식은 더 이상 지원되지 않습니다. Google 로그인을 사용해주세요.',
            redirect: '/onboarding',
        },
        { status: 410 } // 410 Gone
    );
}
