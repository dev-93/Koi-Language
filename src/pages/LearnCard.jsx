import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store';
import useSituations from '../hooks/useSituations';
import { ChevronLeft, ChevronRight, Heart, Home, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LearnCard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userProfile, markCardLearned } = useStore();
    const { situations, loading } = useSituations();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [likedCards, setLikedCards] = useState(new Set());
    const [direction, setDirection] = useState(0);

    const situation = situations.find((s) => s.id === id);
    const isKr = userProfile.myNationality === 'KR';
    const myPerspective = isKr ? 'kr_wants_jp' : 'jp_wants_kr';

    if (loading) return (
        <div className="d-flex flex-col h-screen items-center justify-center bg-main-gradient gap-4">
            <span className="text-4xl animate-bounce">💌</span>
            <p className="m-0 font-black text-gray-400 text-[15px]">표현 카드를 불러오는 중...</p>
        </div>
    );

    if (!situation) return (
        <div className="d-flex flex-col h-screen items-center justify-center bg-main-gradient gap-4">
            <span className="text-4xl">😢</span>
            <p className="m-0 font-black text-gray-400 text-[15px]">상황을 찾을 수 없습니다.</p>
        </div>
    );

    const expressions = situation.expressions?.[myPerspective] ?? [];
    const totalCards = expressions.length;
    const isLastCard = currentIndex === totalCards - 1;

    if (expressions.length === 0) return (
        <div className="d-flex flex-col h-screen items-center justify-center bg-main-gradient gap-4">
            <span className="text-4xl">🛠️</span>
            <p className="m-0 font-black text-gray-400 text-[15px]">표현 데이터가 없습니다.</p>
        </div>
    );

    const currentExpr = expressions[currentIndex];

    const handleNext = () => {
        if (currentIndex < totalCards - 1) {
            setDirection(1);
            setCurrentIndex((prev) => prev + 1);
        } else {
            markCardLearned(situation.id);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FF8A8A', '#FFDFDA', '#DDE2FF'],
            });
            setTimeout(() => navigate('/home'), 2000);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setDirection(-1);
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const toggleLike = (e) => {
        e.stopPropagation();
        const newLiked = new Set(likedCards);
        if (newLiked.has(currentIndex)) newLiked.delete(currentIndex);
        else newLiked.add(currentIndex);
        setLikedCards(newLiked);
    };

    const variants = {
        enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.9 }),
        center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
        exit: (dir) => ({ zIndex: 0, x: dir < 0 ? 300 : -300, opacity: 0, scale: 0.9 }),
    };

    return (
        <div className="d-flex flex-col h-screen overflow-hidden p-6 bg-main-gradient">
            {/* Header */}
            <div className="d-flex items-center justify-between mb-2">
                <button
                    onClick={() => navigate('/home')}
                    className="p-2 border-none bg-white rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                >
                    <ChevronLeft size={24} className="text-gray-600" />
                </button>
                <span className="font-bold text-gray-800 text-lg">
                    {isKr ? situation.title.kr : situation.title.jp}
                </span>
                <button
                    onClick={() => navigate('/home')}
                    className="p-2 border-none bg-white rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                >
                    <Home size={20} className="text-gray-400" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="d-flex justify-between items-center mb-2 px-1">
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">
                        Learning Progress
                    </span>
                    <span className="text-xs font-black text-pink-500">
                        {Math.round((currentIndex / totalCards) * 100)}%
                    </span>
                </div>
                <div className="progress-bar-container">
                    <motion.div
                        className="progress-bar-fill-gradient"
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentIndex / totalCards) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'circOut' }}
                    />
                </div>
            </div>

            {/* Card Container */}
            <div className="flex-1 relative d-flex items-center justify-center">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                            scale: { duration: 0.2 },
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset }) => {
                            if (offset.x < -100) handleNext();
                            else if (offset.x > 100) handlePrev();
                        }}
                        className="card w-full learn-card-container d-flex flex-col items-center justify-between relative cursor-grab active:cursor-grabbing transform-gpu"
                    >
                        {/* Heart Button */}
                        <motion.button
                            whileTap={{ scale: 1.4 }}
                            onClick={toggleLike}
                            className="absolute top-6 right-6 p-2 border-none bg-transparent"
                        >
                            <Heart
                                size={28}
                                fill={likedCards.has(currentIndex) ? '#FF8A8A' : 'white'}
                                stroke={likedCards.has(currentIndex) ? '#FF8A8A' : '#E0E0E0'}
                                strokeWidth={likedCards.has(currentIndex) ? 0 : 2}
                                className="transition-colors duration-300"
                            />
                        </motion.button>

                        {/* Content */}
                        <div className="flex-1 d-flex flex-col items-center justify-center gap-4 w-full pt-4">
                            <h2 className="m-0 text-[32px] font-black text-center leading-tight text-gray-800">
                                {isKr ? currentExpr.jp : currentExpr.kr}
                            </h2>
                            <p className="m-0 text-[18px] text-gray-400 font-bold tracking-wide">
                                {currentExpr.reading}
                            </p>
                            <h3 className="m-0 text-[26px] font-bold text-peach">
                                {isKr ? currentExpr.kr : currentExpr.jp}
                            </h3>

                            <div className="card-divider-wide" />

                            <div className="d-flex flex-wrap justify-center gap-2.5 px-2">
                                {currentExpr.words?.map((w, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        key={i}
                                        className="d-flex items-center gap-1.5"
                                    >
                                        <span className="word-tag-primary">{w.word}</span>
                                        <span className="word-tag-secondary">{w.mean}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Tip */}
                        <div className="w-full pt-8">
                            {currentExpr.tip && (
                                <div className="tip-box d-flex items-start gap-3">
                                    <span className="text-lg">💡</span>
                                    <p className="m-0 text-[13px] text-gray-500 leading-relaxed font-bold">
                                        {currentExpr.tip}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="mt-8 mb-4 d-flex flex-col items-center gap-6">
                <div className="px-4 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-[13px] font-black text-gray-300 tracking-widest">
                    <span className="text-[#FF8A8A]">{currentIndex + 1}</span> / {totalCards}
                </div>
                <div className="flex items-center gap-4 w-full">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className={`flex-1 h-16 rounded-[22px] border-none font-bold transition-all shadow-sm ${
                            currentIndex === 0 ? 'bg-gray-100 text-gray-300' : 'bg-white text-gray-600 active:scale-95'
                        }`}
                    >
                        PREV
                    </button>
                    <button
                        onClick={handleNext}
                        className={`flex-[2] h-16 rounded-[22px] border-none font-black transition-all shadow-lg flex items-center justify-center gap-2 text-white ${
                            isLastCard
                                ? 'bg-gradient-to-r from-pink-400 to-pink-600 animate-pulse'
                                : 'bg-[#FF8A8A] active:scale-95'
                        }`}
                    >
                        {isLastCard ? <><span>FINISH</span> <CheckCircle2 size={22} /></> : <><span>NEXT</span> <ChevronRight size={22} /></>}
                    </button>
                </div>
            </div>
        </div>
    );
}
