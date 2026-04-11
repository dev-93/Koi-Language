import { NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/user';
import { login as setSession } from '@/lib/auth';

/**
 * 회원가입 처리 API
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: '이메일과 비밀번호를 입력해주세요.' },
                { status: 400 }
            );
        }

        // 중복 가입 체크
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: '이미 가입된 이메일입니다.' },
                { status: 409 }
            );
        }

        // 사용자 생성
        const newUser = await createUser({ email, password, name });
        
        // 가입 즉시 로그인 처리
        const userData = {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: 'user'
        };
        await setSession(userData);

        return NextResponse.json({
            success: true,
            user: userData,
            message: '회원가입에 성공했습니다.'
        });
    } catch (error) {
        console.error('Register API Error:', error);
        return NextResponse.json(
            { success: false, message: '회원가입 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
