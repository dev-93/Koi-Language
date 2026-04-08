'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight, ArrowLeft, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 온보딩 뷰 컴포넌트
 * 사용자 국적 및 초기 설정을 도와주는 프리미엄 인터페이스
 */
const OnboardingView = () => {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ nationality: 'KR' });
    const [isUpdate, setIsUpdate] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // 하이드레이션 에러 방지 및 초기 데이터 로드 (SSR 대응)
    // requestAnimationFrame을 사용하여 동기적 setState로 인한 cascading render 경고 방지
    useEffect(() => {
        const rafId = requestAnimationFrame(() => {
            setIsMounted(true);
            const savedNationality = localStorage.getItem('user_nationality');
            const onboardingComplete = localStorage.getItem('onboarding_complete');

            if (savedNationality) {
                setFormData({ nationality: savedNationality });
            }
            if (onboardingComplete === 'true') {
                setIsUpdate(true);
            }
        });

        return () => cancelAnimationFrame(rafId);
    }, []);

    const handleNext = () => {
        if (step < 2) setStep(step + 1);
        else handleComplete();
    };

    const handlePrev = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleComplete = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('onboarding_complete', 'true');
            localStorage.setItem('user_nationality', formData.nationality);
        }
        router.push('/');
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
                    {[1, 2].map((s) => (
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
                        <div className="w-full d-flex flex-col gap-4 mt-12">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setFormData({ nationality: 'KR' })}
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
                                onClick={() => setFormData({ nationality: 'JP' })}
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
                    onClick={handleNext}
                    className="btn btn-primary u-rounded-full py-5 u-shadow-xl text-[18px] font-black d-flex items-center justify-center gap-3"
                >
                    <span>
                        {step === 2 ? (isUpdate ? '수정 완료' : '시작하기') : '다음 단계로'}
                    </span>
                    <ArrowRight size={22} strokeWidth={3} />
                </motion.button>
                <p className="m-0 text-center text-[12px] font-bold text-gray-300 mt-6 tracking-wide">
                    {step} / 2 PAGES
                </p>
            </div>
        </div>
    );
};

export default OnboardingView;
