import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * NextAuth.js 설정
 * - Google OAuth 로그인
 * - Supabase PostgreSQL에 유저 데이터 저장
 */
export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        /**
         * 로그인 성공 시 - Supabase에 유저 upsert
         */
        async signIn({ user, account, profile }) {
            try {
                const { data, error } = await supabaseAdmin
                    .from('users')
                    .upsert(
                        {
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            provider: account.provider,
                            provider_account_id: account.providerAccountId,
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: 'email' }
                    )
                    .select()
                    .single();

                if (error) {
                    console.error('❌ Supabase upsert error:', error);
                    return false;
                }

                // user 객체에 DB의 UUID를 첨부
                user.dbId = data.id;
                return true;
            } catch (err) {
                console.error('❌ signIn callback error:', err);
                return false;
            }
        },

        /**
         * JWT에 DB의 유저 ID를 포함
         */
        async jwt({ token, user }) {
            if (user?.dbId) {
                token.dbId = user.dbId;
            }
            // 최초 로그인 시 DB에서 프로필 정보 가져오기
            if (user?.email && !token.profile) {
                const { data } = await supabaseAdmin
                    .from('profiles')
                    .select('*')
                    .eq('user_id', token.dbId || user.dbId)
                    .single();

                token.profile = data || null;
            }
            return token;
        },

        /**
         * 세션에 유저 정보 포함
         */
        async session({ session, token }) {
            session.user.dbId = token.dbId;
            session.user.profile = token.profile;
            return session;
        },
    },
    pages: {
        signIn: '/onboarding', // 커스텀 로그인 페이지
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30일
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
