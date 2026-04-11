'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight, ArrowLeft, Globe, User, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 온보딩 뷰 컴포넌트
 * 사용자 로그인, 국적 및 프로필 설정을 도와주는 프리미엄 인터페이스
 */
const OnboardingView = () => {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [formData, setFormData] = useState({
        nationality: 'KR',
        user_gender: 'M',
        target_gender: 'F',
    });
    const [isUpdate, setIsUpdate] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const rafId = requestAnimationFrame(() => {
            setIsMounted(true);
            const savedNationality = localStorage.getItem('user_nationality');
            const savedUserGender = localStorage.getItem('user_gender');
            const savedTargetGender = localStorage.getItem('target_gender');
            const onboardingComplete = localStorage.getItem('onboarding_complete');

            if (savedNationality || savedUserGender || savedTargetGender) {
                setFormData({
                    nationality: savedNationality || 'KR',
                    user_gender: savedUserGender || 'M',
                    target_gender: savedTargetGender || 'F',
                });
            }
            if (onboardingComplete === 'true') {
                setIsUpdate(true);
                setIsLoggedIn(true);
            }
        });

        return () => cancelAnimationFrame(rafId);
    }, []);

    const handleNext = () => {
        if (step === 1 && !isLoggedIn) {
            alert('로그인이 필요합니다.');
            return;
        }
        if (step < 3) setStep(step + 1);
        else handleComplete();
    };

    const handlePrev = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleLogin = (provider) => {
        console.log(`${provider} login mock`);
        setIsLoggedIn(true);
        setStep(2);
    };

    const handleComplete = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('onboarding_complete', 'true');
            localStorage.setItem('user_nationality', formData.nationality);
            localStorage.setItem('user_gender', formData.user_gender);
            localStorage.setItem('target_gender', formData.target_gender);
        }
        router.push('/');
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
                        <div className="w-full d-flex flex-col gap-4 mt-12">
                            {isLoggedIn ? (
                                <div className="p-6 bg-peach/10 u-rounded-3xl border border-peach/20">
                                    <p className="m-0 text-peach font-black text-[18px]">
                                        로그인 되었습니다! ✨
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleLogin('Google')}
                                        className="onboarding-btn-option bg-white text-gray-700 border border-gray-200 cursor-pointer d-flex items-center justify-center gap-3"
                                    >
                                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="G" />
                                        Google로 계속하기
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleLogin('Apple')}
                                        className="onboarding-btn-option bg-black text-white border-none cursor-pointer d-flex items-center justify-center gap-3"
                                    >
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" width="20" alt="A" className="invert" />
                                        Apple로 계속하기
                                    </motion.button>
                                </>
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
                                <p className="text-left text-[14px] font-black text-gray-400 mb-4 ml-2">본인의 성별</p>
                                <div className="d-flex gap-4">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setFormData({ ...formData, user_gender: 'M' })}
                                        className={`onboarding-gender-card d-flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                            formData.user_gender === 'M' ? 'active' : 'inactive'
                                        }`}
                                    >
                                        <span className="text-[32px]">🙋‍♂️</span>
                                        <span>남성</span>
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setFormData({ ...formData, user_gender: 'F' })}
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
                                <p className="text-left text-[14px] font-black text-gray-400 mb-4 ml-2">대화 상대방의 성별</p>
                                <div className="d-flex gap-4">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setFormData({ ...formData, target_gender: 'M' })}
                                        className={`onboarding-gender-card d-flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                            formData.target_gender === 'M' ? 'active' : 'inactive'
                                        }`}
                                    >
                                        <span className="text-[32px]">👨</span>
                                        <span>남성</span>
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setFormData({ ...formData, target_gender: 'F' })}
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
                        step === 1 && !isLoggedIn ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'btn-primary'
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
