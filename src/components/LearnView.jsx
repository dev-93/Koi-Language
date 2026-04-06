'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import {
    ChevronLeft,
    CheckCircle2,
    ArrowLeft,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import SituationScene from './SituationScene';

export default function LearnView({ situation, initialExpressions = [] }) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swiper, setSwiper] = useState(null);
    const [isKr, setIsKr] = useState(true);
    const [expressions, setExpressions] = useState([]);

    useEffect(() => {
        const nationality = typeof window !== 'undefined' ? localStorage.getItem('user_nationality') || 'KR' : 'KR';
        const learnedNationality = nationality === 'JP' ? 'JP' : 'KR';

        // Target 필드가 INTEGRATED이거나 nationality와 맞는 것 필터링
        const filtered = (initialExpressions || []).filter(e => {
            const target = (e.target || e.type || e.Target || '').toUpperCase();
            return target === 'INTEGRATED' || target === learnedNationality.toUpperCase();
        });

        setExpressions(filtered.length > 0 ? filtered : initialExpressions);
        setIsKr(nationality === 'KR');
    }, [initialExpressions]);

    // [중요] 누락되었던 handleFinish 함수 정의
    const handleFinish = () => {
        if (typeof window !== 'undefined') {
            const learned = JSON.parse(localStorage.getItem('learned_id') || '[]');
            if (!learned.includes(situation.id)) {
                localStorage.setItem('learned_id', JSON.stringify([...learned, situation.id]));
            }
        }
        router.push('/');
    };

    if (expressions.length === 0) return null;

    const currentExpr = expressions[currentIndex] || expressions[0];

    const parseValue = (val, lang) => {
        if (!val) return '';
        // 1. 이미 객체인 경우
        if (typeof val === 'object' && !Array.isArray(val)) return val[lang] || '';

        // 2. 문자열인데 JSON인 경우
        try {
            const parsed = JSON.parse(val);
            if (typeof parsed === 'object') return parsed[lang] || '';
        } catch (e) {
            // 3. JSON이 아닌 순수 평문(로마자 발음 등)인 경우
            return val;
        }
        return val;
    };

    return (
        <div className="home-layout pb-32 relative overflow-hidden bg-white">
            <header className="w-full max-w-[480px] h-20 d-flex items-center justify-between px-6 bg-white/90 backdrop-blur sticky top-0 z-40 border-b border-gray-50">
                <button onClick={() => router.push('/')} className="p-3 u-rounded-full hover:bg-gray-50 border-none bg-transparent cursor-pointer transition-all active:scale-95">
                    <ChevronLeft size={24} className="text-gray-800" />
                </button>
                <div className="flex-1 d-flex flex-col items-center justify-center overflow-hidden">
                    <span className="text-[10px] font-black text-peach tracking-widest mb-0.5 uppercase opacity-80">SITUATION</span>
                    <h1 className="m-0 text-[16px] font-black text-gray-800 text-center w-full truncate px-4">{isKr ? situation.title.kr : situation.title.jp}</h1>
                </div>
                <button onClick={() => setIsKr(!isKr)} className="px-4 py-2 u-shadow-sm border-2 border-peach/20 u-rounded-full font-black text-[12px] text-peach hover:bg-peach/5 transition-all cursor-pointer bg-white active:scale-95">
                    {isKr ? 'KR' : 'JP'}
                </button>
            </header>

            <div className="w-full d-flex flex-col items-center pt-2">
                <div className="w-full max-w-[440px] d-flex flex-col items-center pt-4 mb-6">
                    <div className="text-center mb-4 text-[13px] font-black text-gray-400 tracking-widest uppercase opacity-60">
                        PROGRESS {currentIndex + 1} / {expressions.length}
                    </div>
                    <div className="w-full d-flex justify-between items-center px-8" style={{ gap: '1.5rem' }}>
                        <button
                            onClick={() => swiper?.slidePrev()}
                            disabled={currentIndex === 0}
                            style={{ visibility: currentIndex === 0 ? 'hidden' : 'visible' }}
                            className="font-black transition-all cursor-pointer d-flex items-center gap-2 text-peach/60 hover:text-peach border-none bg-transparent active:scale-95 px-4 py-2 u-rounded-full hover:bg-peach/5"
                        >
                            <ArrowLeft size={18} />
                            <span className="text-[14px] tracking-tighter">PREV</span>
                        </button>

                        <button
                            onClick={() => currentIndex === expressions.length - 1 ? handleFinish() : swiper?.slideNext()}
                            className="px-8 py-3 u-rounded-full bg-peach font-black text-white d-flex items-center gap-2 u-shadow-md hover:scale-105 border-none active:scale-95 transition-all"
                        >
                            <span className="text-[15px] tracking-tighter">
                                {currentIndex === expressions.length - 1 ? 'FINISH' : 'NEXT'}
                            </span>
                            <ArrowRight size={18} />
                        </button>

                        {/* 레이아웃 균형을 위한 오른쪽 여백 placeholder */}
                        <div style={{ width: '80px', visibility: 'hidden' }} />
                    </div>
                </div>

                <div className="w-full max-w-[440px]">
                    <Swiper onSwiper={setSwiper} onSlideChange={(s) => setCurrentIndex(s.activeIndex)} className="w-full overflow-visible" spaceBetween={14} slidesPerView={1.05} centeredSlides={true}>
                        {expressions.map((expr, idx) => {
                            let wordList = [];
                            try {
                                const rawWords = expr.words;
                                if (rawWords) {
                                    if (typeof rawWords === 'string' && (rawWords.trim().startsWith('[') || rawWords.trim().startsWith('{'))) {
                                        // JSON 형식인 경우 처리
                                        const parsed = JSON.parse(rawWords);
                                        const items = Array.isArray(parsed) ? parsed : [parsed];
                                        wordList = items.slice(0, 3).map(w => ({
                                            main: isKr ? (w.jp || w.word || '') : (w.kr || w.mean || ''),
                                            sub: isKr ? (w.kr || w.mean || '') : (w.jp || ''),
                                            extra: w.reading_en || w.reading_kr || w.reading || ''
                                        }));
                                    } else if (typeof rawWords === 'string') {
                                        // "단어:뜻, 단어:뜻" 형식의 일반 문자열 처리
                                        wordList = rawWords.split(',').filter(Boolean).slice(0, 3).map(str => {
                                            const parts = str.split(':');
                                            const first = parts[0]?.trim() || '';
                                            const second = parts[1]?.trim() || '';
                                            return {
                                                main: isKr ? first : second,
                                                sub: isKr ? second : first,
                                                extra: ''
                                            };
                                        });
                                    } else if (Array.isArray(rawWords)) {
                                        wordList = rawWords.slice(0, 3).map(w => ({
                                            main: isKr ? (w.jp || w.word || '') : (w.kr || w.mean || ''),
                                            sub: isKr ? (w.kr || w.mean || '') : (w.jp || ''),
                                            extra: w.reading_en || w.reading_kr || w.reading || ''
                                        }));
                                    }
                                }
                            } catch (e) {
                                console.warn('Word parsing error:', e, expr.words);
                            }

                            // 어떤 이름으로 들어와도 발음을 보여주도록 보강
                            const readingText = parseValue(expr.reading || expr.pron || expr.Reading || expr.pronunciation, isKr ? 'kr' : 'jp') || expr.reading_en;
                            const mainText = isKr ? expr.jp : expr.kr;
                            const subText = isKr ? expr.kr : expr.jp;

                            return (
                                <SwiperSlide key={expr.id || idx}>
                                    <div className={`m-2 px-4 py-8 u-rounded-[40px] shadow-2xl transition-all duration-500 border border-gray-50 bg-white d-flex flex-col items-center min-h-[500px] ${currentIndex === idx ? 'scale-100 opacity-100' : 'scale-[0.92] opacity-40 blur-[1px]'}`}>
                                        <SituationScene title={situation.title.kr} date={situation.date} />

                                        <div className="w-full d-flex flex-col items-center justify-center mt-8 gap-3">
                                            <h2 className="m-0 text-[26px] font-black text-center leading-tight text-gray-800 tracking-tight whitespace-pre-wrap px-4 break-words">
                                                {mainText}
                                            </h2>

                                            {readingText && (
                                                <p className="m-0 text-[18px] font-bold text-peach text-center italic mt-2">
                                                    {readingText}
                                                </p>
                                            )}

                                            <div className="mt-4">
                                                <p className="m-0 text-[20px] font-black text-peach/70 text-center">
                                                    {subText}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full card-divider-wide opacity-10 my-8"></div>

                                        <div className="w-full px-2 d-grid grid-cols-3 gap-3">
                                            {wordList.map((word, wIdx) => (
                                                <div key={wIdx} className="d-flex flex-col items-center u-rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white p-2">
                                                    <span className="text-[13px] font-black text-gray-800 text-center w-full truncate">{word.main}</span>
                                                    {word.extra && (
                                                        <span className="text-[9px] text-gray-300 font-bold mt-1 italic text-center w-full truncate">{word.extra}</span>
                                                    )}
                                                    <span className="text-[11px] font-bold text-peach text-center w-full truncate mt-0.5">{word.sub}</span>

                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    {(() => {
                        const tipText = parseValue(currentExpr.tip, isKr ? 'kr' : 'jp');
                        if (!tipText) return null;
                        return (
                            <div className="px-8 mt-2 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="tip-box-standard u-shadow-md border border-peach/10 bg-gradient-to-br from-white to-peach/5 p-6 u-rounded-3xl relative overflow-hidden">
                                    <div className="d-flex items-center gap-2 mb-3">
                                        <Sparkles size={18} className="text-peach" />
                                        <span className="text-[12px] font-black text-peach tracking-widest uppercase">Koi's Dating Tip</span>
                                    </div>
                                    <p className="m-0 text-[15px] font-bold text-gray-600 leading-relaxed z-10 relative">{tipText}</p>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            <style jsx>{`
                .home-layout { height: 100vh; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; }
                .animate-in { animation: animateIn 0.5s ease-out; }
                @keyframes animateIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .d-grid { display: grid; }
                .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            `}</style>
        </div>
    );
}
