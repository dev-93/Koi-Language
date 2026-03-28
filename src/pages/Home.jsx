import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import { situations } from '../data/situations';
import { PlayCircle, Star, Sparkles, ChevronRight, ChevronLeft, Heart, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function Home() {
  const { userProfile, dailyProgress, checkAndResetProgress, markCardLearned } = useStore();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedCards, setLikedCards] = useState(new Set());
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    checkAndResetProgress();
  }, [checkAndResetProgress]);

  const isKr = userProfile.myNationality === 'KR';
  const myIcon = isKr ? '🇰🇷' : '🇯🇵';
  const targetIcon = isKr ? '🇯🇵' : '🇰🇷';
  const targetGenderAvatar = userProfile.targetGender === 'M' ? '👨🏻‍💼' : '👩🏻‍💼';

  const currentSituation = situations[0]; 
  const completedSituations = dailyProgress.cardsLearned.length;
  const targetSituations = 5;
  const dailyProgressRatio = Math.min((completedSituations / targetSituations) * 100, 100);

  const myPerspective = isKr ? 'kr_wants_jp' : 'jp_wants_kr';
  const expressions = currentSituation.expressions[myPerspective];
  const totalCards = expressions.length;
  const currentExpr = expressions[currentIndex];
  const isLastCard = currentIndex === totalCards - 1;

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    } else {
      markCardLearned(currentSituation.id);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF8A8A', '#FFDFDA', '#DDE2FF']
      });
      // Optionally reset to first card or show "Completed" state
      // For now, let's just stay on the last card with a finished state or reset
      setTimeout(() => setCurrentIndex(0), 3000);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const toggleLike = (e) => {
    e.stopPropagation();
    const newLiked = new Set(likedCards);
    if (newLiked.has(currentIndex)) newLiked.delete(currentIndex);
    else newLiked.add(currentIndex);
    setLikedCards(newLiked);
  };

  const cardVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
  };

  return (
    <div className="min-h-screen p-6 pb-24" style={{ background: 'var(--bg-gradient)' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="title-cute m-0 text-3xl leading-none mb-1">Koi Language</h1>
          <p className="text-[10px] m-0 text-gray-400 font-bold uppercase tracking-widest pl-1">Dating Expression Master</p>
        </div>
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-white">
          <span className="text-xl">{myIcon}</span>
          <span className="w-[1px] h-3 bg-gray-200" />
          <span className="text-xl">{targetIcon}{targetGenderAvatar}</span>
        </div>
      </div>

      {/* Daily Progress Card */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="card relative overflow-hidden bg-white/80 backdrop-blur-xl border border-white/50 mb-10"
      >
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-pink-100/30 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-pink-100 rounded-xl">
             <Star className="text-pink-500" size={18} fill="#FF8A8A" />
          </div>
          <div>
            <h2 className="m-0 text-lg font-black text-gray-800">오늘의 학습 목표</h2>
            <p className="m-0 text-xs text-gray-400 font-bold">상황 {targetSituations}개 마스터하기</p>
          </div>
        </div>
        
        <div className="flex justify-between mb-2.5 text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
          <span>Daily Goal</span>
          <span className="text-pink-500">{completedSituations} / {targetSituations}</span>
        </div>
        <div className="h-3.5 w-full bg-gray-100/50 rounded-full overflow-hidden border border-gray-100 shadow-inner">
          <motion.div 
            className="h-full bg-gradient-to-r from-pink-300 to-pink-500 rounded-full shadow-[0_0_10px_rgba(255,138,138,0.3)]"
            initial={{ width: 0 }}
            animate={{ width: `${dailyProgressRatio}%` }}
            transition={{ duration: 1, ease: "circOut" }}
          />
        </div>
      </motion.div>

      {/* Study Section (Swipable Cards) */}
      <div className="relative">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="text-pink-400" size={20} />
            <h3 className="text-xl font-black m-0 text-gray-800">오늘의 상황: {isKr ? currentSituation.title.kr : currentSituation.title.jp}</h3>
          </div>
        </div>

        {/* Learning Card Sub-UI (Progress indicator) */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5 px-1">
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Card Progress</span>
            <span className="text-[11px] font-black text-pink-500">{Math.round((currentIndex / totalCards) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-pink-50">
            <motion.div 
              className="h-full bg-pink-400 rounded-full"
              animate={{ width: `${(currentIndex / totalCards) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* The Card Swiper Area */}
        <div className="relative min-h-[460px] flex items-center justify-center">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = offset.x;
                if (swipe < -80) handleNext();
                else if (swipe > 80) handlePrev();
              }}
              className="card w-full absolute shadow-xl bg-white flex flex-col items-center justify-between p-8 min-h-[440px] cursor-grab active:cursor-grabbing border-none rounded-[32px] touch-none"
            >
              <button 
                onClick={toggleLike}
                className="absolute top-6 right-6 p-2 border-none bg-transparent"
              >
                <Heart 
                  size={26} 
                  fill={likedCards.has(currentIndex) ? "#FF8A8A" : "white"} 
                  stroke={likedCards.has(currentIndex) ? "#FF8A8A" : "#E0E0E0"} 
                />
              </button>

              <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full pt-4">
                <h2 className="m-0 text-[30px] font-black text-center leading-tight text-gray-800">
                  {isKr ? currentExpr.jp : currentExpr.kr}
                </h2>
                <p className="m-0 text-[17px] text-gray-400 font-bold">
                  {currentExpr.reading}
                </p>
                <h3 className="m-0 text-[24px] font-bold text-pink-500">
                  {isKr ? currentExpr.kr : currentExpr.jp}
                </h3>

                <div className="w-[80%] h-[1px] bg-pink-50 my-4" />

                <div className="flex flex-wrap justify-center gap-2 px-2">
                  {currentExpr.words?.map((w, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="bg-[#FFF0F0] text-[#FF8A8A] text-[11px] font-black px-2 py-1 rounded-md border border-[#FFECEC]">
                        [{w.word.split(' ')[0]}]
                      </span>
                      <span className="bg-gray-50 text-gray-400 text-[11px] font-bold px-2 py-1 rounded-md border border-gray-100">
                        [{w.mean}]
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full pt-6">
                {currentExpr.tip && (
                  <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-3 border border-gray-100">
                    <span className="text-lg">💡</span>
                    <p className="m-0 text-[12px] text-gray-500 leading-relaxed font-bold">
                      {currentExpr.tip}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Card Navigation Controls */}
        <div className="mt-8 flex flex-col items-center gap-6">
          <div className="px-4 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-[12px] font-black text-gray-300">
            <span className="text-pink-500">{currentIndex + 1}</span> / {totalCards}
          </div>

          <div className="flex items-center gap-4 w-full">
            <button 
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`flex-1 h-14 rounded-2xl border-none font-bold shadow-sm transition-all ${
                currentIndex === 0 ? 'bg-gray-50 text-gray-200' : 'bg-white text-gray-600 active:scale-95'
              }`}
            >
              PREV
            </button>
            
            <button 
              onClick={handleNext}
              className={`flex-[2] h-14 rounded-2xl border-none font-black shadow-lg flex items-center justify-center gap-2 text-white transition-all ${
                isLastCard 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-600 animate-pulse' 
                  : 'bg-pink-400 active:scale-95'
              }`}
            >
              {isLastCard ? (
                <>FINISH <CheckCircle2 size={18}/></>
              ) : (
                <>NEXT <ChevronRight size={18}/></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Locked/Next Items */}
      <div className="mt-12 opacity-50">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-black text-gray-400">Next Situations</h3>
        </div>
        <div className="flex flex-col gap-4">
          <div className="p-5 bg-white border border-gray-50 rounded-[24px] flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg">☕</div>
               <div className="flex flex-col gap-0.5">
                 <p className="m-0 text-sm font-black text-gray-600">식사 데이트 신청</p>
                 <p className="m-0 text-[10px] text-gray-400 font-bold tracking-widest uppercase">Locked</p>
               </div>
            </div>
            <PlayCircle className="text-gray-200" size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
