import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import { situations } from '../data/situations';
import { PlayCircle, Star, Sparkles, ChevronRight, ChevronLeft, Heart, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

// Import Swiper React components and styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
  const { userProfile, dailyProgress, checkAndResetProgress, markCardLearned } = useStore();
  const navigate = useNavigate();
  const swiperRef = useRef(null);

  const [activeIdx, setActiveIdx] = useState(0);
  const [likedCards, setLikedCards] = useState(new Set());

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
  const isLastCard = activeIdx === totalCards - 1;

  const handleFinish = () => {
    markCardLearned(currentSituation.id);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF8A8A', '#FFDFDA', '#DDE2FF']
    });
    setTimeout(() => {
      if (swiperRef.current) swiperRef.current.slideTo(0);
    }, 3000);
  };

  const toggleLike = (e, idx) => {
    e.stopPropagation();
    const newLiked = new Set(likedCards);
    if (newLiked.has(idx)) newLiked.delete(idx);
    else newLiked.add(idx);
    setLikedCards(newLiked);
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
      <div className="card relative overflow-hidden bg-white/80 backdrop-blur-xl border border-white/50 mb-10 p-6 rounded-[28px] shadow-xl">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-pink-100/30 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
             <Star className="text-pink-500" size={20} fill="#FF8A8A" />
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
            className="h-full bg-pink-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${dailyProgressRatio}%` }}
            transition={{ duration: 1, ease: "circOut" }}
          />
        </div>
      </div>

      {/* Study Section */}
      <div className="relative">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="text-pink-400" size={20} />
            <h3 className="text-xl font-black m-0 text-gray-800">오늘의 상황: {isKr ? currentSituation.title.kr : currentSituation.title.jp}</h3>
          </div>
        </div>

        {/* Card Swiper Container */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5 px-1">
             <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Card Progress</span>
             <span className="text-[11px] font-black text-pink-500">{Math.round(((activeIdx + 1) / totalCards) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-pink-50">
             <div className="h-full bg-pink-400 rounded-full transition-all duration-300" style={{ width: `${((activeIdx + 1) / totalCards) * 100}%` }} />
          </div>
        </div>

        <div className="min-h-[480px]">
          <Swiper
            effect={'cards'}
            grabCursor={true}
            modules={[EffectCards, Navigation, Pagination]}
            className="mySwiper w-full max-w-[340px]"
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            onSlideChange={(swiper) => setActiveIdx(swiper.activeIndex)}
          >
            {expressions.map((expr, idx) => (
              <SwiperSlide key={idx} className="rounded-[32px] overflow-hidden shadow-2xl">
                <div className="bg-white p-8 min-h-[440px] flex flex-col items-center justify-between relative rounded-[32px]">
                  {/* Heart Button */}
                  <button 
                    onClick={(e) => toggleLike(e, idx)}
                    className="absolute top-6 right-6 p-2 border-none bg-transparent"
                  >
                    <Heart 
                      size={26} 
                      fill={likedCards.has(idx) ? "#FF8A8A" : "white"} 
                      stroke={likedCards.has(idx) ? "#FF8A8A" : "#E0E0E0"} 
                    />
                  </button>

                  {/* Content */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full pt-4">
                    <h2 className="m-0 text-[28px] font-black text-center leading-tight text-gray-800">
                      {isKr ? expr.jp : expr.kr}
                    </h2>
                    <p className="m-0 text-[16px] text-gray-400 font-bold">
                      {expr.reading}
                    </p>
                    <h3 className="m-0 text-[24px] font-bold text-pink-500">
                      {isKr ? expr.kr : expr.jp}
                    </h3>

                    <div className="w-[80%] h-[1px] bg-pink-50 my-6" />

                    <div className="flex flex-wrap justify-center gap-2 px-2">
                      {expr.words?.map((w, i) => (
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

                  {/* Footer Tip */}
                  <div className="w-full pt-6">
                    {expr.tip && (
                      <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-3 border border-gray-100">
                        <span className="text-lg">💡</span>
                        <p className="m-0 text-[12px] text-gray-500 leading-relaxed font-bold">
                          {expr.tip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Custom Navigation */}
        <div className="mt-8 flex flex-col items-center gap-6">
          <div className="px-4 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-[12px] font-black text-gray-300">
            <span className="text-pink-500">{activeIdx + 1}</span> / {totalCards}
          </div>

          <div className="flex items-center gap-4 w-full">
            <button 
              onClick={() => swiperRef.current?.slidePrev()}
              className={`flex-1 h-16 rounded-[22px] font-bold shadow-md flex items-center justify-center gap-2 transition-all ${activeIdx === 0 ? 'bg-gray-100 text-gray-300' : 'bg-white text-gray-600 active:scale-95'}`}
            >
              <ChevronLeft size={20} /> PREV
            </button>
            
            <button 
              onClick={() => isLastCard ? handleFinish() : swiperRef.current?.slideNext()}
              className={`flex-[2] h-16 rounded-[22px] font-black shadow-lg flex items-center justify-center gap-3 text-white transition-all bg-pink-400 active:scale-95`}
            >
              {isLastCard ? (
                <>FINISH <CheckCircle2 size={20}/></>
              ) : (
                <>NEXT <ChevronRight size={20}/></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Next Items Footer */}
      <div className="mt-12 opacity-50">
        <h3 className="text-lg font-black text-gray-400 mb-4 px-1">Next Situations</h3>
        <div className="card p-5 bg-white border border-gray-50 rounded-[28px] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg">☕</div>
             <div className="flex flex-col">
               <p className="m-0 text-sm font-black text-gray-600">식사 데이트 신청</p>
               <p className="m-0 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Locked</p>
             </div>
          </div>
          <PlayCircle className="text-gray-200" size={20} />
        </div>
      </div>
    </div>
  );
}
