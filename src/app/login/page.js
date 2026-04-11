'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Mail, Lock, LogIn, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * [💖 Koi Language] 전용 로그인 및 회원가입 페이지
 * 온보딩 프로세스와 별개로 독립적인 인증 관문을 제공합니다.
 * 시니어 AI 시스템 아키텍트(biz-engineer) 가이드라인에 따라 Mockup이 아닌 실제 로직으로 구현되었습니다.
 */
export default function LoginPage() {
    const router = useRouter();
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                // 로그인 성공 시 홈으로 이동
                // 온보딩 완료 여부는 메인 페이지(HomeView)에서 세션 정보를 바탕으로 판단합니다.
                router.push('/');
                router.refresh();
            } else {
                setError(data.message || '인증에 실패했습니다. 정보를 다시 확인해주세요.');
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError('서버와 통신 중 예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="home-layout justify-center bg-white min-h-screen relative overflow-hidden flex flex-col items-center">
            {/* 배경 아트워크 (Peach 테마 블러 효과) */}
            <div className="absolute top-[-150px] left-[-150px] w-[400px] h-[400px] rounded-full bg-peach/10 blur-[100px] -z-10" />
            <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-peach/5 blur-[120px] -z-10" />

            <div className="w-full max-w-[420px] px-8 flex flex-col items-center py-12">
                {/* 상단 로고 및 슬로건 */}
                <motion.div 
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="mb-14 flex flex-col items-center text-center"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-peach/20 to-peach/5 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-peach/10 border border-white/50">
                        <Heart size={48} className="text-peach fill-peach/30" strokeWidth={2} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Koi Language</h1>
                    <p className="text-gray-400 font-bold text-lg leading-relaxed">
                        설레는 대화의 시작,<br />
                        지금 바로 로그인하세요.
                    </p>
                </motion.div>

                {/* 인증 모드 전환 탭 */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full"
                >
                    <div className="flex bg-gray-50 p-1.5 rounded-3xl mb-10 border border-gray-100/50">
                        <button 
                            onClick={() => setAuthMode('login')}
                            className={`flex-1 py-4 font-black text-[15px] rounded-[22px] transition-all duration-300 ${
                                authMode === 'login' 
                                ? 'bg-white text-peach shadow-md ring-1 ring-black/5' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            기존 회원
                        </button>
                        <button 
                            onClick={() => setAuthMode('register')}
                            className={`flex-1 py-4 font-black text-[15px] rounded-[22px] transition-all duration-300 ${
                                authMode === 'register' 
                                ? 'bg-white text-peach shadow-md ring-1 ring-black/5' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            신규 가입
                        </button>
                    </div>

                    {/* 입력 폼 */}
                    <form onSubmit={handleAuth} className="space-y-5">
                        <AnimatePresence mode="wait">
                            {authMode === 'register' && (
                                <motion.div 
                                    key="name-input"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="relative overflow-hidden"
                                >
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300">
                                        <LogIn size={20} strokeWidth={2.5} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="어떻게 불러드릴까요?"
                                        required
                                        className="w-full bg-gray-50 border border-transparent py-5 pl-16 pr-8 rounded-[24px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-peach/30 focus:ring-4 focus:ring-peach/5 transition-all outline-none text-base"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300">
                                <Mail size={20} strokeWidth={2.5} />
                            </span>
                            <input
                                type="email"
                                placeholder="이메일 주소"
                                required
                                className="w-full bg-gray-50 border border-transparent py-5 pl-16 pr-8 rounded-[24px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-peach/30 focus:ring-4 focus:ring-peach/5 transition-all outline-none text-base"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300">
                                <Lock size={20} strokeWidth={2.5} />
                            </span>
                            <input
                                type="password"
                                placeholder="비밀번호"
                                required
                                className="w-full bg-gray-50 border border-transparent py-5 pl-16 pr-8 rounded-[24px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-peach/30 focus:ring-4 focus:ring-peach/5 transition-all outline-none text-base"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        {/* 에러 메시지 */}
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-red-50 rounded-2xl border border-red-100"
                                >
                                    <p className="text-red-500 text-sm font-bold text-center">
                                        ⚠️ {error}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 제출 버튼 */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-peach hover:bg-[#c4486e] text-white py-6 rounded-[24px] font-black text-xl shadow-2xl shadow-peach/20 mt-8 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    <span>{authMode === 'login' ? '로그인하기' : '회원가입 완료'}</span>
                                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                {/* 하단 보조 안내 */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-16 flex flex-col items-center gap-6"
                >
                    <button 
                        onClick={() => router.push('/')}
                        className="text-gray-400 font-bold text-sm hover:text-peach transition-colors flex items-center gap-2 group border-none bg-transparent cursor-pointer"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                        메인으로 돌아가기
                    </button>
                    <div className="h-px w-8 bg-gray-100" />
                    <p className="text-gray-300 text-[11px] font-black tracking-[0.2em] uppercase">
                        Premium Language Education
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
