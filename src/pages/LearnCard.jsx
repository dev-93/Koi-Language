import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store';
import { situations } from '../data/situations';
import { ChevronLeft, ChevronRight, Heart, Home, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LearnCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, markCardLearned } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedCards, setLikedCards] = useState(new Set());
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const sitId = parseInt(id, 10);
  const situation = situations.find(s => s.id === sitId);

  if (!situation) return <div className="p-10 text-center">상황을 찾을 수 없습니다.</div>;

  const isKr = userProfile.myNationality === 'KR';
  const myPerspective = isKr ? 'kr_wants_jp' : 'jp_wants_kr';
  const expressions = situation.expressions[myPerspective];
  const totalCards = expressions.length;
  
  // Progress calculation: Based on how many cards are actually reviewed.
  // Requirement says 0/5 should be empty. But usually we want to show 1st card as 0% or something.
  // Let's make it: progress = (index) / total * 100. So 1st card (index 0) is 0%.
  const progress = (currentIndex / totalCards) * 100;
  const isLastCard = currentIndex === totalCards - 1;

  if (!expressions || expressions.length === 0) return <div className="p-10 text-center">표현 데이터가 없습니다.</div>;

  const currentExpr = expressions[currentIndex];

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    } else {
      // Completed!
      markCardLearned(sitId);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF8A8A', '#FFDFDA', '#DDE2FF']
      });
      // Show celebration for a bit then navigate
      setTimeout(() => navigate('/home'), 2000);
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

  const variants = {
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
    <div className="flex flex-col h-screen overflow-hidden p-6" style={{ background: 'var(--bg-gradient)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => navigate('/home')} className="p-2 border-none bg-white rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-lg">
          {isKr ? situation.title.kr : situation.title.jp}
        </span>
        <button onClick={() => navigate('/home')} className="p-2 border-none bg-white rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
          <Home size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Progress Bar Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Learning Progress</span>
          <span className="text-xs font-black text-pink-500">{Math.round((currentIndex / totalCards) * 100)}%</span>
        </div>
        <div className="h-2.5 w-full bg-white rounded-full shadow-inner overflow-hidden border border-pink-50">
          <motion.div 
            className="h-full bg-gradient-to-r from-pink-300 to-pink-500 rounded-full shadow-[0_0_8px_rgba(255,138,138,0.4)]"
            initial={{ width: 0 }}
            animate={{ width: `${(currentIndex / totalCards) * 100}%` }}
            transition={{ duration: 0.5, ease: "circOut" }}
          />
        </div>
      </div>

      {/* Card Container */}
      <div className="flex-1 relative flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x;
              if (swipe < -100) handleNext();
              else if (swipe > 100) handlePrev();
            }}
            className="card w-full max-w-[360px] flex flex-col items-center justify-between relative cursor-grab active:cursor-grabbing transform-gpu"
            style={{ 
              padding: '32px 24px', 
              touchAction: 'none',
              minHeight:'440px',
              backgroundColor: 'white'
            }}
          >
            {/* Heart Button */}
            <motion.button 
              whileTap={{ scale: 1.4 }}
              onClick={toggleLike}
              className="absolute top-6 right-6 p-2 border-none bg-transparent"
            >
              <Heart 
                size={28} 
                fill={likedCards.has(currentIndex) ? "#FF8A8A" : "white"} 
                stroke={likedCards.has(currentIndex) ? "#FF8A8A" : "#E0E0E0"} 
                strokeWidth={likedCards.has(currentIndex) ? 0 : 2}
                className="transition-colors duration-300"
              />
            </motion.button>

            {/* Transcription & Translation */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full pt-4">
              <h2 className="m-0 text-[32px] font-black text-center leading-tight text-gray-800">
                {isKr ? currentExpr.jp : currentExpr.kr}
              </h2>
              <p className="m-0 text-[18px] text-gray-400 font-bold tracking-wide">
                {currentExpr.reading}
              </p>
              <h3 className="m-0 text-[26px] font-bold text-[#FF8A8A]">
                {isKr ? currentExpr.kr : currentExpr.jp}
              </h3>

              {/* Divider */}
              <div className="w-[90%] h-[1px] bg-gradient-to-r from-transparent via-pink-100 to-transparent my-6" />

              {/* Word Chips */}
              <div className="flex flex-wrap justify-center gap-2.5 px-2">
                {currentExpr.words?.map((w, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex items-center gap-1.5"
                  >
                    <span className="bg-[#FFF0F0] text-[#FF8A8A] text-[12px] font-black px-2.5 py-1.5 rounded-lg border border-[#FFECEC]">
                      [{w.word.split(' ')[0]}]
                    </span>
                    <span className="bg-gray-50 text-gray-500 text-[12px] font-bold px-2.5 py-1.5 rounded-lg border border-gray-100">
                      [{w.mean}]
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tip at Bottom */}
            <div className="w-full pt-8">
              {currentExpr.tip && (
                <div className="bg-[#FBFBFF] rounded-2xl p-4 flex items-start gap-3 border border-[#F0F0FF]">
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

      {/* Indicators and Navigation */}
      <div className="mt-8 mb-4 flex flex-col items-center gap-6">
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
            {isLastCard ? (
              <>FINISH <CheckCircle2 size={22}/></>
            ) : (
              <>NEXT <ChevronRight size={22}/></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
