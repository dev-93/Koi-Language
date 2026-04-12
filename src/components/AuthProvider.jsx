'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * NextAuth 세션 Provider 래퍼
 * layout.js에서 사용
 */
export default function AuthProvider({ children }) {
    return <SessionProvider>{children}</SessionProvider>;
}
