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

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden"
            style={{ background: 'var(--bg-gradient)' }}
        >
            <header className="mb-12 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex justify-center mb-4"
                >
                    <div className="w-20 h-20 bg-white rounded-[30%] shadow-xl flex items-center justify-center relative">
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
                            className="card p-10 flex flex-col items-center gap-6"
                        >
                            <div className="text-center">
                                <h2 className="m-0 text-2xl font-black text-gray-800 mb-1">
                                    반가워요!
                                </h2>
                                <p className="m-0 text-sm text-gray-400 font-bold">
                                    당신은 누구인가요?
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    className={`w-full h-16 rounded-[22px] border-none font-black text-lg transition-all flex items-center justify-center gap-3 shadow-md ${profile.myNationality === 'KR' ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                    onClick={() => setProfile({ ...profile, myNationality: 'KR' })}
                                >
                                    <span className="text-2xl">🇰🇷</span> 한국인
                                </button>
                                <button
                                    className={`w-full h-16 rounded-[22px] border-none font-black text-lg transition-all flex items-center justify-center gap-3 shadow-md ${profile.myNationality === 'JP' ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                    onClick={() => setProfile({ ...profile, myNationality: 'JP' })}
                                >
                                    <span className="text-2xl">🇯🇵</span> 일본인
                                </button>
                            </div>

                            <button
                                className="flex items-center gap-2 mt-4 text-pink-500 font-black text-lg border-none bg-transparent active:scale-95 transition-all"
                                onClick={nextStep}
                            >
                                다음으로 <ChevronRight size={20} />
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
                            className="card p-10 flex flex-col items-center gap-6"
                        >
                            <div className="text-center">
                                <h2 className="m-0 text-2xl font-black text-gray-800 mb-1">
                                    성별이 무엇인가요?
                                </h2>
                                <p className="m-0 text-sm text-gray-400 font-bold">
                                    맞춤형 대화법을 제안할게요
                                </p>
                            </div>

                            <div className="flex gap-4 w-full">
                                <button
                                    className={`flex-1 flex flex-col gap-3 items-center justify-center h-32 rounded-[28px] border-none font-black text-lg transition-all shadow-md ${profile.myGender === 'M' ? 'bg-white ring-4 ring-pink-100 text-gray-800' : 'bg-gray-50 text-gray-400 opacity-60'}`}
                                    onClick={() => setProfile({ ...profile, myGender: 'M' })}
                                >
                                    <span className="text-4xl">👨🏻‍💼</span>
                                    남자
                                </button>
                                <button
                                    className={`flex-1 flex flex-col gap-3 items-center justify-center h-32 rounded-[28px] border-none font-black text-lg transition-all shadow-md ${profile.myGender === 'F' ? 'bg-white ring-4 ring-pink-100 text-gray-800' : 'bg-gray-50 text-gray-400 opacity-60'}`}
                                    onClick={() => setProfile({ ...profile, myGender: 'F' })}
                                >
                                    <span className="text-4xl">👩🏻‍💼</span>
                                    여자
                                </button>
                            </div>

                            <div className="flex justify-between w-full mt-4">
                                <button
                                    className="flex items-center gap-1 text-gray-400 font-bold border-none bg-transparent"
                                    onClick={prevStep}
                                >
                                    <ChevronLeft size={18} /> 이전
                                </button>
                                <button
                                    className="flex items-center gap-1 text-pink-500 font-black text-lg border-none bg-transparent"
                                    onClick={nextStep}
                                >
                                    다음 <ChevronRight size={20} />
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
                            className="card p-10 flex flex-col items-center gap-6"
                        >
                            <div className="text-center">
                                <h2 className="m-0 text-2xl font-black text-gray-800 mb-1">
                                    어떤 상대와 대화하나요?
                                </h2>
                                <p className="m-0 text-sm text-gray-400 font-bold">
                                    설레는 첫 대화를 준비해봐요
                                </p>
                            </div>

                            <div className="flex gap-4 w-full">
                                <button
                                    className={`flex-1 flex flex-col gap-3 items-center justify-center h-32 rounded-[28px] border-none font-black text-lg transition-all shadow-md ${profile.targetGender === 'M' ? 'bg-white ring-4 ring-pink-100 text-gray-800' : 'bg-gray-50 text-gray-400 opacity-60'}`}
                                    onClick={() => setProfile({ ...profile, targetGender: 'M' })}
                                >
                                    <span className="text-4xl">👨🏻‍💼</span>
                                    남자
                                </button>
                                <button
                                    className={`flex-1 flex flex-col gap-3 items-center justify-center h-32 rounded-[28px] border-none font-black text-lg transition-all shadow-md ${profile.targetGender === 'F' ? 'bg-white ring-4 ring-pink-100 text-gray-800' : 'bg-gray-50 text-gray-400 opacity-60'}`}
                                    onClick={() => setProfile({ ...profile, targetGender: 'F' })}
                                >
                                    <span className="text-4xl">👩🏻‍💼</span>
                                    여자
                                </button>
                            </div>

                            <div className="flex flex-col gap-4 w-full mt-4">
                                <button
                                    className="w-full h-16 bg-gradient-to-r from-pink-400 to-pink-600 text-white rounded-[22px] border-none font-black text-xl shadow-lg shadow-pink-200 active:scale-95 transition-all"
                                    onClick={handleComplete}
                                >
                                    시작하기 ✨
                                </button>
                                <button
                                    className="flex items-center justify-center gap-1 text-gray-400 font-bold border-none bg-transparent"
                                    onClick={prevStep}
                                >
                                    이전으로
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Progress Dots */}
            <div className="flex gap-2.5 mt-10">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`h-2.5 rounded-full transition-all duration-300 ${step === i ? 'w-10 bg-pink-500 shadow-[0_0_8px_rgba(255,138,138,0.4)]' : 'w-2.5 bg-gray-200'}`}
                    />
                ))}
            </div>
        </div>
    );
}
