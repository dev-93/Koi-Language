import React from 'react';

const SCENE_MAP = {
    'cherry_blossom': {
        img: '/situations/cherry_blossom.png',
        label: '봄날의 낭만',
        keywords: ['벚꽃', '봄', '꽃', '축제', '나들이', '실외']
    },
    'cafe': {
        img: '/situations/cafe.png',
        label: '두근두근 데이트',
        keywords: ['카페', '커피', '디저트', '맛집', '식사', '점심', '저녁', '자기소개', '첫만남']
    },
    'contact': {
        img: '/situations/contact.png',
        label: '첫 번째 연결',
        keywords: ['연락처', '번호', '카톡', '메시지', '인스타', '디엠', '전화', '문자']
    },
    'night_date': {
        img: '/situations/night_date.png',
        label: '로맨틱 나이트',
        keywords: ['야간', '밤', '달빛', '노을', '술', '와인', '칵테일', '야경']
    },
    'park': {
        img: '/situations/park.png',
        label: '여유로운 산책',
        keywords: ['공원', '피크닉', '벤치', '강변', '자전거', '산책']
    },
    'default': {
        img: '/situations/default.png',
        label: '소중한 일상',
        keywords: []
    }
};

const SituationScene = ({ title = '', date = '' }) => {
    // 1. 우선순위: 제목 키워드 매칭 확인
    let sceneKey = Object.keys(SCENE_MAP).find(key => 
        SCENE_MAP[key].keywords.some(keyword => title.includes(keyword))
    );

    // 2. 키워드 매칭 실패 시: 날짜(Day) 정보를 활용해 순환(Rotation)
    if (!sceneKey || sceneKey === 'default') {
        const scenes = Object.keys(SCENE_MAP).filter(k => k !== 'default');
        // 날짜가 없으면 오늘 날짜 기준, 있으면 해당 날짜의 '일' 정보를 가져옴
        const targetDate = date ? new Date(date) : new Date();
        const day = targetDate.getDate() || 0;
        sceneKey = scenes[day % scenes.length];
    }
    
    const { img, label } = SCENE_MAP[sceneKey];

    return (
        <div className="scene-wrapper">
            <div className="scene-container">
                <img 
                    src={img} 
                    alt={label} 
                    className="scene-image" 
                />
            </div>
        </div>
    );
};

export default SituationScene;
