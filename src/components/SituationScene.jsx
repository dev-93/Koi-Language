import React from 'react';

const SCENE_MAP = {
    // 1순위: 매우 특징적이고 구체적인 상황들 (가장 겹치기 어려운 단어들)
    cherry_blossom: {
        img: '/situations/cherry_blossom.png',
        label: '봄날의 낭만',
        keywords: ['벚꽃', '봄', '꽃축제'],
    },
    movie: {
        img: '/situations/movie.png',
        label: '영화관 데이트',
        keywords: ['영화', '영화관', '극장', '팝콘', '시네마', '관람', '상영'],
    },
    home_date: {
        img: '/situations/home_date.png',
        label: '포근한 집 데이트',
        keywords: ['집', '요리', '초대', '홈데이트', '실내', '방', '요리하기'],
    },
    night_date: {
        img: '/situations/night_date.png',
        label: '로맨틱 나이트',
        keywords: ['야간', '밤', '달빛', '노을', '술', '와인', '칵테일', '야경', '저녁'],
    },
    contact: {
        img: '/situations/contact.png',
        label: '첫 번째 연결',
        keywords: ['연락처', '번호', '카톡', '메시지', '인스타', '디엠', '전화', '문자'],
    },
    // 2순위: 빈도수가 꽤 높은 흔한 상황들 (공원, 산책)
    park: {
        img: '/situations/park.png',
        label: '여유로운 산책',
        keywords: ['공원', '피크닉', '벤치', '강변', '자전거', '산책', '나들이', '실외'],
    },
    // 3순위: 가장 흔하게 쓰이는 포괄적 단어들 (가장 마지막에 검사해서 다른 특수 키워드들에게 양보)
    cafe: {
        img: '/situations/cafe.png',
        label: '두근두근 데이트',
        keywords: ['카페', '커피', '디저트', '맛집', '식사', '점심', '자기소개', '첫만남'],
    },
    // 최하위: 매칭 실패 시 사용되는 기본값 (코드에서 이 키워드들을 직접 검사하진 않음)
    default: {
        img: '/situations/default.png',
        label: '소중한 일상',
        keywords: [],
    },
};

const SituationScene = ({ title = '', date = '' }) => {
    // 1. 우선순위: 제목 키워드 매칭 확인
    let sceneKey = Object.keys(SCENE_MAP).find((key) =>
        SCENE_MAP[key].keywords.some((keyword) => title.includes(keyword))
    );

    // 2. 키워드 매칭 실패 시: 날짜(Day) 정보를 활용해 순환(Rotation)
    if (!sceneKey || sceneKey === 'default') {
        const scenes = Object.keys(SCENE_MAP).filter((k) => k !== 'default');
        // 날짜가 없으면 오늘 날짜 기준, 있으면 해당 날짜의 '일' 정보를 가져옴
        const targetDate = date ? new Date(date) : new Date();
        const day = targetDate.getDate() || 0;
        sceneKey = scenes[day % scenes.length];
    }

    const { img, label } = SCENE_MAP[sceneKey];

    return (
        <div className="scene-wrapper">
            <div className="scene-container">
                <img src={img} alt={label} className="scene-image" />
            </div>
        </div>
    );
};

export default SituationScene;
