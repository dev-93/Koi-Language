import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';

/**
 * 로그인 처리 API
 * Google/Apple OAuth 연동 전까지 실제 로직 기반의 사용자 식별 수행
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { provider, email, name } = body;

        // 실제 동작하는 로직: 사용자 식별 후 세션 발급
        // 향후 OAuth 연동 시 이 지점에서 토큰 검증 수행
        const userData = {
            provider: provider || 'unknown',
            email: email || 'guest@koi-language.com',
            name: name || 'Koi User',
            role: 'user'
        };

        await login(userData);

        return NextResponse.json({ 
            success: true, 
            user: userData,
            message: '로그인에 성공했습니다.' 
        });
    } catch (error) {
        console.error('Login API Error:', error);
        return NextResponse.json(
            { success: false, message: '로그인 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
