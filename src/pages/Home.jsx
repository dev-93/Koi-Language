import { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import useSituations from '../hooks/useSituations';
import {
    Sparkles,
    ChevronRight,
    ChevronLeft,
    Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';
import SituationScene from '../components/SituationScene';

// Import Swiper React components and styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
    const { userProfile, dailyProgress, checkAndResetProgress, markCardLearned, resetUserProfile } = useStore();
    const swiperRef = useRef(null);
    const { situations, loading, error } = useSituations();

    // 날짜 최신순 정렬 (API에서 이미 정렬되어 오지만 보장)
    const sortedSituations = situations && situations.length > 0
        ? [...situations].sort((a, b) => new Date(b.date) - new Date(a.date))
        : [];

    const [selectedSitIdx, setSelectedSitIdx] = useState(0);
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        checkAndResetProgress();
    }, [checkAndResetProgress]);

    const isKr = userProfile.myNationality === 'KR';
    const myIcon = isKr ? '🇰🇷' : '🇯🇵';
    const targetIcon = isKr ? '🇯🇵' : '🇰🇷';
    const targetGenderAvatar = userProfile.targetGender === 'M' ? '👨🏻‍💼' : '👩🏻‍💼';

    const currentSituation = sortedSituations[selectedSitIdx] || sortedSituations[0];
    const myPerspective = isKr ? 'kr_wants_jp' : 'jp_wants_kr';
    const expressions = currentSituation?.expressions?.[myPerspective] || [];
    
    const isLearned = currentSituation ? dailyProgress.cardsLearned.includes(currentSituation.id) : false;

    // Auto-reset when situation changes
    useEffect(() => {
        setActiveIdx(0);
        if (swiperRef.current) swiperRef.current.slideTo(0);
    }, [currentSituation?.id]);

    const totalCards = expressions.length;
    const isLastCard = activeIdx === totalCards - 1 && totalCards > 0;
    const [isFinishing, setIsFinishing] = useState(false);

    const handleFinish = () => {
        if (isFinishing || !currentSituation) return;
        setIsFinishing(true);

        if (!isLearned) {
            markCardLearned(currentSituation.id);
        }
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF8A8A', '#FFDFDA', '#DDE2FF'],
        });

        setTimeout(() => {
            setIsFinishing(false);
            // Stays on the last card when completely finished
        }, 2000);
    };

    if (loading) return (
        <div className="home-layout justify-center">
            <div className="w-full d-flex flex-col items-center justify-center gap-4">
                <span className="text-4xl animate-bounce">💌</span>
                <p className="m-0 font-black text-gray-400 text-[15px]">오늘의 표현을 불러오는 중...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="home-layout justify-center">
            <div className="w-full d-flex flex-col items-center justify-center gap-4 text-center">
                <span className="text-4xl">😢</span>
                <p className="m-0 font-black text-gray-400 text-[15px]">데이터를 불러오지 못했어요.</p>
                <p className="m-0 text-sm text-gray-300 mt-2 px-6">{error}</p>
            </div>
        </div>
    );

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
                <div className="d-flex items-center gap-2">
                    <div className="u-bg-white/80 u-backdrop-blur px-4 py-2 u-rounded-2xl shadow-sm border border-white d-flex items-center gap-2">
                        <span className="text-xl">{myIcon}</span>
                        <span className="header-divider" />
                        <span className="text-xl">
                            {targetIcon}
                            {targetGenderAvatar}
                        </span>
                    </div>
                    <button 
                        onClick={() => {
                            if (window.confirm('프로필을 다시 설정하시겠습니까? 설정된 학습 기록은 유지되지만, 내 정보와 상대방 설정이 초기화됩니다.')) {
                                resetUserProfile();
                            }
                        }}
                        className="u-bg-white/80 u-backdrop-blur p-2.5 u-rounded-2xl shadow-sm border border-white text-gray-400 hover:text-peach transition-colors"
                        title="프로필 재설정"
                    >
                        <Settings size={20} />
                    </button>
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
                                        {isToday ? '오늘의 표현' : sit.title?.kr?.split?.(' ')?.[0] || '표현'}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Study Controller Container */}
            <div className="study-wrapper">
                {/* Title & Page Indicator */}
                <div className="w-full d-flex items-center justify-between mb-6 px-2">
                    <div className="d-flex items-center gap-2">
                        <Sparkles className="text-peach" size={18} />
                        <h3 className="text-lg font-black m-0 text-gray-800">
                            {currentSituation ? (isKr ? currentSituation.title.kr : currentSituation.title.jp) : '표현을 준비 중입니다'}
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
                                        {/* 상황 씬 일러스트 - 항상 KR 타이틀로 키워드 매핑 */}
                                        <SituationScene title={currentSituation.title.kr} date={currentSituation.date} />
                                        {/* Content Area */}
                                        <div className="flex-1 d-flex flex-col items-center justify-start gap-4 w-full pt-4">
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
                                                            {w.word?.split?.(' ')?.[0] || w.word || '단어'}
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
                        <h4 className="m-0 font-bold text-gray-400 text-[15px]">아직 이 레벨의 카드가 빈 칸이에요!</h4>
                        <p className="m-0 mt-1 text-sm text-gray-400">노션에서 표현을 추가해주세요.</p>
                    </div>
                )}

                {/* Navigation Buttons Row - Explicitly Centered */}
                <div className="w-full d-flex justify-center gap-5 mt-4">
                    <button
                        onClick={() => swiperRef.current?.slidePrev()}
                        disabled={activeIdx === 0 || totalCards === 0 || isFinishing}
                        className="secondary-btn h-16 flex-1 px-4 nav-btn-secondary-min"
                        style={{
                            opacity: activeIdx === 0 || totalCards === 0 || isFinishing ? 0.2 : 1,
                        }}
                    >
                        <ChevronLeft size={22} />
                        <span className="nav-btn-text">이전으로</span>
                    </button>

                    <button
                        onClick={() => {
                            if (totalCards === 0 || isFinishing) return;
                            isLastCard ? handleFinish() : swiperRef.current?.slideNext()
                        }}
                        disabled={totalCards === 0 || isFinishing}
                        className={`h-16 flex-[1.5] px-6 nav-btn-primary-min ${isLastCard ? 'primary-btn' : 'btn-secondary'} rounded-2xl border-none font-black flex items-center justify-center gap-2`}
                        style={{
                            backgroundColor: isLastCard ? 'var(--primary-peach)' : 'white',
                            color: isLastCard ? 'white' : 'var(--text-dark)',
                            boxShadow: isLastCard ? '0 4px 10px rgba(255, 138, 138, 0.4)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            opacity: totalCards === 0 || isFinishing ? 0.2 : 1
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
