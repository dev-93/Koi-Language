import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import { situations } from '../data/situations';
import {
    Star,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    Heart,
} from 'lucide-react';
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

    // Sort situations by date descending
    const sortedSituations = [...situations].sort((a, b) => new Date(b.date) - new Date(a.date));
    const [selectedSitIdx, setSelectedSitIdx] = useState(0);

    const [activeIdx, setActiveIdx] = useState(0);
    const [selectedLevel, setSelectedLevel] = useState('입문편');
    const [likedCards, setLikedCards] = useState(new Set());

    useEffect(() => {
        checkAndResetProgress();
    }, [checkAndResetProgress]);

    const isKr = userProfile.myNationality === 'KR';
    const myIcon = isKr ? '🇰🇷' : '🇯🇵';
    const targetIcon = isKr ? '🇯🇵' : '🇰🇷';
    const targetGenderAvatar = userProfile.targetGender === 'M' ? '👨🏻‍💼' : '👩🏻‍💼';

    const currentSituation = sortedSituations[selectedSitIdx] || sortedSituations[0];
    const completedSituationsCount = dailyProgress.cardsLearned.length;
    const targetSituationsCount = 5;
    const dailyProgressRatio = Math.min(
        (completedSituationsCount / targetSituationsCount) * 100,
        100
    );

    const myPerspective = isKr ? 'kr_wants_jp' : 'jp_wants_kr';
    const expressionsLevels = currentSituation.expressions?.[myPerspective] || { '입문편': [], '실전편': [], '고수편': [] };
    
    const isLearned = (lvl) => dailyProgress.cardsLearned.includes(`${currentSituation.id}_${lvl}`);
    
    const unlockStatus = {
        '입문편': true,
        '실전편': isLearned('입문편'),
        '고수편': isLearned('실전편')
    };

    // Auto-reset when situation changes
    useEffect(() => {
        setSelectedLevel('입문편');
        setActiveIdx(0);
        if (swiperRef.current) swiperRef.current.slideTo(0);
    }, [currentSituation.id]);

    const expressions = expressionsLevels[selectedLevel] || [];
    const totalCards = expressions.length;
    const isLastCard = activeIdx === totalCards - 1 && totalCards > 0;

    const handleFinish = () => {
        if (!isLearned(selectedLevel)) {
            markCardLearned(`${currentSituation.id}_${selectedLevel}`);
        }
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF8A8A', '#FFDFDA', '#DDE2FF'],
        });
        setTimeout(() => {
            if (swiperRef.current) swiperRef.current.slideTo(0);
            setActiveIdx(0);
            
            // Auto advance level if next level has content
            if (selectedLevel === '입문편' && expressionsLevels['실전편']?.length > 0) {
                setSelectedLevel('실전편');
            } else if (selectedLevel === '실전편' && expressionsLevels['고수편']?.length > 0) {
                setSelectedLevel('고수편');
            }
        }, 2000);
    };

    const toggleLike = (e, idx) => {
        e.stopPropagation();
        const newLiked = new Set(likedCards);
        if (newLiked.has(idx)) newLiked.delete(idx);
        else newLiked.add(idx);
        setLikedCards(newLiked);
    };

    return (
        <div className="home-layout">
            {/* Header */}
            <div className="header-wrapper">
                <div>
                    <h1 className="title-cute m-0 text-3xl leading-none mb-1">Koi Language</h1>
                    <p className="m-0 uppercase tracking-widest pl-1 header-subtitle">
                        Dating Expression Master
                    </p>
                </div>
                <div className="u-bg-white/80 u-backdrop-blur px-4 py-2 u-rounded-2xl shadow-sm border border-white d-flex items-center gap-2">
                    <span className="text-xl">{myIcon}</span>
                    <span className="header-divider" />
                    <span className="text-xl">
                        {targetIcon}
                        {targetGenderAvatar}
                    </span>
                </div>
            </div>



            {/* Date History Horizontal Scroll */}
            <div className="history-scroll-wrapper mb-6">
                <div className="d-flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                    {sortedSituations.map((sit, idx) => {
                        const sitDate = new Date(sit.date);
                        const isToday = idx === 0;
                        const isSelected = selectedSitIdx === idx;
                        
                        return (
                            <button
                                key={sit.id}
                                onClick={() => {
                                    setSelectedSitIdx(idx);
                                    if (swiperRef.current) swiperRef.current.slideTo(0);
                                }}
                                className={`history-bubble ${isSelected ? 'active' : ''}`}
                            >
                                <span className={`bubble-status ${isSelected ? 'bg-peach' : 'bg-gray-200'}`} />
                                <div className="d-flex flex-col items-start leading-tight">
                                    <span className="text-[10px] uppercase tracking-wider font-black opacity-60">
                                        {sitDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="text-sm font-black whitespace-nowrap">
                                        {isToday ? '오늘의 표현' : sit.title.kr.split(' ')[0]}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Study Controller Container */}
            <div className="study-wrapper">
                {/* Level Tabs */}
                <div className="w-full d-flex gap-2 mb-4 px-2 mt-2">
                    {['입문편', '실전편', '고수편'].map((lvl) => {
                        const isUnlocked = unlockStatus[lvl];
                        const isActive = selectedLevel === lvl;
                        return (
                            <button
                                key={lvl}
                                onClick={() => {
                                    if (isUnlocked) {
                                        setSelectedLevel(lvl);
                                        setActiveIdx(0);
                                        if (swiperRef.current) swiperRef.current.slideTo(0);
                                    }
                                }}
                                disabled={!isUnlocked}
                                className={`flex-[1] py-2.5 px-1 rounded-xl font-extrabold text-[12px] transition-all border d-flex items-center justify-center gap-1 ${
                                    isActive 
                                        ? 'bg-peach text-white border-peach shadow-md translate-y-[-2px]' 
                                        : isUnlocked 
                                            ? 'bg-white text-gray-700 border-pink-100 hover:bg-pink-50' 
                                            : 'bg-gray-50 text-gray-400 border-transparent opacity-50 cursor-not-allowed'
                                }`}
                            >
                                {lvl} 
                                {isLearned(lvl) ? <span className="text-[10px]">✅</span> : (!isUnlocked && <span className="text-[10px]">🔒</span>)}
                            </button>
                        );
                    })}
                </div>

                {/* Title & Page Indicator */}
                <div className="w-full d-flex items-center justify-between mb-6 px-2">
                    <div className="d-flex items-center gap-2">
                        <Sparkles className="text-peach" size={18} />
                        <h3 className="text-lg font-black m-0 text-gray-800">
                            {isKr ? currentSituation.title.kr : currentSituation.title.jp}
                        </h3>

                    </div>
                    <span className="text-peach font-black text-lg">
                        {totalCards > 0 ? `${activeIdx + 1} / ${totalCards}` : '0 / 0'}
                    </span>
                </div>

                {/* Card Section */}
                {totalCards > 0 ? (
                    <div className="swiper-section">
                        <Swiper
                            effect={'cards'}
                            grabCursor={true}
                            modules={[EffectCards, Navigation, Pagination]}
                            className="mySwiper w-full"
                            onSwiper={(swiper) => (swiperRef.current = swiper)}
                            onSlideChange={(swiper) => setActiveIdx(swiper.activeIndex)}
                        >
                            {expressions.map((expr, idx) => (
                                <SwiperSlide
                                    key={idx}
                                    className="u-rounded-card overflow-hidden shadow-2xl"
                                >
                                    <div className="learn-card-main">
                                        {/* Content Area */}
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

                                            <div className="card-divider" />

                                            <div className="d-flex flex-wrap justify-center gap-2 px-2">
                                                {expr.words?.map((w, i) => (
                                                    <div
                                                        key={i}
                                                        className="d-flex items-center gap-1.5"
                                                    >
                                                        <span className="word-tag-primary">
                                                            {w.word.split(' ')[0]}
                                                        </span>
                                                        <span className="word-tag-secondary">
                                                            {w.mean}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Footer Tip */}
                                        <div className="w-full tip-container">
                                            {expr.tip && (
                                                <div className="tip-box d-flex flex-col gap-2 shadow-sm">
                                                    <div className="d-flex items-center gap-2 mb-1">
                                                        <span className="text-lg">💡</span>
                                                        <span className="text-[11px] font-black text-peach tracking-tighter uppercase">Koi's Dating Tip</span>
                                                    </div>
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
                ) : (
                    <div className="w-full py-16 d-flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <span className="text-4xl mb-3 opacity-50">🛠️</span>
                        <h4 className="m-0 font-bold text-gray-500 text-[15px]">아직 이 레벨의 카드가 빈 칸이에요!</h4>
                        <p className="m-0 mt-1 text-sm text-gray-400">노션에서 표현을 추가해주세요.</p>
                    </div>
                )}

                {/* Navigation Buttons Row - Explicitly Centered */}
                <div className="w-full d-flex justify-center gap-5 mt-4">
                    <button
                        onClick={() => swiperRef.current?.slidePrev()}
                        disabled={activeIdx === 0 || totalCards === 0}
                        className="secondary-btn h-16 flex-1 px-4 nav-btn-secondary-min"
                        style={{
                            opacity: activeIdx === 0 || totalCards === 0 ? 0.2 : 1,
                        }}
                    >
                        <ChevronLeft size={22} />
                        <span className="nav-btn-text">이전으로</span>
                    </button>

                    <button
                        onClick={() => {
                            if (totalCards === 0) return;
                            isLastCard ? handleFinish() : swiperRef.current?.slideNext()
                        }}
                        disabled={totalCards === 0}
                        className={`h-16 flex-[1.5] px-6 nav-btn-primary-min ${isLastCard ? 'primary-btn' : 'btn-secondary'} rounded-2xl border-none font-black flex items-center justify-center gap-2`}
                        style={{
                            backgroundColor: isLastCard ? 'var(--primary-peach)' : 'white',
                            color: isLastCard ? 'white' : 'var(--text-dark)',
                            boxShadow: isLastCard ? '0 4px 10px rgba(255, 138, 138, 0.4)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            opacity: totalCards === 0 ? 0.2 : 1
                        }}
                    >
                        <span className="nav-btn-text">
                            {isLastCard ? '정복 완료!' : '다음으로'}
                        </span>
                        <ChevronRight size={22} />
                    </button>
                </div>
            </div>
        </div>
    );
}
