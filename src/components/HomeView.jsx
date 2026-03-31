'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Calendar, 
    BookOpen, 
    Heart, 
    MessageCircle, 
    ChevronRight, 
    CheckCircle2, 
    Clock, 
    Coffee, 
    Search,
    BookMarked,
    HelpCircle,
    UserCircle,
    Settings,
    ArrowRight
} from 'lucide-react';
import SituationScene from './SituationScene';

export default function HomeView({ initialSituations = [] }) {
    const router = useRouter();
    const [tab, setTab] = useState('today'); // 'today' | 'archive'
    const [situations, setSituations] = useState(initialSituations);
    const [searchQuery, setSearchQuery] = useState('');

    // 1. 온보딩 여부 확인 (클라이언트 사이드에서만 동작)
    useEffect(() => {
        const onboardingStatus = localStorage.getItem('onboarding_complete');
        if (!onboardingStatus) {
            router.push('/onboarding'); // Next.js 방식으로 이동
        }
    }, [router]);

    // 서버에서 받은 데이터가 나중에 업데이트될 경우를 대비
    useEffect(() => {
        if (initialSituations.length > 0) {
            setSituations(initialSituations);
        }
    }, [initialSituations]);

    const todayDate = new Date().toISOString().split('T')[0];
    
    // 오늘의 표현 찾기 (가장 최근 데이터 하나)
    const currentSituation = situations[0];
    
    // 이전에 공부했던 내역들 (아카이브)
    const archiveSituations = situations.slice(1).filter(s => 
        s.title.kr.includes(searchQuery) || s.title.jp.includes(searchQuery)
    );

    const handleLearnStart = (situationId) => {
        router.push(`/learn/${situationId}`);
    };

    return (
        <div className="home-layout">
            {/* Header Section */}
            <div className="header-wrapper">
                <div className="d-flex flex-col gap-1">
                    <p className="header-subtitle">KOI LANGUAGE</p>
                    <h1 className="title-cute m-0 text-left" style={{ fontSize: '1.8rem' }}>恋のランゲージ</h1>
                </div>
                <div className="d-flex items-center gap-4">
                    <button className="p-2 u-shadow-md u-rounded-full u-bg-white\/80 u-backdrop-blur border-none hover:bg-white cursor-pointer transition-all">
                        <Search size={22} className="text-gray-400" />
                    </button>
                    <button className="p-2 u-shadow-md u-rounded-full u-bg-white\/80 u-backdrop-blur border-none hover:bg-white cursor-pointer transition-all">
                        <UserCircle size={22} className="text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="u-bg-white\/80 u-backdrop-blur u-shadow-lg u-rounded-3xl p-1-5 w-full max-w-[420px] d-flex mb-10">
                <button 
                    onClick={() => setTab('today')}
                    className={`flex-1 py-3 px-6 u-rounded-2xl font-black text-[15px] border-none transition-all cursor-pointer ${
                        tab === 'today' ? 'bg-peach text-white u-shadow-md' : 'bg-transparent text-gray-400'
                    }`}
                >
                    <div className="d-flex items-center justify-center gap-2">
                        <Heart size={16} fill={tab === 'today' ? "white" : "none"} />
                        <span>오늘의 표현</span>
                    </div>
                </button>
                <button 
                    onClick={() => setTab('archive')}
                    className={`flex-1 py-3 px-6 u-rounded-2xl font-black text-[15px] border-none transition-all cursor-pointer ${
                        tab === 'archive' ? 'bg-peach text-white u-shadow-md' : 'bg-transparent text-gray-400'
                    }`}
                >
                    <div className="d-flex items-center justify-center gap-2">
                        <BookMarked size={16} fill={tab === 'archive' ? "white" : "none"} />
                        <span>지난 학습</span>
                    </div>
                </button>
            </div>

            {/* Tab Contents */}
            {tab === 'today' ? (
                /* Today Section */
                <div className="w-full max-w-[420px] d-flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {currentSituation ? (
                        <div 
                            className="learn-card-main u-shadow-xl hover:translate-y-[-4px] transition-transform cursor-pointer"
                            onClick={() => handleLearnStart(currentSituation.id)}
                        >
                            {/* 상황 씬 */}
                            <SituationScene title={currentSituation.title.kr} date={currentSituation.date} />
                            
                            <div className="flex-1 d-flex flex-col items-center justify-start gap-4 w-full pt-4">
                                <h2 className="m-0 text-[30px] font-black text-center leading-tight text-gray-800">
                                    {currentSituation.title.kr}
                                </h2>
                                <p className="m-0 text-[14px] font-medium text-gray-400 text-center leading-relaxed px-4">
                                    {currentSituation.desc.kr}
                                </p>
                            </div>

                            <button className="btn btn-primary u-rounded-full mt-8 py-5 gap-3 hover:scale-[1.02] active:scale-[0.98]">
                                <span className="text-[17px] font-black">학습 시작하기</span>
                                <ArrowRight size={20} strokeWidth={3} />
                            </button>
                        </div>
                    ) : (
                        <div className="learn-card-main u-shadow-xl justify-center items-center h-[480px]">
                            <p className="m-0 font-black text-gray-400 text-[15px]">데이터를 불러오지 못했어요.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Archive Section */
                <div className="w-full max-w-[420px] d-flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="u-bg-white\/80 u-backdrop-blur u-shadow-md u-rounded-2xl p-4 flex items-center gap-3">
                        <Search size={18} className="text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="공부했던 표현들을 검색해 보세요" 
                            className="p-0 border-none bg-transparent font-bold text-[14px] text-gray-600 focus:outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="d-flex flex-col gap-4 max-h-[500px] overflow-y-auto px-1 py-2">
                        {archiveSituations.length > 0 ? (
                            archiveSituations.map(situation => (
                                <div 
                                    key={situation.id}
                                    onClick={() => handleLearnStart(situation.id)}
                                    className="u-bg-white\/80 u-backdrop-blur u-shadow-md u-rounded-2xl p-5 d-flex items-center justify-between hover:translate-x-1 transition-all cursor-pointer border-none bg-white"
                                >
                                    <div className="d-flex flex-col gap-1">
                                        <div className="d-flex items-center gap-2">
                                            <Calendar size={12} className="text-peach" />
                                            <span className="text-[11px] font-black text-peach tracking-tighter">
                                                {situation.date?.replace(/-/g, '.')}
                                            </span>
                                        </div>
                                        <h3 className="m-0 text-[18px] font-black text-gray-800 leading-tight">
                                            {situation.title.kr}
                                        </h3>
                                    </div>
                                    <div className="w-10 h-10 u-rounded-full bg-peach-light d-flex items-center justify-center text-peach">
                                        <ChevronRight size={20} />
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
            )}

            {/* Fixed Bottom Navigation (Optional) */}
            <div className="fixed bottom-8 left-1/2 translate-x-[-50%] w-[90%] max-w-[380px] u-bg-white\/90 u-backdrop-blur u-shadow-xl u-rounded-full p-2 d-flex items-center justify-around z-50 border border-white/50">
                <button 
                    onClick={() => setTab('today')}
                    className={`p-4 u-rounded-full transition-all ${tab === 'today' ? 'bg-peach text-white shadow-lg' : 'text-gray-300'}`}
                >
                    <Heart size={24} fill={tab === 'today' ? "white" : "none"} />
                </button>
                <div className="w-px h-6 bg-gray-100" />
                <button 
                    onClick={() => setTab('archive')}
                    className={`p-4 u-rounded-full transition-all ${tab === 'archive' ? 'bg-peach text-white shadow-lg' : 'text-gray-300'}`}
                >
                    <BookOpen size={24} fill={tab === 'archive' ? "white" : "none"} />
                </button>
                <div className="w-px h-6 bg-gray-100" />
                <button className="p-4 u-rounded-full text-gray-300">
                    <Settings size={24} />
                </button>
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
