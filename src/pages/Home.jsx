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
    <div className="min-h-screen p-6 pb-24 d-flex flex-col items-center" style={{ background: 'var(--bg-gradient)' }}>
      {/* Header */}
      <div className="w-full d-flex justify-between items-center mb-10 max-w-[420px]">
        <div>
          <h1 className="title-cute m-0 text-3xl leading-none mb-1">Koi Language</h1>
          <p style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 'bold' }} className="m-0 uppercase tracking-widest pl-1">Dating Expression Master</p>
        </div>
        <div className="u-bg-white/80 u-backdrop-blur px-4 py-2 u-rounded-2xl shadow-sm border border-white d-flex items-center gap-2">
          <span className="text-xl">{myIcon}</span>
          <span style={{ width: '1px', height: '12px', background: '#E5E7EB' }} />
          <span className="text-xl">{targetIcon}{targetGenderAvatar}</span>
        </div>
      </div>

      {/* Progress Card */}
      <div className="w-full max-w-[420px] card relative overflow-hidden u-bg-white/80 u-backdrop-blur mb-12 p-6 u-rounded-card shadow-xl border-none">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-pink-100/30 rounded-full blur-2xl" />
        <div className="d-flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-pink-100/30 rounded-xl d-flex items-center justify-center shrink-0">
             <Star className="text-peach" size={20} fill="#FF8A8A" />
          </div>
          <div>
            <h2 className="m-0 text-lg font-black text-gray-800">현지인 데이트 실전 정복</h2>
            <p className="m-0 text-xs text-gray-400 font-bold">마스터한 대화 포인트: {completedSituationsCount}개</p>
          </div>
        </div>
        
        <div style={{ height: '16px', background: 'rgba(0,0,0,0.03)', padding: '2px' }} className="w-full rounded-full overflow-hidden shadow-inner">
          <motion.div 
            className="h-full bg-peach rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${dailyProgressRatio}%` }}
            transition={{ duration: 1, ease: "circOut" }}
          />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-[420px]">
        {/* Title & Page Indicator */}
        <div className="d-flex items-center justify-between mb-6 px-1">
          <div className="d-flex items-center gap-2">
            <Sparkles className="text-peach" size={18} />
            <h3 className="text-lg font-black m-0 text-gray-800">{isKr ? currentSituation.title.kr : currentSituation.title.jp}</h3>
          </div>
          <span className="text-peach font-black">{activeIdx + 1} / {totalCards}</span>
        </div>

        {/* Card Section */}
        <div className="min-h-[460px] d-flex justify-center mb-10">
          <Swiper
            effect={'cards'}
            grabCursor={true}
            modules={[EffectCards, Navigation, Pagination]}
            className="mySwiper w-full"
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            onSlideChange={(swiper) => setActiveIdx(swiper.activeIndex)}
          >
            {expressions.map((expr, idx) => (
              <SwiperSlide key={idx} className="u-rounded-card overflow-hidden shadow-2xl">
                <div className="card bg-white p-8 min-h-[440px] d-flex flex-col items-center justify-between relative u-rounded-card border-none">
                  {/* Like Button */}
                  <button 
                    onClick={(e) => toggleLike(e, idx)}
                    className="absolute top-6 right-6 z-10"
                    style={{ padding: '8px' }}
                  >
                    <Heart 
                      size={26} 
                      fill={likedCards.has(idx) ? "#FF8A8A" : "white"} 
                      stroke={likedCards.has(idx) ? "#FF8A8A" : "#E0E0E0"} 
                    />
                  </button>

                  {/* Text Content */}
                  <div className="flex-1 d-flex flex-col items-center justify-center gap-4 w-full pt-8">
                    <h2 className="m-0 text-[30px] font-black text-center leading-tight text-gray-800">
                      {isKr ? expr.jp : expr.kr}
                    </h2>
                    <p className="m-0 text-lg text-gray-400 font-bold">
                      {expr.reading}
                    </p>
                    <h3 className="m-0 text-[26px] font-bold text-peach">
                      {isKr ? expr.kr : expr.jp}
                    </h3>

                    <div style={{ width: '60%', height: '1px', background: '#FFF0F0', margin: '24px 0' }} />

                    <div className="d-flex flex-wrap justify-center gap-2 px-2">
                      {expr.words?.map((w, i) => (
                        <div key={i} className="d-flex items-center gap-1">
                          <span style={{ fontSize: '11px', background: '#FFF0F0', color: '#FF8A8A', border: '1px solid #FFECEC' }} className="font-black px-2 py-1 rounded-md">
                            [{w.word.split(' ')[0]}]
                          </span>
                          <span style={{ fontSize: '11px', background: '#F9FAFB', color: '#9CA3AF', border: '1px solid #F3F4F6' }} className="font-bold px-2 py-1 rounded-md">
                            [{w.mean}]
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footnote Tip */}
                  <div className="w-full pt-10">
                    {expr.tip && (
                      <div style={{ background: '#FFF9F9', padding: '16px', borderRadius: '20px', border: '1px solid #FFECEC' }} className="d-flex items-start gap-3 shadow-sm">
                        <span className="text-xl">💡</span>
                        <p className="m-0 text-xs text-gray-500 leading-relaxed font-bold">
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

        {/* Navigation Buttons Area */}
        <div className="w-full d-flex gap-4">
          <button 
            onClick={() => swiperRef.current?.slidePrev()}
            disabled={activeIdx === 0}
            className="secondary-btn flex-1 h-16"
            style={{ opacity: activeIdx === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft size={20} />
            <span>이전</span>
          </button>
          
          <button 
            onClick={() => isLastCard ? handleFinish() : swiperRef.current?.slideNext()}
            className="primary-btn flex-[2.5] h-16"
          >
            <span>{isLastCard ? '정복 완료!' : '다음 카드로'}</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
