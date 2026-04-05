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
    const [isKr, setIsKr] = useState(true); // true: 한국인 시점, false: 일본인 시점
    const [expressions, setExpressions] = useState([]);

    useEffect(() => {
        const nationality = typeof window !== 'undefined' ? localStorage.getItem('user_nationality') || 'KR' : 'KR';
        const integrated = (initialExpressions || []).filter(e => e.target === 'INTEGRATED' || e.type === 'integrated');
        
        if (integrated.length > 0) {
            setExpressions(integrated);
        } else {
            const targetVal = nationality === 'KR' ? 'KR' : 'JP';
            const filtered = (initialExpressions || []).filter(e => e.target === targetVal || e.type?.includes(targetVal.toLowerCase()));
            setExpressions(filtered.length > 0 ? filtered : initialExpressions);
        }
        setIsKr(nationality === 'KR');
    }, [initialExpressions]);

    const handleFinish = () => {
        const learned = JSON.parse(localStorage.getItem('learned_id') || '[]');
        if (!learned.includes(situation.id)) {
            localStorage.setItem('learned_id', JSON.stringify([...learned, situation.id]));
        }
        router.push('/');
    };

    if (expressions.length === 0) return (
        <div className="home-layout justify-center items-center">
            <p className="text-gray-400 font-bold mb-4">Loading expressions...</p>
            <div className="animate-spin u-rounded-full h-8 w-8 border-b-2 border-peach"></div>
        </div>
    );

    const currentExpr = expressions[currentIndex] || expressions[0];

    const parseValue = (val, lang) => {
        if (!val) return '';
        if (typeof val === 'object') return val[lang] || '';
        try {
            const parsed = JSON.parse(val);
            return parsed[lang] || '';
        } catch { return val; }
    };

    return (
        <div className="home-layout pb-24 relative overflow-hidden bg-white">
            <header className="w-full max-w-[480px] h-20 d-flex items-center justify-between px-6 bg-white/90 backdrop-blur sticky top-0 z-40 border-b border-gray-100">
                <button onClick={() => router.push('/')} className="p-3 u-rounded-full hover:bg-gray-50 border-none bg-transparent cursor-pointer transition-all active:scale-90 flex items-center gap-1">
                    <ChevronLeft size={24} className="text-gray-800" />
                    <span className="text-[12px] font-bold text-gray-500 hidden sm:inline">BACK</span>
                </button>
                <div className="flex-1 d-flex flex-col items-center justify-center overflow-hidden px-2">
                    <span className="text-[10px] font-black text-peach tracking-widest mb-0.5 uppercase opacity-80">SITUATION</span>
                    <h1 className="m-0 text-[16px] font-black text-gray-800 text-center w-full truncate">{isKr ? situation.title.kr : situation.title.jp}</h1>
                </div>
                <button onClick={() => setIsKr(!isKr)} className="px-4 py-2 u-shadow-sm border-2 border-peach/20 u-rounded-full font-black text-[12px] text-peach hover:bg-peach/5 transition-all cursor-pointer bg-white whitespace-nowrap active:scale-95">
                    {isKr ? 'KR🇰🇷' : 'JP🇯🇵'}
                </button>
            </header>

            <div className="w-full d-flex flex-col items-center pt-4">
                <div className="w-full max-w-[420px]">
                    <Swiper onSwiper={setSwiper} onSlideChange={(s) => setCurrentIndex(s.activeIndex)} className="w-full overflow-visible" spaceBetween={14} slidesPerView={1.05} centeredSlides={true}>
                        {expressions.map((expr, idx) => {
                            let wordList = [];
                            try {
                                const parsedWords = typeof expr.words === 'string' ? JSON.parse(expr.words) : expr.words;
                                // 최대 3개까지만 가져오기
                                wordList = (parsedWords || []).slice(0, 3).map(w => ({
                                    main: isKr ? (w.jp || w.word || '') : (w.kr || w.mean || ''),
                                    sub: isKr ? (w.kr || w.mean || '') : (w.jp || ''),
                                    extra: w.reading_en || w.reading || w.reading_kr || ''
                                }));
                            } catch (e) { console.warn('Word parsing error:', e); }

                            const readingText = typeof expr.reading === 'string' ? expr.reading : parseValue(expr.reading, isKr ? 'kr' : 'jp');
                            const mainText = isKr ? expr.jp : expr.kr;
                            const subText = isKr ? expr.kr : expr.jp;

                            return (
                                <SwiperSlide key={expr.id || idx}>
                                    <div className={`learn-card-main u-shadow-xl transition-all duration-500 border border-peach/5 ${currentIndex === idx ? 'scale-100 opacity-100' : 'scale-[0.92] opacity-40 blur-[1px]'}`}>
                                        <SituationScene title={situation.title.kr} date={situation.date} />

                                        <div className="flex-1 d-flex flex-col items-center justify-center gap-2 w-full pt-6">
                                            <h2 className="m-0 text-[32px] font-black text-center leading-tight text-gray-800 tracking-tight px-2">
                                                {mainText?.replace(/[\u0000-\u001F\u007F-\u009F\uFFFD]/g, '')}
                                            </h2>

                                            {/* 로마자 발음 (선명하게 렌더링) */}
                                            {readingText && (
                                                <p className="m-0 text-[18px] font-bold text-gray-400 text-center italic mt-1 font-sans">
                                                    {readingText.replace(/[\u0000-\u001F\u007F-\u009F\uFFFD]/g, '')}
                                                </p>
                                            )}

                                            <div className="mt-4 px-6 py-2 u-rounded-xl bg-peach/5">
                                                <p className="m-0 text-[22px] font-black text-peach text-center">
                                                    {subText?.replace(/[\u0000-\u001F\u007F-\u009F\uFFFD]/g, '')}
                                                </p>
                                            </div>

                                            <div className="card-divider-wide opacity-20 my-6"></div>

                                            <div className="d-flex flex-wrap justify-center gap-2 px-4 pb-2">
                                                {wordList.map((word, wIdx) => (
                                                    <div key={wIdx} className="d-flex flex-col items-center u-rounded-xl overflow-hidden border border-peach/10 shadow-sm bg-white min-w-[80px]">
                                                        <div className="d-flex items-center w-full">
                                                            <span className="flex-1 bg-gray-50 px-3 py-2 text-[13px] font-bold text-gray-600 border-r border-peach/5 text-center">{word.main}</span>
                                                            <span className="flex-1 bg-white px-3 py-2 text-[13px] font-bold text-peach text-center">{word.sub}</span>
                                                        </div>
                                                        {word.extra && (
                                                            <span className="w-full text-center text-[10px] text-gray-300 font-bold border-t border-peach/5 py-0.5 italic">{word.extra}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
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
                            <div className="px-8 mt-1 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="tip-box-standard u-shadow-md border border-peach/10 bg-gradient-to-br from-white to-peach/5 p-6 u-rounded-3xl">
                                    <div className="d-flex items-center gap-2 mb-3">
                                        <div className="p-1.5 u-bg-white\/80 u-rounded-full shadow-sm">
                                            <Sparkles size={18} className="text-peach" />
                                        </div>
                                        <span className="text-[13px] font-black text-peach tracking-widest uppercase">Koi's Dating Tip</span>
                                    </div>
                                    <p className="m-0 text-[15px] font-bold text-gray-600 leading-relaxed">{tipText}</p>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            <div className="fixed left-0 right-0 bg-white/95 backdrop-blur-md d-flex flex-col items-center z-50 border-t border-gray-50" style={{ bottom: 0, paddingBottom: '24px', paddingTop: '16px' }}>
                <div className="text-center mb-4 text-[13px] font-black text-gray-500 tracking-widest">PROGRESS {currentIndex + 1} &nbsp;/&nbsp; {expressions.length}</div>
                <div className="w-full max-w-[420px] d-flex justify-between px-6">
                    <button onClick={() => swiper?.slidePrev()} className="font-black transition-all cursor-pointer d-flex items-center justify-center gap-2 active:scale-95" style={{ width: '45%', padding: '14px', borderRadius: '50px', background: 'transparent', border: '1.5px solid #d4537e', color: '#d4537e', fontSize: '15px', opacity: currentIndex === 0 ? 0.35 : 1 }} disabled={currentIndex === 0}>
                        <ArrowLeft size={18} />
                        <span>PREV</span>
                    </button>
                    <button onClick={currentIndex === expressions.length - 1 ? handleFinish : () => swiper?.slideNext()} className="font-black u-shadow-md d-flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition-all cursor-pointer" style={{ width: '45%', padding: '14px', borderRadius: '50px', backgroundColor: '#d4537e', color: 'white', border: '1.5px solid transparent', fontSize: '15px' }}>
                        {currentIndex === expressions.length - 1 ? <><span className="tracking-tight">FINISH</span><CheckCircle2 size={18} /></> : <><span>NEXT</span><ArrowRight size={18} /></>}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .animate-in { animation: animateIn 0.5s ease-out; }
                @keyframes animateIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
