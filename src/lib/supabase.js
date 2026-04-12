import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * 클라이언트용 Supabase 인스턴스 (공개 키 사용)
 */
export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);

/**
 * 서버용 Supabase 인스턴스 (서비스 키 사용 - API Route에서만)
 */
export const supabaseAdmin = createClient(
    supabaseUrl || '',
    supabaseServiceKey || ''
);
