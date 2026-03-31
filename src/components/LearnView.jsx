'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { 
    ChevronLeft, 
    ChevronRight, 
    Volume2, 
    CheckCircle2, 
    Home,
    AlertCircle,
    Info,
    MessageCircle,
    Play,
    Heart,
    Sparkles
} from 'lucide-react';
import SituationScene from './SituationScene';

export default function LearnView({ situation, initialExpressions = [] }) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swiper, setSwiper] = useState(null);
    const [isKr, setIsKr] = useState(true); // true: 한국인 시점(일어 학습), false: 일본인 시점(한국어 학습)
    const [expressions, setExpressions] = useState([]);

    useEffect(() => {
        const nationality = typeof window !== 'undefined' ? (localStorage.getItem('user_nationality') || 'KR') : 'KR';
        
        // 1. 국적 필터링 (KR -> kr_wants_jp 등)
        const targetType = nationality === 'KR' ? 'kr_wants_jp' : 'jp_wants_kr';
        const filtered = (initialExpressions || []).filter(expr => expr.type === targetType);
        
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
            <div className="w-full max-w-[420px] d-flex items-center justify-between py-6 px-2 mb-4 bg-white/80 backdrop-blur sticky top-0 z-20">
                <button onClick={() => router.push('/')} className="p-3 u-rounded-full hover:bg-gray-100 border-none bg-transparent cursor-pointer transition-all">
                    <ChevronLeft size={24} className="text-gray-800" />
                </button>
                <div className="d-flex flex-col items-center">
                    <span className="text-[10px] font-black text-peach tracking-widest mb-1 uppercase">SITUATION</span>
                    <h1 className="m-0 text-[14px] font-black text-gray-800 max-w-[200px] truncate text-center">
                        {situation.title.kr}
                    </h1>
                </div>
                <button 
                    onClick={() => setIsKr(!isKr)}
                    className="u-bg-white\/80 u-shadow-md border-none p-3 u-rounded-full px-5 font-black text-[12px] text-peach hover:shadow-lg transition-all cursor-pointer bg-white"
                >
                    {isKr ? 'KR 🇰🇷' : 'JP 🇯🇵'}
                </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-[420px] px-8 mb-10">
                <div className="progress-bar-container">
                    <div 
                        className="progress-bar-fill-gradient" 
                        style={{ width: `${((currentIndex + 1) / expressions.length) * 100}%` }}
                    ></div>
                </div>
                <div className="d-flex justify-between items-center mt-4">
                    <span className="text-[12px] font-black text-gray-300">
                        PROGRESS
                    </span>
                    <span className="text-[12px] font-black text-peach italic">
                        {currentIndex + 1} <span className="text-gray-300">/</span> {expressions.length}
                    </span>
                </div>
            </div>

            {/* Main Learning Content (Swiper) */}
            <div className="w-full d-flex flex-col items-center flex-1">
                <div className="w-full max-w-[420px] h-full">
                    <Swiper
                        onSwiper={setSwiper}
                        onSlideChange={(s) => setCurrentIndex(s.activeIndex)}
                        className="w-full"
                        spaceBetween={20}
                        slidesPerView={1.1}
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
                                    const pairs = rawWords.split(/,|\n/).filter(p => p.trim());
                                    wordList = pairs.map(p => {
                                        const [jpPart, krPart] = p.split(':').map(s => s.trim());
                                        return { jp: jpPart, kr: krPart || '' };
                                    });
                                }
                            } catch (e) {
                                console.warn("Word parsing fallback:", e);
                            }

                            return (
                                <SwiperSlide key={expr.id || idx}>
                                    <div className={`learn-card-main u-shadow-xl transition-all duration-300 ${currentIndex === idx ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`}>
                                        {/* 상황 씬 일러스트 */}
                                        <SituationScene title={situation.title.kr} date={situation.date} />

                                        <div className="flex-1 d-flex flex-col items-center justify-center gap-2 w-full pt-6">
                                            {/* 일본어 메인 */}
                                            <h2 className="m-0 text-[32px] font-black text-center leading-tight text-gray-800 tracking-tight">
                                                {(isKr ? expr.jp : expr.kr).replace(/[\u0000-\u001F\u007F-\u009F\uFFFD]/g, "")}
                                            </h2>

                                            {/* 발음 (독음) - 이전 UI 스타일 복구 */}
                                            {expr.pron && (
                                                <p className="m-0 text-[18px] font-medium text-gray-600 text-center mt-2">
                                                    {expr.pron.replace(/[\u0000-\u001F\u007F-\u009F\uFFFD]/g, "")}
                                                </p>
                                            )}

                                            {/* 한국어 뜻 (핑크 강조) */}
                                            <p className="m-0 text-[24px] font-black text-peach text-center mt-4 mb-2">
                                                {(isKr ? expr.kr : expr.jp).replace(/[\u0000-\u001F\u007F-\u009F\uFFFD]/g, "")}
                                            </p>

                                            <div className="card-divider-wide opacity-30"></div>

                                            {/* 단어장 태그 리스트 */}
                                            <div className="d-flex flex-wrap justify-center gap-2 mt-4 px-4">
                                                {wordList.map((word, wIdx) => (
                                                    <div key={wIdx} className="d-flex items-center u-rounded-lg overflow-hidden border border-peach/10 shadow-sm">
                                                        <span className="bg-gray-100 px-3 py-1.5 text-[13px] font-bold text-gray-600 border-r border-peach/10">
                                                            {word.jp}
                                                        </span>
                                                        <span className="bg-peach/5 px-3 py-1.5 text-[13px] font-bold text-peach">
                                                            {word.kr}
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

                    {/* Tip Section (이전 UI 스타일) */}
                    {currentExpr?.tip && (
                        <div className="px-8 mt-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <div className="tip-box-standard u-shadow-sm border border-peach/10 bg-peach/5 p-6 u-rounded-2xl">
                                <div className="d-flex items-center gap-2 mb-2">
                                    <Sparkles size={16} className="text-peach" />
                                    <span className="text-[12px] font-black text-peach tracking-widest uppercase">Koi's Dating Tip</span>
                                </div>
                                <p className="m-0 text-[15px] font-bold text-gray-700 leading-relaxed">
                                    {currentExpr.tip}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Nav Controller */}
            <div className="fixed bottom-0 left-0 right-0 p-8 pt-4 pb-12 bg-white/90 backdrop-blur d-flex justify-center z-30">
                <div className="w-full max-w-[420px] d-flex gap-4">
                    <button 
                        onClick={() => swiper?.slidePrev()}
                        className={`flex-1 py-5 u-rounded-card border-none font-black text-[15px] transition-all cursor-pointer d-flex items-center justify-center gap-2 ${
                            currentIndex === 0 ? 'bg-gray-100 text-gray-300' : 'bg-gray-200 text-gray-600 u-shadow-md'
                        }`}
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft size={22} />
                        <span>PREV</span>
                    </button>
                    <button 
                        onClick={currentIndex === expressions.length - 1 ? handleFinish : () => swiper?.slideNext()}
                        className="flex-[1.5] py-5 u-rounded-card bg-peach text-white border-none font-black text-[15px] u-shadow-lg d-flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                        {currentIndex === expressions.length - 1 ? (
                            <><span>FINISH</span> <CheckCircle2 size={22} /></>
                        ) : (
                            <><span>NEXT</span> <ChevronRight size={22} /></>
                        )}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .bg-peach-light { background-color: #fff0f0; }
                .animate-in { animation: animateIn 0.5s ease-out; }
                @keyframes animateIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
