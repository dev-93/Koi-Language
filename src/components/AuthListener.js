'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import useStore from '@/store';

export default function AuthListener() {
    const setAuth = useStore((state) => state.setAuth);

    useEffect(() => {
        // 앱 진입 시 초기 세션 확인
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuth(session);
        });

        // 세션 변경 시 리스너 등록
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setAuth(session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [setAuth]);

    return null;
}
