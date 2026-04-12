'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Heart, ArrowRight, ArrowLeft, Globe, User, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 온보딩 뷰 컴포넌트
 * Google 로그인 + 국적/프로필 설정 프리미엄 인터페이스
 */
const OnboardingView = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        nationality: 'KR',
        user_gender: 'M',
        target_gender: 'F',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdate, setIsUpdate] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const isLoggedIn = status === 'authenticated';

    useEffect(() => {
        const rafId = requestAnimationFrame(() => {
            setIsMounted(true);

            // 세션이 있고 프로필 정보가 있으면 업데이트 모드
            if (session?.user?.profile) {
                const profile = session.user.profile;
                setFormData({
                    nationality: profile.nationality || 'KR',
                    user_gender: profile.user_gender || 'M',
                    target_gender: profile.target_gender || 'F',
                });
                setIsUpdate(true);
            }

            // localStorage 폴백
            const savedNationality = localStorage.getItem('user_nationality');
            const savedUserGender = localStorage.getItem('user_gender');
            const savedTargetGender = localStorage.getItem('target_gender');
            const onboardingComplete = localStorage.getItem('onboarding_complete');

            if (!session?.user?.profile && (savedNationality || savedUserGender || savedTargetGender)) {
                setFormData(prev => ({
                    ...prev,
                    nationality: savedNationality || 'KR',
                    user_gender: savedUserGender || 'M',
                    target_gender: savedTargetGender || 'F',
                }));
            }
            if (onboardingComplete === 'true') {
                setIsUpdate(true);
            }
        });

        return () => cancelAnimationFrame(rafId);
    }, [session]);

    // 로그인 성공 시 자동으로 Step 2로 이동
    useEffect(() => {
        if (isLoggedIn && step === 1) {
            setStep(2);
        }
    }, [isLoggedIn, step]);

    const handleNext = () => {
        if (step === 1 && !isLoggedIn) {
            return; // 로그인 필요
        }
        if (step < 3) setStep(step + 1);
        else handleComplete();
    };

    const handlePrev = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleGoogleLogin = () => {
        signIn('google', { callbackUrl: '/onboarding' });
    };

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            // Supabase에 프로필 정보 영속화
            const response = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nationality: formData.nationality,
                    userGender: formData.user_gender,
                    targetGender: formData.target_gender,
                }),
            });

            const data = await response.json();

            if (data.success) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('onboarding_complete', 'true');
                    localStorage.setItem('user_nationality', formData.nationality);
                    localStorage.setItem('user_gender', formData.user_gender);
                    localStorage.setItem('target_gender', formData.target_gender);
                }
                router.push('/');
            } else {
                alert('프로필 저장에 실패했습니다: ' + data.message);
            }
        } catch (error) {
            console.error('Complete error:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        {
            id: 1,
            title: '반가워요! 🧡',
            desc: 'Koi Language와 함께\n설레는 대화를 시작해볼까요?',
            icon: <LogIn size={48} className="text-peach" />,
        },
        {
            id: 2,
            title: '당신의 국적은 어디인가요? 🗼',
            desc: '맞춤형 학습 콘텐츠를 위해\n국적을 선택해 주세요.',
            icon: <Globe size={48} className="text-peach" />,
        },
        {
            id: 3,
            title: '프로필을 완성해주세요 👤',
            desc: '더 정확한 대화 추천을 위해\n성별 설정을 도와드릴게요.',
            icon: <User size={48} className="text-peach" />,
        },
    ];

    const currentStep = steps[step - 1];

    if (!isMounted) return null;

    return (
        <div className="home-layout justify-between pt-20 pb-16 bg-white overflow-hidden relative">
            <div className="absolute top-[-100px] left-[-100px] w-64 h-64 u-rounded-full bg-peach/5 -z-10 blur-3xl" />
            <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 u-rounded-full bg-peach/10 -z-10 blur-3xl" />

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

                    {step === 1 && (
                        <div className="w-full d-flex flex-col gap-4 mt-8">
                            {isLoggedIn ? (
                                <div className="p-6 bg-peach/10 u-rounded-3xl border border-peach/20">
                                    <div className="d-flex items-center gap-3 justify-center">
                                        {session?.user?.image && (
                                            <img
                                                src={session.user.image}
                                                alt="프로필"
                                                className="w-10 h-10 u-rounded-full"
                                                style={{ width: 40, height: 40, borderRadius: '50%' }}
                                            />
                                        )}
                                        <div>
                                            <p className="m-0 text-peach font-black text-[18px]">
                                                {session?.user?.name || '사용자'}님, 환영해요! ✨
                                            </p>
                                            <p className="m-0 text-gray-400 text-[13px] mt-1">
                                                {session?.user?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full d-flex flex-col gap-4">
                                    {/* 구글 로그인 버튼 */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleGoogleLogin}
                                        disabled={status === 'loading'}
                                        className="btn u-rounded-2xl py-4 font-black text-[16px] u-shadow-lg d-flex justify-center items-center gap-3 border-none cursor-pointer"
                                        style={{
                                            background: 'white',
                                            color: '#333',
                                            border: '2px solid #e5e7eb',
                                            width: '100%',
                                            padding: '16px',
                                            borderRadius: '16px',
                                            fontSize: '16px',
                                            fontWeight: 800,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '12px',
                                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                        </svg>
                                        {status === 'loading' ? '로딩 중...' : 'Google로 시작하기'}
                                    </motion.button>

                                    <p className="m-0 text-gray-300 text-[12px] text-center mt-2">
                                        간편하게 구글 계정으로 로그인하세요
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
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

                    {step === 3 && (
                        <div className="w-full d-flex flex-col gap-8 mt-10">
                            <div className="w-full">
                                <p className="text-left text-[14px] font-black text-gray-400 mb-4 ml-2">
                                    본인의 성별
                                </p>
                                <div className="d-flex gap-4">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() =>
                                            setFormData({ ...formData, user_gender: 'M' })
                                        }
                                        className={`onboarding-gender-card d-flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                            formData.user_gender === 'M' ? 'active' : 'inactive'
                                        }`}
                                    >
                                        <span className="text-[32px]">🙋‍♂️</span>
                                        <span>남성</span>
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() =>
                                            setFormData({ ...formData, user_gender: 'F' })
                                        }
                                        className={`onboarding-gender-card d-flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                            formData.user_gender === 'F' ? 'active' : 'inactive'
                                        }`}
                                    >
                                        <span className="text-[32px]">🙋‍♀️</span>
                                        <span>여성</span>
                                    </motion.button>
                                </div>
                            </div>

                            <div className="w-full">
                                <p className="text-left text-[14px] font-black text-gray-400 mb-4 ml-2">
                                    대화 상대방의 성별
                                </p>
                                <div className="d-flex gap-4">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() =>
                                            setFormData({ ...formData, target_gender: 'M' })
                                        }
                                        className={`onboarding-gender-card d-flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                            formData.target_gender === 'M' ? 'active' : 'inactive'
                                        }`}
                                    >
                                        <span className="text-[32px]">👨</span>
                                        <span>남성</span>
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() =>
                                            setFormData({ ...formData, target_gender: 'F' })
                                        }
                                        className={`onboarding-gender-card d-flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                            formData.target_gender === 'F' ? 'active' : 'inactive'
                                        }`}
                                    >
                                        <span className="text-[32px]">👩</span>
                                        <span>여성</span>
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <div className="w-full max-w-[420px] px-8 pb-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    disabled={step === 1 && !isLoggedIn}
                    className={`btn u-rounded-full py-5 u-shadow-xl text-[18px] font-black d-flex items-center justify-center gap-3 ${
                        step === 1 && !isLoggedIn
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'btn-primary'
                    }`}
                >
                    <span>
                        {step === 3 ? (isUpdate ? '수정 완료' : '시작하기') : '다음 단계로'}
                    </span>
                    <ArrowRight size={22} strokeWidth={3} />
                </motion.button>
                <p className="m-0 text-center text-[12px] font-bold text-gray-300 mt-6 tracking-wide">
                    {step} / 3 PAGES
                </p>
            </div>
        </div>
    );
};

export default OnboardingView;
