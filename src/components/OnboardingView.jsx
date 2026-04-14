'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight, ArrowLeft, Globe, Mail, Lock, Loader2, LogIn, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import useStore from '@/store';

/**
 * 온보딩 뷰 컴포넌트
 * 사용자 인증, 국적 및 초기 설정을 도와주는 프리미엄 인터페이스
 */
const OnboardingView = () => {
    const router = useRouter();
    const { user, setUserProfile } = useStore();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ 
        nationality: 'KR',
        email: '',
        password: '',
    });
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isUpdate, setIsUpdate] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // 하이드레이션 에러 방지 및 초기 데이터 로드 (SSR 대응)
    useEffect(() => {
        const rafId = requestAnimationFrame(() => {
            setIsMounted(true);
            const savedNationality = localStorage.getItem('user_nationality');
            const onboardingComplete = localStorage.getItem('onboarding_complete');

            if (savedNationality) {
                setFormData(prev => ({ ...prev, nationality: savedNationality }));
            }
            if (onboardingComplete === 'true') {
                setIsUpdate(true);
            }
        });

        return () => cancelAnimationFrame(rafId);
    }, []);

    // 로그인된 상태에서 2단계에 진입하면 자동으로 3단계로 이동
    useEffect(() => {
        if (user && step === 2) {
            setStep(3);
        }
    }, [user, step]);

    const handleNext = async () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            if (user) {
                setStep(3);
            } else {
                await handleAuth();
            }
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleAuth = async () => {
        if (!formData.email || !formData.password) {
            setErrorMessage('이메일과 비밀번호를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            if (authMode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            nationality: formData.nationality,
                        }
                    }
                });
                if (error) throw error;
                setErrorMessage('인증 이메일을 확인해주세요! (로그인 시도 가능)');
                setAuthMode('login');
                setIsLoading(false);
                return;
            }
            // 로그인 성공 시 useEffect에 의해 step 3로 이동함
        } catch (error) {
            setErrorMessage(error.message || '인증 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/onboarding` : undefined,
                }
            });
            if (error) throw error;
        } catch (error) {
            setErrorMessage(error.message || 'Google 로그인 중 오류가 발생했습니다.');
            setIsLoading(false);
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('onboarding_complete', 'true');
                localStorage.setItem('user_nationality', formData.nationality);
            }
            
            // 로그인 상태라면 Supabase user_metadata에도 저장 (기기 간 동기화)
            if (user) {
                const { updateUserProfile } = useStore.getState();
                await updateUserProfile({ nationality: formData.nationality });
            } else {
                setUserProfile({ 
                    ...useStore.getState().userProfile, 
                    myNationality: formData.nationality 
                });
            }
            
            router.push('/');
        } catch (error) {
            setErrorMessage('설정 저장 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        {
            id: 1,
            title: '사랑에 국경이 있나요? 🧡',
            desc: 'Koi Language가 일본인 연인과의\n달콤한 대화를 도와드릴게요.',
            icon: <Heart fill="#d4537e" size={48} className="text-peach" />,
        },
        {
            id: 2,
            title: authMode === 'login' ? '다시 만나서 반가워요! 👋' : '새로운 시작을 축하해요! ✨',
            desc: authMode === 'login' ? '로그인하여 학습 내역을 동기화하세요.' : '계정을 만들고 일본어 공부를 시작해보세요.',
            icon: authMode === 'login' ? <LogIn size={48} className="text-peach" /> : <UserPlus size={48} className="text-peach" />,
        },
        {
            id: 3,
            title: '당신의 국적은 어디인가요? 🗼',
            desc: '맞춤형 학습 콘텐츠를 위해\n국적을 선택해 주세요.',
            icon: <Globe size={48} className="text-peach" />,
        },
    ];

    const currentStep = steps[step - 1];

    if (!isMounted) return null;

    return (
        <div className="home-layout justify-between pt-20 pb-16 bg-white overflow-hidden relative">
            {/* 배경 데코레이션 요소 */}
            <div className="absolute top-[-100px] left-[-100px] w-64 h-64 u-rounded-full bg-peach/5 -z-10 blur-3xl" />
            <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 u-rounded-full bg-peach/10 -z-10 blur-3xl" />

            {/* 헤더: 뒤로가기 및 단계 인디케이터 */}
            <div className="w-full max-w-[420px] px-6 d-flex justify-between items-center mb-8">
                {step > 1 ? (
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={handlePrev}
                        className="p-3 u-rounded-full hover:bg-gray-50 border-none bg-transparent cursor-pointer text-gray-400"
                    >
                        <ArrowLeft size={24} />
                    </motion.button>
                ) : (
                    <div className="w-12 h-12" />
                )}
                <div className="d-flex gap-2 items-center">
                    {[1, 2, 3].map((s) => (
                        <motion.div
                            key={s}
                            initial={false}
                            animate={{
                                width: s === step ? 40 : 10,
                                backgroundColor: s === step ? '#d4537e' : '#e5e7eb',
                            }}
                            className="h-2 u-rounded-full transition-all duration-300"
                        />
                    ))}
                </div>
                <div className="w-12 h-12" />
            </div>

            {/* 메인 단계 영역 */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    className="flex-1 w-full max-w-[420px] px-8 d-flex flex-col items-center justify-center text-center"
                >
                    <div className="onboarding-logo-box d-flex items-center justify-center mb-10 u-shadow-xl scale-110">
                        {currentStep.icon}
                    </div>
                    <h1 className="m-0 text-[32px] font-black text-gray-800 leading-tight mb-4 tracking-tight whitespace-pre-line">
                        {currentStep.title}
                    </h1>
                    <p className="m-0 text-[16px] font-bold text-gray-400 leading-relaxed whitespace-pre-line">
                        {currentStep.desc}
                    </p>

                    {step === 2 && (
                        <div className="w-full mt-10 space-y-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full bg-white border-2 border-gray-100 u-rounded-2xl py-4 d-flex items-center justify-center gap-3 font-black text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors mb-6 shadow-sm"
                            >
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                <span>Google로 시작하기</span>
                            </motion.button>

                            <div className="relative d-flex items-center justify-center my-6">
                                <div className="absolute w-full h-[1px] bg-gray-100" />
                                <span className="relative bg-white px-4 text-xs font-bold text-gray-300">또는 이메일로 계속하기</span>
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input 
                                    type="email" 
                                    placeholder="이메일 주소"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-gray-50 border-2 border-gray-100 u-rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-600 focus:outline-none focus:border-peach transition-colors"
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input 
                                    type="password" 
                                    placeholder="비밀번호"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-gray-50 border-2 border-gray-100 u-rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-600 focus:outline-none focus:border-peach transition-colors"
                                />
                            </div>
                            {errorMessage && (
                                <p className="text-red-500 text-sm font-bold mt-2">{errorMessage}</p>
                            )}
                            <button 
                                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                                className="text-peach font-black text-sm hover:underline bg-transparent border-none cursor-pointer mt-2"
                            >
                                {authMode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="w-full d-flex flex-col gap-4 mt-12">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setFormData({ ...formData, nationality: 'KR' })}
                                className={`onboarding-btn-option border-none cursor-pointer d-flex items-center justify-center gap-3 transition-colors ${
                                    formData.nationality === 'KR'
                                        ? 'bg-peach text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-400'
                                }`}
                            >
                                <span className="text-[20px]">🇰🇷</span> 한국인입니다
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setFormData({ ...formData, nationality: 'JP' })}
                                className={`onboarding-btn-option border-none cursor-pointer d-flex items-center justify-center gap-3 transition-colors ${
                                    formData.nationality === 'JP'
                                        ? 'bg-peach text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-400'
                                }`}
                            >
                                <span className="text-[20px]">🇯🇵</span> 日本人입니다
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* 하단 푸터 버튼 영역 */}
            <div className="w-full max-w-[420px] px-8 pb-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    onClick={handleNext}
                    className="btn btn-primary w-full u-rounded-full py-5 u-shadow-xl text-[18px] font-black d-flex items-center justify-center gap-3 disabled:opacity-70"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={22} />
                    ) : (
                        <>
                            <span>
                                {step === 3 ? (isUpdate ? '수정 완료' : '시작하기') : '다음 단계로'}
                            </span>
                            <ArrowRight size={22} strokeWidth={3} />
                        </>
                    )}
                </motion.button>
                <p className="m-0 text-center text-[12px] font-bold text-gray-300 mt-6 tracking-wide uppercase">
                    {step} / 3 PAGES
                </p>
            </div>
        </div>
    );
};

export default OnboardingView;

