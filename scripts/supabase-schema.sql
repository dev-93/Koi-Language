-- ============================================
-- Koi Language - Supabase 테이블 생성 SQL
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================

-- 1. users 테이블 (인증된 사용자 정보)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    image TEXT,
    provider VARCHAR(50) DEFAULT 'google',
    provider_account_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. profiles 테이블 (Koi 서비스 전용 프로필)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nationality VARCHAR(2) DEFAULT 'KR',
    user_gender VARCHAR(1) DEFAULT 'M',
    target_gender VARCHAR(1) DEFAULT 'F',
    onboarding_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. learning_progress 테이블 (학습 이력 추적 - 향후 확장용)
CREATE TABLE IF NOT EXISTS learning_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    situation_id VARCHAR(255) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    score INTEGER DEFAULT 0
);

-- 인덱스 생성 (쿼리 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- 서비스 역할 키로만 접근 가능하도록 정책 설정
-- (Next.js API Route에서 supabaseAdmin으로만 접근)
CREATE POLICY "Service role access" ON users
    FOR ALL USING (true);
    
CREATE POLICY "Service role access" ON profiles
    FOR ALL USING (true);

CREATE POLICY "Service role access" ON learning_progress
    FOR ALL USING (true);
