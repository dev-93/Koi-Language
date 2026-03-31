'use client';

import React from 'react';
import { Heart } from 'lucide-react';

export default function Loading() {
    return (
        <div className="home-layout justify-center items-center" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #ffffff 0%, #fff5f4 100%)' }}>
            <div className="d-flex flex-col items-center" style={{ gap: '1.5rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                <div 
                    className="u-rounded-full d-flex items-center justify-center" 
                    style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255, 138, 138, 0.15)' }}
                >
                    <Heart size={40} className="text-peach" style={{ animation: 'bounce 1s infinite' }} />
                </div>
                
                <h2 className="m-0 font-black text-[20px]" style={{ color: '#ff8a8a', letterSpacing: '-0.5px' }}>
                    상황을 불러오는 중...
                </h2>
                
                <div className="d-flex" style={{ gap: '0.6rem', marginTop: '0.5rem' }}>
                    <div className="u-rounded-full" style={{ width: '10px', height: '10px', backgroundColor: 'rgba(255, 138, 138, 0.4)', animation: 'bounce 1s infinite 0ms' }} />
                    <div className="u-rounded-full" style={{ width: '10px', height: '10px', backgroundColor: 'rgba(255, 138, 138, 0.6)', animation: 'bounce 1s infinite 150ms' }} />
                    <div className="u-rounded-full" style={{ width: '10px', height: '10px', backgroundColor: 'rgba(255, 138, 138, 0.8)', animation: 'bounce 1s infinite 300ms' }} />
                </div>
            </div>
            
            {/* 전역 로딩용 애니메이션 정의 */}
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .7; }
                }
                @keyframes bounce {
                    0%, 100% { 
                        transform: translateY(-40%); 
                        animation-timing-function: cubic-bezier(0.8,0,1,1); 
                    }
                    50% { 
                        transform: translateY(0); 
                        animation-timing-function: cubic-bezier(0,0,0.2,1); 
                    }
                }
            `}</style>
        </div>
    );
}
