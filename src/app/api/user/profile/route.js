import { NextResponse } from 'next/server';
import { getSession, login as setSession } from '@/lib/auth';
import { updateUserProfile } from '@/lib/user';

/**
 * 사용자 프로필 업데이트 API (온보딩 정보 영속화)
 */
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { nationality, userGender, targetGender } = body;

        // Notion DB 업데이트
        await updateUserProfile(session.user.id, {
            nationality,
            userGender,
            targetGender
        });

        // 세션 정보도 업데이트
        const updatedUser = {
            ...session.user,
            nationality,
            userGender,
            targetGender
        };
        await setSession(updatedUser);

        return NextResponse.json({
            success: true,
            user: updatedUser,
            message: '프로필이 성공적으로 업데이트되었습니다.'
        });
    } catch (error) {
        console.error('Profile Update API Error:', error);
        return NextResponse.json(
            { success: false, message: '프로필 업데이트 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
