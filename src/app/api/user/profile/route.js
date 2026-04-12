import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * 사용자 프로필 업데이트 API (온보딩 정보 영속화)
 * NextAuth 세션 + Supabase 기반
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, message: '인증이 필요합니다.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { nationality, userGender, targetGender } = body;

        // Supabase profiles 테이블에 upsert
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .upsert(
                {
                    user_id: session.user.dbId,
                    nationality: nationality || 'KR',
                    user_gender: userGender || 'M',
                    target_gender: targetGender || 'F',
                    onboarding_complete: true,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
            )
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase profile upsert error:', error);
            return NextResponse.json(
                { success: false, message: '프로필 저장 실패: ' + error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                ...session.user,
                nationality,
                userGender,
                targetGender,
            },
            message: '프로필이 성공적으로 업데이트되었습니다.',
        });
    } catch (error) {
        console.error('Profile Update API Error:', error);
        return NextResponse.json(
            { success: false, message: '프로필 업데이트 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

/**
 * 사용자 프로필 조회 API
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, message: '인증이 필요합니다.' },
                { status: 401 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.dbId)
            .single();

        return NextResponse.json({
            success: true,
            profile: data || null,
        });
    } catch (error) {
        console.error('Profile GET API Error:', error);
        return NextResponse.json(
            { success: false, message: '프로필 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
