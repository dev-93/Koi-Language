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
  const completedSituationsCount = dailyProgress.cardsLearned.length;
  const targetSituationsCount = 5;
  const dailyProgressRatio = Math.min((completedSituationsCount / targetSituationsCount) * 100, 100);

  const myPerspective = isKr ? 'kr_wants_jp' : 'jp_wants_kr';
  const expressions = currentSituation.expressions[myPerspective];
  const totalCards = expressions.length;
  const isLastCard = activeIdx === totalCards - 1;

  const handleFinish = () => {
    if (!dailyProgress.cardsLearned.includes(currentSituation.id)) {
      markCardLearned(currentSituation.id);
    }
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
    <div className="min-h-screen p-6 pb-24 flex flex-col items-center" style={{ background: 'var(--bg-gradient)' }}>
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-8 max-w-[400px]">
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
      <div className="w-full max-w-[400px] card relative overflow-hidden bg-white/80 backdrop-blur-xl border border-white/50 mb-8 p-6 rounded-[28px] shadow-xl">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-pink-100/30 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center shrink-0">
             <Star className="text-pink-500" size={20} fill="#FF8A8A" />
          </div>
          <div>
            <h2 className="m-0 text-lg font-black text-gray-800">현지인 데이트 실전 정복</h2>
            <p className="m-0 text-xs text-gray-400 font-bold">마스터한 대화 포인트: {completedSituationsCount}개</p>
          </div>
        </div>
        
        <div className="h-4 w-full bg-gray-100/50 rounded-full overflow-hidden border border-gray-100 shadow-inner p-[2px]">
          <motion.div 
            className="h-full bg-pink-400 rounded-full shadow-[0_0_10px_rgba(255,138,138,0.3)]"
            initial={{ width: 0 }}
            animate={{ width: `${dailyProgressRatio}%` }}
            transition={{ duration: 1, ease: "circOut" }}
          />
        </div>
      </div>

      {/* Study Section */}
      <div className="w-full max-w-[340px] relative">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="text-pink-400" size={18} />
            <h3 className="text-[16px] font-black m-0 text-gray-800 truncate">{isKr ? currentSituation.title.kr : currentSituation.title.jp}</h3>
          </div>
          <span className="text-[14px] font-black text-pink-500 shrink-0">{activeIdx + 1} / {totalCards}</span>
        </div>

        {/* Card Swiper Container */}
        <div className="min-h-[460px] flex justify-center">
          <Swiper
            effect={'cards'}
            grabCursor={true}
            modules={[EffectCards, Navigation, Pagination]}
            className="mySwiper w-full"
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            onSlideChange={(swiper) => setActiveIdx(swiper.activeIndex)}
          >
            {expressions.map((expr, idx) => (
              <SwiperSlide key={idx} className="rounded-[32px] overflow-hidden shadow-2xl">
                <div className="bg-white p-8 min-h-[440px] flex flex-col items-center justify-between relative rounded-[32px]">
                  {/* Heart Button */}
                  <button 
                    onClick={(e) => toggleLike(e, idx)}
                    className="absolute top-6 right-6 p-2 z-10"
                  >
                    <Heart 
                      size={26} 
                      fill={likedCards.has(idx) ? "#FF8A8A" : "white"} 
                      stroke={likedCards.has(idx) ? "#FF8A8A" : "#E0E0E0"} 
                    />
                  </button>

                  {/* Content Area */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full pt-6">
                    <h2 className="m-0 text-[28px] font-black text-center leading-tight text-gray-800">
                      {isKr ? expr.jp : expr.kr}
                    </h2>
                    <p className="m-0 text-[18px] text-gray-400 font-bold">
                      {expr.reading}
                    </p>
                    <h3 className="m-0 text-[24px] font-bold text-pink-500">
                      {isKr ? expr.kr : expr.jp}
                    </h3>

                    <div className="w-[80%] h-[1px] bg-pink-50 my-6" />

                    <div className="flex flex-wrap justify-center gap-2 px-2">
                      {expr.words?.map((w, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="bg-[#FFF0F0] text-[#FF8A8A] text-[12px] font-black px-2 py-1 rounded-md border border-[#FFECEC]">
                            [{w.word.split(' ')[0]}]
                          </span>
                          <span className="bg-gray-50 text-gray-400 text-[12px] font-bold px-2 py-1 rounded-md border border-gray-100">
                            [{w.mean}]
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Tip - Increased Spacing */}
                  <div className="w-full pt-8">
                    {expr.tip && (
                      <div className="bg-pink-50/30 rounded-2xl p-4 flex items-start gap-3 border border-pink-50/50 shadow-sm">
                        <span className="text-xl">💡</span>
                        <p className="m-0 text-[13px] text-gray-500 leading-relaxed font-bold">
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

        {/* Navigation Buttons Area - Centered and Spaced */}
        <div className="mt-8 flex flex-col gap-4 w-full">
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => swiperRef.current?.slidePrev()}
              disabled={activeIdx === 0}
              className={`flex-1 h-16 rounded-[24px] font-black shadow-md flex items-center justify-center transition-all ${activeIdx === 0 ? 'bg-gray-50 text-gray-200' : 'bg-white text-gray-500 active:scale-95'}`}
            >
              <ChevronLeft size={24} />
            </button>
            
            <button 
              onClick={() => isLastCard ? handleFinish() : swiperRef.current?.slideNext()}
              className={`flex-[3] h-16 rounded-[24px] font-black shadow-lg shadow-pink-100 flex items-center justify-center gap-3 text-white transition-all bg-pink-400 active:scale-95`}
            >
              {isLastCard ? (
                <>정복 완료! <CheckCircle2 size={24}/></>
              ) : (
                <>다음 카드로 <ChevronRight size={24}/></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
