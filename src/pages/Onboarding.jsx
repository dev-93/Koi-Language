import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store';
import { ChevronRight, ChevronLeft, Sparkles, Heart } from 'lucide-react';

export default function Onboarding() {
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState({
        myNationality: 'KR',
        myGender: 'M',
        targetGender: 'F',
    });
    const setUserProfile = useStore((state) => state.setUserProfile);
    const navigate = useNavigate();

    const handleComplete = () => {
        setUserProfile(profile);
        navigate('/home');
    };

    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

    const variants = {
        enter: { x: 50, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -50, opacity: 0 },
    };

    const t = {
        KR: {
            step1Title: '반가워요!',
            step1Sub: '당신은 누구인가요?',
            nationKR: '한국인',
            nationJP: '일본인',
            next: '다음으로',
            step2Title: '성별이 무엇인가요?',
            step2Sub: '맞춤형 대화법을 제안할게요',
            male: '남자',
            female: '여자',
            prev: '이전',
            step3Title: '어떤 상대와 대화하나요?',
            step3Sub: '설레는 첫 대화를 준비해봐요',
            start: '시작하기 ✨',
            prevFull: '이전으로',
        },
        JP: {
            step1Title: 'はじめまして！',
            step1Sub: 'お名前（国籍）を教えてください',
            nationKR: '韓国人',
            nationJP: '日本人',
            next: '次へ',
            step2Title: '性別は何ですか？',
            step2Sub: 'あなたに合った表現を提案します',
            male: '男性',
            female: '女性',
            prev: '戻る',
            step3Title: 'どのような相手と会話しますか？',
            step3Sub: 'ときめく初会話を準備しましょう',
            start: '始める ✨',
            prevFull: '戻る',
        },
    }[profile.myNationality || 'KR'];

    return (
        <div className="min-h-screen d-flex flex-col items-center justify-center p-8 overflow-hidden bg-main-gradient">
            <header className="mb-12 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="d-flex justify-center mb-4"
                >
                    <div className="onboarding-logo-box d-flex items-center justify-center relative">
                        <Heart fill="#FF8A8A" stroke="none" size={40} />
                        <Sparkles className="absolute top-2 right-2 text-pink-300" size={16} />
                    </div>
                </motion.div>
                <h1 className="title-cute m-0 text-4xl text-gray-800">Koi Language</h1>
                <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-widest">
                    Connect through language
                </p>
            </header>

            <div className="w-full max-w-[360px] relative min-h-[400px]">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="card p-10 d-flex flex-col items-center gap-6"
                        >
                            <div className="text-center">
                                <h2 className="m-0 text-2xl font-black text-gray-800 mb-1 leading-tight">
                                    반가워요! <br />
                                    <span className="text-lg font-bold text-pink-400">はじめまして！</span>
                                </h2>
                                <p className="m-0 text-sm text-gray-400 font-bold mt-2">
                                    당신은 누구인가요? <br />
                                    あなたは誰ですか？
                                </p>
                            </div>

                            <div className="d-flex flex-col gap-3 w-full">
                                <button
                                    className={`onboarding-btn-option d-flex items-center justify-center gap-3 ${profile.myNationality === 'KR' ? 'bg-pink-gradient text-white' : 'inactive-btn'}`}
                                    onClick={() => setProfile({ ...profile, myNationality: 'KR' })}
                                >
                                    <span className="text-2xl">🇰🇷</span> 
                                    <div className="d-flex flex-col items-start leading-tight">
                                        <span className="text-base font-black">한국인</span>
                                        <span className="text-xs opacity-70">韓国人</span>
                                    </div>
                                </button>
                                <button
                                    className={`onboarding-btn-option d-flex items-center justify-center gap-3 ${profile.myNationality === 'JP' ? 'bg-pink-gradient text-white' : 'inactive-btn'}`}
                                    onClick={() => setProfile({ ...profile, myNationality: 'JP' })}
                                >
                                    <span className="text-2xl">🇯🇵</span>
                                    <div className="d-flex flex-col items-start leading-tight">
                                        <span className="text-base font-black">일본인</span>
                                        <span className="text-xs opacity-70">日本人</span>
                                    </div>
                                </button>
                            </div>

                            <button
                                className="flex items-center gap-2 mt-4 text-pink-500 font-black text-lg border-none bg-transparent active:scale-95 transition-all"
                                onClick={nextStep}
                            >
                                {profile.myNationality === 'JP' ? '次へ' : '다음으로'} <ChevronRight size={20} />
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="card p-10 d-flex flex-col items-center gap-6"
                        >
                            <div className="text-center">
                                <h2 className="m-0 text-2xl font-black text-gray-800 mb-1">
                                    {t.step2Title}
                                </h2>
                                <p className="m-0 text-sm text-gray-400 font-bold">
                                    {t.step2Sub}
                                </p>
                            </div>

                            <div className="d-flex gap-4 w-full">
                                <button
                                    className={`onboarding-gender-card d-flex flex-col gap-3 items-center justify-center ${profile.myGender === 'M' ? 'active shadow-lg shadow-pink-100' : 'inactive'}`}
                                    onClick={() => setProfile({ ...profile, myGender: 'M' })}
                                >
                                    <span className="text-4xl">👨🏻‍💼</span>
                                    {t.male}
                                </button>
                                <button
                                    className={`onboarding-gender-card d-flex flex-col gap-3 items-center justify-center ${profile.myGender === 'F' ? 'active shadow-lg shadow-pink-100' : 'inactive'}`}
                                    onClick={() => setProfile({ ...profile, myGender: 'F' })}
                                >
                                    <span className="text-4xl">👩🏻‍💼</span>
                                    {t.female}
                                </button>
                            </div>

                            <div className="d-flex justify-between w-full mt-4">
                                <button
                                    className="d-flex items-center gap-1 text-gray-400 font-bold border-none bg-transparent active:opacity-60"
                                    onClick={prevStep}
                                >
                                    <ChevronLeft size={18} /> {t.prev}
                                </button>
                                <button
                                    className="d-flex items-center gap-1 text-peach font-black text-lg border-none bg-transparent active:opacity-60"
                                    onClick={nextStep}
                                >
                                    {t.next} <ChevronRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="card p-10 d-flex flex-col items-center gap-6"
                        >
                            <div className="text-center">
                                <h2 className="m-0 text-2xl font-black text-gray-800 mb-1">
                                    {t.step3Title}
                                </h2>
                                <p className="m-0 text-sm text-gray-400 font-bold">
                                    {t.step3Sub}
                                </p>
                            </div>

                            <div className="d-flex gap-4 w-full">
                                <button
                                    className={`onboarding-gender-card d-flex flex-col gap-3 items-center justify-center ${profile.targetGender === 'M' ? 'active shadow-lg shadow-pink-100' : 'inactive'}`}
                                    onClick={() => setProfile({ ...profile, targetGender: 'M' })}
                                >
                                    <span className="text-4xl">👨🏻‍💼</span>
                                    {t.male}
                                </button>
                                <button
                                    className={`onboarding-gender-card d-flex flex-col gap-3 items-center justify-center ${profile.targetGender === 'F' ? 'active shadow-lg shadow-pink-100' : 'inactive'}`}
                                    onClick={() => setProfile({ ...profile, targetGender: 'F' })}
                                >
                                    <span className="text-4xl">👩🏻‍💼</span>
                                    {t.female}
                                </button>
                            </div>

                            <div className="d-flex flex-col gap-4 w-full mt-4">
                                <button
                                    className="w-full h-16 bg-pink-gradient text-white rounded-[22px] border-none font-black text-xl shadow-lg shadow-pink-200 active:scale-95 transition-all"
                                    onClick={handleComplete}
                                >
                                    {t.start}
                                </button>
                                <button
                                    className="d-flex items-center justify-center gap-1 text-gray-400 font-bold border-none bg-transparent active:opacity-60 py-2"
                                    onClick={prevStep}
                                >
                                    <ChevronLeft size={18} /> {t.prevFull}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Progress Dots */}
            <div className="d-flex gap-2.5 mt-10">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`dot-indicator ${step === i ? 'dot-active' : 'dot-inactive'}`}
                    />
                ))}
            </div>
        </div>
    );
}
