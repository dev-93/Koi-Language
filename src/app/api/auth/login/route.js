import { NextResponse } from 'next/server';
import { login as setSession } from '@/lib/auth';
import { findUserByEmail, hashPassword } from '@/lib/user';

/**
 * 로그인 처리 API
 * 이메일과 비밀번호를 검증하여 세션을 발급합니다.
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: '이메일과 비밀번호를 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        // DB에서 사용자 조회
        const user = await findUserByEmail(email);

        if (!user) {
            return NextResponse.json(
                { success: false, message: '등록되지 않은 이메일입니다.' },
                { status: 401 }
            );
        }

        // 비밀번호 검증 (해싱된 값 비교)
        const hashedPassword = hashPassword(password);
        if (user.password !== hashedPassword) {
            return NextResponse.json(
                { success: false, message: '비밀번호가 일치하지 않습니다.' },
                { status: 401 }
            );
        }

        // 세션 발급을 위한 사용자 데이터 구성 (보안상 비밀번호 제외)
        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'user',
            nationality: user.nationality,
            userGender: user.userGender,
            targetGender: user.targetGender
        };

        await setSession(userData);

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
