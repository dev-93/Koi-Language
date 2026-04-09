'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import {
    ChevronLeft,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Volume2,
    Heart,
} from 'lucide-react';
import SituationScene from './SituationScene';
import useStore from '@/store';

export default function LearnView({ situation, initialExpressions = [] }) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swiper, setSwiper] = useState(null);
    const [isKr, setIsKr] = useState(true);
    const [expressions, setExpressions] = useState([]);
    const [tipOpen, setTipOpen] = useState(false);
    const { toggleFavorite, isFavorite } = useStore();

    const speak = (text, lang = 'ja-JP') => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    };

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
        <div className="home-layout relative bg-white" style={{ paddingBottom: '80px', overflow: 'auto' }}>
            <header className="w-full max-w-[480px] d-flex items-center justify-between px-4 bg-white/90 backdrop-blur sticky top-0 z-40 border-b border-gray-50" style={{ padding: '8px 16px' }}>
                <button onClick={() => router.push('/')} className="p-2 u-rounded-full hover:bg-gray-50 border-none bg-transparent cursor-pointer transition-all active:scale-95">
                    <ChevronLeft size={20} className="text-gray-800" />
                </button>
                <div className="flex-1 d-flex items-center justify-center px-2">
                    <h1 className="learn-header-title">
                        {isKr ? situation.title.kr : situation.title.jp}
                    </h1>
                </div>
                <button onClick={() => setIsKr(!isKr)} className="px-3 py-1 u-shadow-sm border-2 border-peach/20 u-rounded-full font-black text-[11px] text-peach hover:bg-peach/5 transition-all cursor-pointer bg-white active:scale-95">
                    {isKr ? 'KR' : 'JP'}
                </button>
            </header>

            <div className="w-full d-flex flex-col items-center pt-2">
                <div className="w-full max-w-[440px]">
                    <Swiper onSwiper={setSwiper} onSlideChange={(s) => { setCurrentIndex(s.activeIndex); setTipOpen(false); }} className="w-full overflow-visible" spaceBetween={14} slidesPerView={1.05} centeredSlides={true}>
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
                                    <div className={`m-1 px-3 py-3 u-rounded-[28px] shadow-2xl transition-all duration-500 border border-gray-50 bg-white d-flex flex-col items-center ${currentIndex === idx ? 'scale-100 opacity-100' : 'scale-[0.92] opacity-40 blur-[1px]'}`}>
                                        <SituationScene title={situation.title.kr} date={situation.date} imageUrl={situation.imageUrl} />

                                        <div className="w-full d-flex flex-col items-center justify-center mt-2">
                                            <div className="d-flex items-center gap-2">
                                                <h2 className="learn-expr-main">
                                                    {mainText}
                                                </h2>
                                                <button
                                                    onClick={() => speak(mainText, isKr ? 'ja-JP' : 'ko-KR')}
                                                    className="tts-btn"
                                                    aria-label="발음 듣기"
                                                >
                                                    <Volume2 size={18} />
                                                </button>
                                            </div>

                                            {readingText && (
                                                <p className="learn-expr-reading">
                                                    {readingText}
                                                </p>
                                            )}

                                            <p className="learn-expr-sub">
                                                {subText}
                                            </p>
                                        </div>

                                        <div className="w-full card-divider-wide opacity-10 my-2"></div>

                                        <div className="w-full px-2 d-grid grid-cols-3 gap-2">
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

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite({
                                                    exprId: expr.id || `${situation.id}-${idx}`,
                                                    jp: expr.jp,
                                                    kr: expr.kr,
                                                    reading: readingText,
                                                    tip: expr.tip,
                                                    situationTitle: isKr ? situation.title.kr : situation.title.jp,
                                                    situationId: situation.id,
                                                });
                                            }}
                                            className="fav-btn mt-2"
                                            aria-label="즐겨찾기"
                                        >
                                            <Heart
                                                size={20}
                                                fill={isFavorite(expr.id || `${situation.id}-${idx}`) ? '#d4537e' : 'none'}
                                                color="#d4537e"
                                            />
                                        </button>
                                    </div>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    {/* Tip은 하단 nav에 통합 */}
                </div>
            </div>

            {/* Tip 오버레이 - nav 바깥에서 독립적으로 띄움 */}
            {tipOpen && (() => {
                const tipText = parseValue(currentExpr.tip, isKr ? 'kr' : 'jp');
                if (!tipText) return null;
                return (
                    <div className="tip-overlay-panel">
                        <p className="m-0 text-[15px] font-bold text-gray-600 leading-relaxed">{tipText}</p>
                    </div>
                );
            })()}

            {/* Tip 토글 버튼 - nav 위에 고정 */}
            {(() => {
                const tipText = parseValue(currentExpr.tip, isKr ? 'kr' : 'jp');
                if (!tipText) return null;
                return (
                    <button onClick={() => setTipOpen(!tipOpen)} className="tip-nav-btn">
                        <Sparkles size={14} className="text-peach" />
                        <span>{tipOpen ? '닫기' : 'Tip'}</span>
                        {tipOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                );
            })()}

            {/* 하단 고정 네비게이션 */}
            <div className="nav-footer-fixed">
                <div className="nav-footer">
                    <div className="nav-progress-bar">
                        <div className="nav-progress-bar-fill" style={{ width: `${((currentIndex + 1) / expressions.length) * 100}%` }} />
                    </div>
                    <div className="nav-buttons">
                        <button
                            className="btn btn-outline"
                            onClick={() => swiper?.slidePrev()}
                            disabled={currentIndex === 0}
                        >
                            ← PREV
                        </button>
                        <span className="nav-counter">{currentIndex + 1}/{expressions.length}</span>
                        <button
                            className="btn btn-primary"
                            onClick={() => currentIndex === expressions.length - 1 ? handleFinish() : swiper?.slideNext()}
                        >
                            {currentIndex === expressions.length - 1 ? 'FINISH ✓' : 'NEXT →'}
                        </button>
                    </div>
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
