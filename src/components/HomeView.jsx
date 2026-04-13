'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Calendar,
    BookOpen,
    Heart,
    Search,
    BookMarked,
    UserCircle,
    Settings,
    ArrowRight,
    CheckCircle2,
    Check,
    Volume2,
    Trash2,
} from 'lucide-react';
import SituationScene from './SituationScene';
import useStore from '@/store';

export default function HomeView({ initialSituations = [] }) {
    const router = useRouter();
    const { favorites, toggleFavorite } = useStore();
    const [situations, setSituations] = useState(initialSituations);
    const [searchQuery, setSearchQuery] = useState('');
    const [learnedIds, setLearnedIds] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');

    // 클라이언트 state 기반 탭 관리 (sessionStorage로 복원)
    const [tab, setTabState] = useState('today');

    useEffect(() => {
        const saved = sessionStorage.getItem('home_tab');
        if (saved) setTabState(saved);
    }, []);

    const setTab = useCallback((newTab) => {
        setTabState(newTab);
        sessionStorage.setItem('home_tab', newTab);
    }, []);

    // Swipe state
    const swipeTabs = ['today', 'archive'];
    const touchStartX = useRef(0);
    const touchDeltaX = useRef(0);
    const swipingRef = useRef(false);
    const trackRef = useRef(null);

    const currentSwipeIndex = swipeTabs.indexOf(tab);
    const isSwipeable = currentSwipeIndex !== -1;

    const handleTouchStart = useCallback((e) => {
        touchStartX.current = e.touches[0].clientX;
        touchDeltaX.current = 0;
        swipingRef.current = false;
        if (trackRef.current) {
            trackRef.current.style.transition = 'none';
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        const delta = e.touches[0].clientX - touchStartX.current;
        touchDeltaX.current = delta;

        if (Math.abs(delta) > 10) {
            swipingRef.current = true;
        }

        if (swipingRef.current && trackRef.current) {
            const atStart = currentSwipeIndex === 0 && delta > 0;
            const atEnd = currentSwipeIndex === swipeTabs.length - 1 && delta < 0;
            const dampened = (atStart || atEnd) ? delta * 0.2 : delta;
            const base = -(currentSwipeIndex * 50);
            trackRef.current.style.transform = `translateX(calc(${base}% + ${dampened}px))`;
        }
    }, [currentSwipeIndex]);

    const handleTouchEnd = useCallback(() => {
        if (trackRef.current) {
            trackRef.current.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }

        if (!swipingRef.current) return;

        const threshold = 60;
        const delta = touchDeltaX.current;

        if (delta < -threshold && currentSwipeIndex < swipeTabs.length - 1) {
            setTab(swipeTabs[currentSwipeIndex + 1]);
        } else if (delta > threshold && currentSwipeIndex > 0) {
            setTab(swipeTabs[currentSwipeIndex - 1]);
        }

        // snap back
        if (trackRef.current) {
            const idx = (delta < -threshold && currentSwipeIndex < swipeTabs.length - 1)
                ? currentSwipeIndex + 1
                : (delta > threshold && currentSwipeIndex > 0)
                    ? currentSwipeIndex - 1
                    : currentSwipeIndex;
            trackRef.current.style.transform = `translateX(-${idx * 50}%)`;
        }

        swipingRef.current = false;
        touchDeltaX.current = 0;
    }, [currentSwipeIndex, setTab]);

    // Update track position when tab changes via button
    useEffect(() => {
        if (trackRef.current && isSwipeable) {
            trackRef.current.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            trackRef.current.style.transform = `translateX(-${currentSwipeIndex * 50}%)`;
        }
    }, [currentSwipeIndex, isSwipeable]);

    useEffect(() => {
        const onboardingStatus = localStorage.getItem('onboarding_complete');
        if (!onboardingStatus) {
            router.push('/onboarding');
        }
    }, [router]);

    useEffect(() => {
        if (initialSituations.length > 0) {
            setSituations(initialSituations);
        }
        if (typeof window !== 'undefined') {
            const learned = JSON.parse(localStorage.getItem('learned_id') || '[]');
            setLearnedIds(learned);
        }
    }, [initialSituations]);

    const currentSituation = situations[0];

    const archiveSituations = situations
        .slice(1)
        .filter((s) => {
            const matchesSearch =
                s.title.kr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.title.jp.toLowerCase().includes(searchQuery.toLowerCase());
            const isLearned = learnedIds.includes(s.id);
            if (filterStatus === 'completed') return matchesSearch && isLearned;
            if (filterStatus === 'uncompleted') return matchesSearch && !isLearned;
            return matchesSearch;
        });

    const handleLearnStart = (situationId) => {
        router.push(`/learn/${situationId}`);
    };

    const handleResetProfile = () => {
        if (confirm('프로필을 다시 설정하시겠습니까?')) {
            localStorage.removeItem('onboarding_complete');
            router.push('/onboarding');
        }
    };

    return (
        <div className="home-layout">
            {/* Header Section */}
            <div className="header-wrapper flex justify-center">
                <div className="d-flex flex-col gap-1 items-center">
                    <p className="header-subtitle">KOI LANGUAGE</p>
                    <h1 className="title-cute m-0 text-center" style={{ fontSize: '1.8rem' }}>
                        恋のランゲージ
                    </h1>
                </div>
            </div>

            {/* Main Tabs - today/archive */}
            {isSwipeable && (
                <div
                    className="u-bg-white\/80 u-backdrop-blur u-shadow-lg u-rounded-3xl p-1.5 w-full max-w-[420px] d-flex home-tabs-wrapper"
                    style={{ gap: '0.4rem' }}
                >
                    <button
                        onClick={() => setTab('today')}
                        className={`flex-1 u-rounded-2xl font-black text-[15px] border-none transition-all cursor-pointer ${tab === 'today' ? 'bg-peach u-shadow-md' : 'bg-transparent hover:bg-white/50'}`}
                        style={{ padding: '14px 16px', color: tab === 'today' ? '#ffffff' : '#9ca3af', fontSize: '16px', fontWeight: 900 }}
                    >
                        <div className="d-flex items-center justify-center gap-2">
                            <Heart size={16} fill={tab === 'today' ? 'white' : 'none'} />
                            <span>오늘의 표현</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setTab('archive')}
                        className={`flex-1 u-rounded-2xl font-black text-[15px] border-none transition-all cursor-pointer ${tab === 'archive' ? 'bg-peach u-shadow-md' : 'bg-transparent hover:bg-white/50'}`}
                        style={{ padding: '14px 16px', color: tab === 'archive' ? '#ffffff' : '#9ca3af', fontSize: '16px', fontWeight: 900 }}
                    >
                        <div className="d-flex items-center justify-center gap-2">
                            <BookMarked size={16} fill={tab === 'archive' ? 'white' : 'none'} />
                            <span>지난 학습</span>
                        </div>
                    </button>
                </div>
            )}

            {/* Favorites 전용 헤더 */}
            {tab === 'favorites' && (
                <div className="w-full max-w-[420px] d-flex items-center justify-center home-tabs-wrapper">
                    <div className="d-flex items-center gap-2">
                        <Heart size={16} color="var(--primary-peach)" fill="var(--primary-peach)" />
                        <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-dark)' }}>내가 저장한 표현</span>
                        {favorites.length > 0 && (
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-peach)', opacity: 0.7 }}>{favorites.length}개</span>
                        )}
                    </div>
                </div>
            )}

            {/* Tab Contents */}
            <div className="w-full flex-1 d-flex flex-col items-center">
                {/* Swipeable today/archive area */}
                {isSwipeable && (
                    <div
                        className="swipe-container w-full"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div
                            ref={trackRef}
                            className="swipe-track"
                            style={{
                                display: 'flex',
                                width: '200%',
                                transform: `translateX(-${currentSwipeIndex * 50}%)`,
                            }}
                        >
                            {/* Today Panel */}
                            <div className="swipe-panel" style={{ width: '50%' }}>
                                <div className="w-full max-w-[420px] d-flex flex-col gap-6" style={{ margin: '0 auto' }}>
                                    {currentSituation ? (
                                        <div
                                            className="learn-card-main u-shadow-xl hover:translate-y-[-4px] transition-transform cursor-pointer"
                                            onClick={() => !swipingRef.current && handleLearnStart(currentSituation.id)}
                                        >
                                            <SituationScene
                                                id={currentSituation.id}
                                                title={currentSituation.title.kr}
                                                date={currentSituation.date}
                                                imageUrl={currentSituation.imageUrl}
                                            />
                                            <div className="flex-1 d-flex flex-col items-center justify-start gap-4 w-full pt-4 px-4">
                                                <div className="d-flex items-center gap-2">
                                                    <h2 className="m-0 text-[30px] font-black text-center leading-tight text-gray-800">
                                                        {currentSituation.title.kr}
                                                    </h2>
                                                    {learnedIds.includes(currentSituation.id) && (
                                                        <div className="bg-green-500 text-white p-1 u-rounded-full">
                                                            <CheckCircle2 size={16} fill="white" className="text-green-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="m-0 text-[14px] font-medium text-gray-400 text-center leading-relaxed">
                                                    {currentSituation.desc.kr}
                                                </p>
                                            </div>
                                            <div className="btn btn-primary u-rounded-full mt-8 py-5 gap-3 hover:scale-[1.02] active:scale-[0.98]">
                                                <span className="text-[17px] font-black">학습 시작하기</span>
                                                <ArrowRight size={20} strokeWidth={3} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="learn-card-main u-shadow-xl justify-center items-center py-20">
                                            <p className="m-0 font-black text-gray-400 text-[15px]">데이터를 불러오지 못했어요.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Archive Panel */}
                            <div className="swipe-panel" style={{ width: '50%' }}>
                                <div className="w-full max-w-[420px] d-flex flex-col gap-5 px-1" style={{ margin: '0 auto' }}>
                                    <div className="u-bg-white\/80 u-backdrop-blur u-shadow-md u-rounded-2xl p-5 flex items-center gap-3 mb-2">
                                        <Search size={20} className="text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="공부했던 표현들을 검색해 보세요"
                                            className="p-0 border-none bg-transparent font-bold text-[15px] text-gray-600 focus:outline-none w-full"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="d-flex items-center gap-2 mb-4 px-1 overflow-x-auto pb-1 no-scrollbar">
                                        {[
                                            { id: 'all', label: '전체' },
                                            { id: 'completed', label: '공부 완료!' },
                                            { id: 'uncompleted', label: '학습 준비중' },
                                        ].map((f) => (
                                            <button
                                                key={f.id}
                                                onClick={() => setFilterStatus(f.id)}
                                                className={`px-4 py-1.5 u-rounded-full text-[13px] font-black transition-all border-none cursor-pointer whitespace-nowrap ${filterStatus === f.id ? 'bg-peach' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                style={{ color: filterStatus === f.id ? '#ffffff' : '#9ca3af' }}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="d-flex flex-col max-h-[550px] overflow-y-auto pb-24 custom-scrollbar" style={{ gap: '1.2rem' }}>
                                        {archiveSituations.length > 0 ? (
                                            archiveSituations.map((situation) => (
                                                <div
                                                    key={situation.id}
                                                    onClick={() => !swipingRef.current && handleLearnStart(situation.id)}
                                                    className="u-bg-white\/90 u-backdrop-blur u-shadow-md hover:u-shadow-xl u-rounded-3xl p-6 d-flex items-center justify-between hover:translate-y-[-2px] hover:bg-peach-light transition-all cursor-pointer border group"
                                                    style={{ borderColor: 'rgba(255,138,138,0.1)' }}
                                                >
                                                    <div className="d-flex flex-col gap-2">
                                                        <div className="d-flex items-center gap-2">
                                                            <Calendar size={13} className="text-peach opacity-60" />
                                                            <span className="text-[12px] font-black text-peach tracking-widest uppercase opacity-70">
                                                                {situation.date?.replace(/-/g, '.')}
                                                            </span>
                                                        </div>
                                                        <h3 className="m-0 text-[19px] font-black text-gray-800 leading-tight group-hover:text-peach transition-colors">
                                                            {situation.title.kr}
                                                        </h3>
                                                    </div>
                                                    <div className="d-flex items-center gap-3">
                                                        {learnedIds.includes(situation.id) ? (
                                                            <div className="w-10 h-10 u-rounded-full bg-peach d-flex items-center justify-center text-white shadow-sm border border-peach/20">
                                                                <Check size={20} strokeWidth={4} className="text-white" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 u-rounded-full border-2 border-gray-100 d-flex items-center justify-center text-gray-200">
                                                                <div className="w-6 h-6 u-rounded-full border border-gray-100/50" />
                                                            </div>
                                                        )}
                                                        <div className="text-peach opacity-30 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all ml-1">
                                                            <ArrowRight size={20} strokeWidth={3} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10">
                                                <p className="text-gray-400 font-bold">학습 내역이 없어요.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'settings' && (
                    <div className="w-full max-w-[420px] d-flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
                        <div className="u-bg-white\/80 u-backdrop-blur u-shadow-xl u-rounded-3xl p-8 d-flex flex-col items-center">
                            <div className="w-20 h-20 bg-peach-light u-rounded-full d-flex items-center justify-center mb-6 shadow-sm border-4 border-white">
                                <UserCircle size={48} className="text-peach" />
                            </div>
                            <div className="w-full space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="m-0 text-2xl font-black text-gray-800 mb-1">기본 정보</h2>
                                    <p className="text-sm text-gray-400 font-medium">학습에 반영되는 프로필 정보입니다</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="d-flex justify-between items-center p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                                        <span className="font-bold text-gray-400">대상 국적</span>
                                        <span className="font-black text-gray-700">일본</span>
                                    </div>
                                    <div className="d-flex justify-between items-center p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                                        <span className="font-bold text-gray-400">보</span>
                                        <span className="font-black text-gray-700">
                                            나는
                                            {typeof window !== 'undefined' && localStorage.getItem('user_gender') === 'M' ? ' 남성' : ' 여성'}
                                            이고, {''}
                                            {typeof window !== 'undefined' && localStorage.getItem('target_gender') === 'M' ? '남성' : '여성'}
                                            을/를 알고싶어요
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleResetProfile}
                                    className="w-full btn btn-primary mt-8 py-5 u-rounded-3xl shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span className="text-lg font-black">프로필 다시 수정하기</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-center text-xs text-gray-300 font-medium mt-4">KOI LANGUAGE Made with Taenam</p>
                    </div>
                )}

                {tab === 'favorites' && (
                    <div className="w-full max-w-[420px] d-flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 px-1" style={{ gap: '8px' }}>
                        {favorites.length > 0 ? (
                            <div className="d-flex flex-col pb-24 custom-scrollbar" style={{ gap: '8px' }}>
                                {favorites.map((fav) => (
                                    <div key={fav.exprId} className="fav-card cursor-pointer" onClick={() => fav.situationId && handleLearnStart(fav.situationId)}>
                                        <div className="d-flex items-center justify-between w-full" style={{ gap: '8px' }}>
                                            <div className="d-flex flex-col flex-1" style={{ minWidth: 0, gap: '2px' }}>
                                                <p className="m-0 font-black text-gray-800" style={{ fontSize: '16px', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fav.jp}</p>
                                                <p className="m-0 font-bold" style={{ fontSize: '13px', color: 'var(--text-gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fav.kr}</p>
                                            </div>
                                            <div className="d-flex items-center shrink-0" style={{ gap: '6px' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); if (window.speechSynthesis) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(fav.jp); u.lang = 'ja-JP'; u.rate = 0.85; window.speechSynthesis.speak(u); } }}
                                                    className="tts-btn" style={{ width: 28, height: 28 }} aria-label="발음 듣기"
                                                ><Volume2 size={14} /></button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); if (confirm('이 표현을 삭제할까요?')) { toggleFavorite(fav); } }}
                                                    className="fav-btn" style={{ width: 28, height: 28 }} aria-label="즐겨찾기 해제"
                                                ><Trash2 size={12} color="#d4537e" /></button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); fav.situationId && handleLearnStart(fav.situationId); }}
                                                    className="fav-go-btn" aria-label="학습하기"
                                                ><ArrowRight size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="d-flex items-center" style={{ gap: '4px', marginTop: '4px' }}>
                                            <span className="fav-situation-chip">{fav.situationTitle}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center" style={{ paddingTop: '60px' }}>
                                <Heart size={36} color="#e5e7eb" style={{ margin: '0 auto 12px' }} />
                                <p className="text-gray-400 font-bold" style={{ fontSize: '14px' }}>아직 저장한 표현이 없어요</p>
                                <p className="text-gray-300 font-medium" style={{ fontSize: '12px', marginTop: '6px' }}>학습 중 하트를 눌러보세요</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Fixed Bottom Navigation */}
            <div className="fixed bottom-8 left-1/2 translate-x-[-50%] w-[90%] max-w-[380px] u-bg-white\/90 u-backdrop-blur u-shadow-2xl u-rounded-full p-2 d-flex items-center justify-around z-50 border border-white/50">
                <button
                    onClick={() => setTab('today')}
                    className={`p-4 u-rounded-full transition-all ${tab === 'today' ? 'bg-peach text-white shadow-lg' : 'text-gray-300 hover:text-gray-400'}`}
                >
                    <Heart size={24} fill={tab === 'today' ? 'white' : 'none'} />
                </button>
                <div className="w-px h-6 bg-gray-100" />
                <button
                    onClick={() => setTab('archive')}
                    className={`p-4 u-rounded-full transition-all ${tab === 'archive' ? 'bg-peach text-white shadow-lg' : 'text-gray-300 hover:text-gray-400'}`}
                >
                    <BookOpen size={24} fill={tab === 'archive' ? 'white' : 'none'} />
                </button>
                <div className="w-px h-6 bg-gray-100" />
                <button
                    onClick={() => setTab('favorites')}
                    className={`p-4 u-rounded-full transition-all relative ${tab === 'favorites' ? 'bg-peach text-white shadow-lg' : 'text-gray-300 hover:text-gray-400'}`}
                >
                    <BookMarked size={24} fill={tab === 'favorites' ? 'white' : 'none'} />
                    {favorites.length > 0 && tab !== 'favorites' && (
                        <span className="fav-badge">{favorites.length}</span>
                    )}
                </button>
                <div className="w-px h-6 bg-gray-100" />
                <button
                    onClick={() => setTab('settings')}
                    className={`p-4 u-rounded-full transition-all ${tab === 'settings' ? 'bg-peach text-white shadow-lg' : 'text-gray-300 hover:text-gray-400'}`}
                >
                    <Settings size={24} fill={tab === 'settings' ? 'white' : 'none'} />
                </button>
            </div>

            <style jsx>{`
                .bg-peach-light { background-color: #fff0f0; }
                .animate-in { animation: animateIn 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
                @keyframes animateIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f1f1; border-radius: 10px; }
                .swipe-container { width: 100%; overflow: hidden; touch-action: pan-y; }
                .swipe-track { will-change: transform; }
                .swipe-panel { flex-shrink: 0; padding: 0 4px; }
            `}</style>
        </div>
    );
}
