'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Heart, 
    ChevronRight, 
    ChevronLeft, 
    ArrowRight, 
    Globe, 
    ArrowLeft,
    HandHeart,
    Flame,
    Sparkles,
    User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingView() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        nationality: 'KR', // KR, JP
        gender: 'M' // M, F
    });
    const [isUpdate, setIsUpdate] = useState(false);

    // 기존 데이터 불러오기
    useEffect(() => {
        const nationality = localStorage.getItem('user_nationality');
        const gender = localStorage.getItem('user_gender');
        const complete = localStorage.getItem('onboarding_complete');

        if (nationality || gender) {
            setFormData({
                nationality: nationality || 'KR',
                gender: gender || 'M'
            });
        }
        if (complete === 'true') {
            setIsUpdate(true);
        }
    }, []);

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else handleComplete();
    };

    const handlePrev = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleComplete = () => {
        localStorage.setItem('onboarding_complete', 'true');
        localStorage.setItem('user_nationality', formData.nationality);
        localStorage.setItem('user_gender', formData.gender);
        router.push('/');
    };

    const steps = [
        {
            id: 1,
            title: "사랑에 국경이 있나요? 🧡",
            desc: "Koi Language가 일본인 연인과의\n달콤한 대화를 도와드릴게요.",
            icon: <Heart fill="#ff8a8a" size={48} className="text-peach" />
        },
        {
            id: 2,
            title: "당신의 국적은 어디인가요? 🗼",
            desc: "맞춤형 학습 콘텐츠를 위해\n국적을 선택해 주세요.",
            icon: <Globe size={48} className="text-peach" />
        },
        {
            id: 3,
            title: "거의 다 왔어요! ✨",
            desc: "성별에 맞는 자연스러운 말투로\n학습 환경을 설정해 드립니다.",
            icon: <User size={48} className="text-peach" fill="#ff8a8a" />
        }
    ];

    const currentStep = steps[step - 1];

    return (
        <div className="home-layout justify-between pt-20 pb-16 bg-white overflow-hidden relative">
            {/* Decoration Elements */}
            <div className="absolute top-[-100px] left-[-100px] w-64 h-64 u-rounded-full bg-peach/5 -z-10 blur-3xl" />
            <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 u-rounded-full bg-peach/10 -z-10 blur-3xl" />

            {/* Top Navigation Row */}
            <div className="w-full max-w-[420px] px-6 d-flex justify-between items-center mb-8">
                {step > 1 ? (
                    <button onClick={handlePrev} className="p-3 u-rounded-full hover:bg-gray-50 border-none bg-transparent cursor-pointer text-gray-400">
                        <ArrowLeft size={24} />
                    </button>
                ) : <div className="w-12 h-12" />}
                
                <div className="d-flex gap-2 items-center">
                    {[1, 2, 3].map((s) => (
                        <div 
                            key={s} 
                            className={`dot-indicator ${s === step ? 'dot-active' : 'dot-inactive'}`} 
                        />
                    ))}
                </div>
                
                <div className="w-12 h-12" />
            </div>

            {/* Content Area */}
            <div className="flex-1 w-full max-w-[420px] px-8 d-flex flex-col items-center justify-center text-center">
                <div className="onboarding-logo-box d-flex items-center justify-center mb-10 u-shadow-xl scale-110">
                    {currentStep.icon}
                </div>
                
                <h1 className="m-0 text-[32px] font-black text-gray-800 leading-tight mb-4 tracking-tight whitespace-pre-line">
                    {currentStep.title}
                </h1>
                <p className="m-0 text-[16px] font-bold text-gray-400 leading-relaxed whitespace-pre-line">
                    {currentStep.desc}
                </p>

                {/* Question Area */}
                {step === 2 && (
                    <div className="w-full d-flex flex-col gap-4 mt-12 animate-in fade-in zoom-in-95 duration-500">
                        <button 
                            onClick={() => setFormData({ ...formData, nationality: 'KR' })}
                            className={`onboarding-btn-option border-none cursor-pointer d-flex items-center justify-center gap-3 transition-all ${
                                formData.nationality === 'KR' ? 'bg-peach text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-400'
                            }`}
                        >
                            <span className="text-[20px]">🇰🇷</span> 한국인입니다
                        </button>
                        <button 
                            onClick={() => setFormData({ ...formData, nationality: 'JP' })}
                            className={`onboarding-btn-option border-none cursor-pointer d-flex items-center justify-center gap-3 transition-all ${
                                formData.nationality === 'JP' ? 'bg-peach text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-400'
                            }`}
                        >
                            <span className="text-[20px]">🇯🇵</span> 日本人です
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="w-full d-flex gap-4 mt-12 animate-in fade-in zoom-in-95 duration-500">
                        <button 
                            onClick={() => setFormData({ ...formData, gender: 'M' })}
                            className={`onboarding-gender-card border-none cursor-pointer d-flex flex-col items-center justify-center gap-3 group ${
                                formData.gender === 'M' ? 'active' : 'inactive'
                            }`}
                        >
                            <User size={32} className={`${formData.gender === 'M' ? 'text-blue-400' : 'text-gray-300'}`} fill={formData.gender === 'M' ? "#60a5fa" : "none"} />
                            <span className="text-[14px]">남성 (Male)</span>
                        </button>
                        <button 
                            onClick={() => setFormData({ ...formData, gender: 'F' })}
                            className={`onboarding-gender-card border-none cursor-pointer d-flex flex-col items-center justify-center gap-3 group ${
                                formData.gender === 'F' ? 'active' : 'inactive'
                            }`}
                        >
                            <User size={32} className={`${formData.gender === 'F' ? 'text-pink-400' : 'text-gray-300'}`} fill={formData.gender === 'F' ? "#f472b6" : "none"} />
                            <span className="text-[14px]">여성 (Female)</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Button Area */}
            <div className="w-full max-w-[420px] px-8 pb-4">
                <button 
                    onClick={handleNext}
                    className="btn btn-primary u-rounded-full py-5 u-shadow-xl text-[18px] font-black d-flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <span>{step === 3 ? (isUpdate ? "프로필 수정 완료" : "코이 시작하기") : "다음 단계로"}</span>
                    <ArrowRight size={22} strokeWidth={3} />
                </button>
                <p className="m-0 text-center text-[12px] font-bold text-gray-300 mt-6 tracking-wide">
                    {step} / 3 PAGES
                </p>
            </div>

            <style jsx>{`
                .animate-in { animation: animateIn 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
                @keyframes animateIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
