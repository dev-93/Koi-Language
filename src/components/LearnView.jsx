'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import {
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    ArrowRight,
    Volume2,
    CheckCircle2,
    Home,
    AlertCircle,
    Info,
    MessageCircle,
    Play,
    Heart,
    Sparkles,
} from 'lucide-react';
import SituationScene from './SituationScene';

export default function LearnView({ situation, initialExpressions = [] }) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swiper, setSwiper] = useState(null);
    const [isKr, setIsKr] = useState(true); // true: 한국인 시점(일어 학습), false: 일본인 시점(한국어 학습)
    const [expressions, setExpressions] = useState([]);

    useEffect(() => {
        const nationality =
            typeof window !== 'undefined' ? localStorage.getItem('user_nationality') || 'KR' : 'KR';

        // 1. 국적 필터링 (KR -> kr_wants_jp 등)
        const targetType = nationality === 'KR' ? 'kr_wants_jp' : 'jp_wants_kr';
        const filtered = (initialExpressions || []).filter((expr) => expr.type === targetType);

        // 2. 만약 필터링 결과가 하나도 없으면 (과거 데이터일 수도 있음) 원본 모두 노출
        const finalData = filtered.length > 0 ? filtered : initialExpressions;
        setExpressions(finalData);

        // 3. 국적에 맞춰 보여줄 기본 언어 방향 설정
        setIsKr(nationality === 'KR');
    }, [initialExpressions]);

    // 학습 완료 로직 (클라이언트 사이드 전용)
    const handleFinish = () => {
        const learned = JSON.parse(localStorage.getItem('learned_id') || '[]');
        if (!learned.includes(situation.id)) {
            localStorage.setItem('learned_id', JSON.stringify([...learned, situation.id]));
        }
        router.push('/');
    };

    if (expressions.length === 0) {
        return (
            <div className="home-layout justify-center items-center">
                <p className="text-gray-400 font-bold mb-4">표현 데이터를 불러오고 있습니다...</p>
                <div className="animate-spin u-rounded-full h-8 w-8 border-b-2 border-peach"></div>
            </div>
        );
    }

    const currentExpr = expressions[currentIndex] || expressions[0];

    return (
        <div className="home-layout pb-24 relative overflow-hidden bg-white">
            {/* Header / Nav */}
            <header className="w-full max-w-[480px] h-20 d-flex items-center justify-between px-6 bg-white/90 backdrop-blur u-backdrop-blur sticky top-0 z-40 border-b border-gray-100">
                <button
                    onClick={() => router.push('/')}
                    className="p-3 u-rounded-full hover:bg-gray-50 border-none bg-transparent cursor-pointer transition-all active:scale-90 flex items-center gap-1"
                >
                    <ChevronLeft size={24} className="text-gray-800" />
                    <span className="text-[12px] font-bold text-gray-500 hidden sm:inline">
                        BACK
                    </span>
                </button>

                <div className="flex-1 d-flex flex-col items-center justify-center overflow-hidden px-2">
                    <span className="text-[10px] font-black text-peach tracking-widest mb-0.5 uppercase opacity-80">
                        SITUATION
                    </span>
                    <h1 className="m-0 text-[16px] font-black text-gray-800 text-center w-full truncate">
                        {isKr ? situation.title.kr : situation.title.jp}
                    </h1>
                </div>

                <button
                    onClick={() => setIsKr(!isKr)}
                    className="px-4 py-2 u-shadow-sm border-2 border-peach/20 u-rounded-full font-black text-[12px] text-peach hover:bg-peach/5 transition-all cursor-pointer bg-white whitespace-nowrap active:scale-95"
                >
                    {isKr ? 'KR🇰🇷' : 'JP🇯🇵'}
                </button>
            </header>

            {/* Main Learning Content (Swiper) */}
            <div className="w-full d-flex flex-col items-center pt-4">
                <div className="w-full max-w-[420px]">
                    <Swiper
                        onSwiper={setSwiper}
                        onSlideChange={(s) => setCurrentIndex(s.activeIndex)}
                        className="w-full overflow-visible"
                        spaceBetween={14}
                        slidesPerView={1.05}
                        centeredSlides={true}
                    >
                        {expressions.map((expr, idx) => {
                            // 지능형 단어 데이터 파싱
                            let wordList = [];
                            try {
                                const rawWords = expr.words || '';
                                if (rawWords.trim().startsWith('[')) {
                                    wordList = JSON.parse(rawWords);
                                } else if (rawWords.trim()) {
                                    // "단어: 뜻, 단어2: 뜻2" 또는 줄바꿈 형태 지원
                                    const pairs = rawWords.split(/,|\n/).filter((p) => p.trim());
                                    wordList = pairs.map((p) => {
                                        const [jpPart, krPart] = p.split(':').map((s) => s.trim());
                                        return { jp: jpPart, kr: krPart || '' };
                                    });
                                }
                            } catch (e) {
                                console.warn('Word parsing fallback:', e);
                            }

                            return (
                                <SwiperSlide key={expr.id || idx}>
                                    <div
                                        className={`learn-card-main u-shadow-xl transition-all duration-500 border border-peach/5 ${currentIndex === idx ? 'scale-100 opacity-100' : 'scale-[0.92] opacity-40 blur-[1px]'}`}
                                    >
                                        {/* 상황 씬 일러스트 */}
                                        <SituationScene
                                            title={situation.title.kr}
                                            date={situation.date}
                                        />

                                        <div className="flex-1 d-flex flex-col items-center justify-center gap-2 w-full pt-6">
                                            {/* 메인 표현 */}
                                            <h2 className="m-0 text-[32px] font-black text-center leading-tight text-gray-800 tracking-tight px-2">
                                                {(isKr ? expr.jp : expr.kr).replace(
                                                    /[\u0000-\u001F\u007F-\u009F\uFFFD]/g,
                                                    ''
                                                )}
                                            </h2>

                                            {/* 발음 (독음) */}
                                            {(expr.reading || expr.pron) && isKr && (
                                                <p className="m-0 text-[18px] font-bold text-gray-400 text-center mt-1">
                                                    {(expr.reading || expr.pron).replace(
                                                        /[\u0000-\u001F\u007F-\u009F\uFFFD]/g,
                                                        ''
                                                    )}
                                                </p>
                                            )}

                                            {/* 해석 표현 (핑크 강조) */}
                                            <div className="mt-4 px-6 py-2 u-rounded-xl bg-peach/5">
                                                <p className="m-0 text-[22px] font-black text-peach text-center">
                                                    {(isKr ? expr.kr : expr.jp).replace(
                                                        /[\u0000-\u001F\u007F-\u009F\uFFFD]/g,
                                                        ''
                                                    )}
                                                </p>
                                            </div>

                                            <div className="card-divider-wide opacity-20 my-6"></div>

                                            <div className="d-flex flex-wrap justify-center gap-2 px-4 pb-2">
                                                {wordList.map((word, wIdx) => (
                                                    <div
                                                        key={wIdx}
                                                        className="d-flex items-center u-rounded-xl overflow-hidden border border-peach/10 shadow-sm"
                                                    >
                                                        <span className="bg-gray-50 px-3 py-2 text-[13px] font-bold text-gray-600 border-r border-peach/5">
                                                            {word.jp || word.word}
                                                        </span>
                                                        <span className="bg-white px-3 py-2 text-[13px] font-bold text-peach">
                                                            {word.kr || word.mean}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    {/* Tip Section */}
                    {currentExpr?.tip && (
                        <div className="px-8 mt-1 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="tip-box-standard u-shadow-md border border-peach/10 bg-gradient-to-br from-white to-peach/5 p-6 u-rounded-3xl">
                                <div className="d-flex items-center gap-2 mb-3">
                                    <div className="p-1.5 u-bg-white\/80 u-rounded-full shadow-sm">
                                        <Sparkles size={18} className="text-peach" />
                                    </div>
                                    <span className="text-[13px] font-black text-peach tracking-widest uppercase">
                                        Koi's Dating Tip
                                    </span>
                                </div>
                                <p className="m-0 text-[15px] font-bold text-gray-600 leading-relaxed">
                                    {currentExpr.tip}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Nav Controller */}
            <div
                className="fixed left-0 right-0 bg-white/95 backdrop-blur-md d-flex flex-col items-center z-50 border-t border-gray-50"
                style={{ bottom: 0, paddingBottom: '24px', paddingTop: '16px' }}
            >
                <div className="text-center mb-4 text-[13px] font-black text-gray-500 tracking-widest">
                    PROGRESS {currentIndex + 1} &nbsp;/&nbsp; {expressions.length}
                </div>

                <div className="w-full max-w-[420px] d-flex justify-between px-6">
                    <button
                        onClick={() => swiper?.slidePrev()}
                        className="font-black transition-all cursor-pointer d-flex items-center justify-center gap-2 active:scale-95"
                        style={{
                            width: '45%',
                            padding: '14px',
                            borderRadius: '50px',
                            background: 'transparent',
                            border: '1.5px solid #d4537e',
                            color: '#d4537e',
                            fontSize: '15px',
                            opacity: currentIndex === 0 ? 0.35 : 1,
                        }}
                        disabled={currentIndex === 0}
                    >
                        <ArrowLeft size={18} />
                        <span>PREV</span>
                    </button>
                    <button
                        onClick={
                            currentIndex === expressions.length - 1
                                ? handleFinish
                                : () => swiper?.slideNext()
                        }
                        className="font-black u-shadow-md d-flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                        style={{
                            width: '45%',
                            padding: '14px',
                            borderRadius: '50px',
                            backgroundColor: '#d4537e',
                            color: 'white',
                            border: '1.5px solid transparent',
                            fontSize: '15px',
                        }}
                    >
                        {currentIndex === expressions.length - 1 ? (
                            <>
                                <span className="tracking-tight">FINISH</span>
                                <CheckCircle2 size={18} />
                            </>
                        ) : (
                            <>
                                <span>NEXT</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .bg-peach-light {
                    background-color: #fff0f0;
                }
                .animate-in {
                    animation: animateIn 0.5s ease-out;
                }
                @keyframes animateIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
