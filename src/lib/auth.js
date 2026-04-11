import { cookies } from 'next/headers';
import { encrypt, decrypt } from './crypto';

export async function login(userData) {
    // 세션 만료 시간 설정 (2시간)
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const session = await encrypt({ user: userData, expires });

    // 쿠키에 세션 저장
    const cookieStore = await cookies();
    cookieStore.set('session', session, { expires, httpOnly: true, path: '/' });
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.set('session', '', { expires: new Date(0), path: '/' });
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;
    return await decrypt(session);
}
