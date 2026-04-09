import React from 'react';

/**
 * =========================================================================
 * 🎨 [Koi Language UI 전용 이미지 생성 프롬프트 템플릿]
 * 다음번에도 기존 이미지들과 100% 동일한 "귀엽고 포근한 파스텔톤 플랫 일러스트"
 * 스타일을 유지하고 싶다면, 아래의 영문 프롬프트를 AI에게 그대로 이용하세요.
 * =========================================================================
 *
 * [프롬프트 양식]
 * A cute heartwarming flat vector illustration of a lovely Korean couple {상황 영어로 입력}, soft pastel colors, minimalist background, UI illustration style, clean simple outlines, flat shading, dribbble style, light purple and soft pink tones, 16:9 aspect ratio, horizontal landscape format
 */

const SCENE_MAP = {
    cherry_blossom: {
        img: '/situations/cherry_blossom.png',
        label: '봄날의 낭만',
        keywords: ['벚꽃', '봄', '꽃축제', '하나미'],
    },
    movie: {
        img: '/situations/movie.png',
        label: '영화관 데이트',
        keywords: ['영화', '영화관', '극장', '팝콘', '시네마', '관람', '상영'],
    },
    home_date: {
        img: '/situations/home_date.png',
        label: '포근한 집 데이트',
        keywords: ['집', '요리', '초대', '홈데이트', '실내', '방', '요리하기', '넷플릭스'],
    },
    izakaya: {
        img: '/situations/izakaya.png',
        label: '이자카야 데이트',
        keywords: [
            '이자카야',
            '야키토리',
            '사케',
            '일본술',
            '오뎅',
            '꼬치',
            '술집',
            '맥주',
            '하이볼',
        ],
    },
    night_date: {
        img: '/situations/night_date.png',
        label: '로맨틱 나이트',
        keywords: [
            '야간',
            '밤',
            '달빛',
            '노을',
            '술',
            '와인',
            '칵테일',
            '야경',
            '저녁',
            '바',
            '펍',
        ],
    },
    contact: {
        img: '/situations/contact.png',
        label: '첫 번째 연결',
        keywords: [
            '연락처',
            '번호',
            '카톡',
            '메시지',
            '인스타',
            '디엠',
            '전화',
            '문자',
            '고백',
            '첫인상',
        ],
    },
    park: {
        img: '/situations/park.png',
        label: '여유로운 산책',
        keywords: ['공원', '피크닉', '벤치', '강변', '자전거', '산책', '나들이', '실외', '운동'],
    },
    cafe: {
        img: '/situations/cafe.png',
        label: '두근두근 데이트',
        keywords: [
            '카페',
            '커피',
            '디저트',
            '맛집',
            '식사',
            '점심',
            '자기소개',
            '첫만남',
            '레스토랑',
            '데이트',
        ],
    },
};

const DEFAULT_SCENE = {
    img: '/situations/default.png',
    label: '소중한 일상',
};

const SituationScene = ({ title = '', date = '', imageUrl = '' }) => {
    // 1. 제목 키워드 매칭 확인 (가장 정확한 방법)
    const findSceneByKey = () => {
        return Object.values(SCENE_MAP).find((value) =>
            value.keywords.some((keyword) => title.includes(keyword))
        );
    };

    // 2. 키워드 매칭 실패 시 날짜 기반 순환 (Fallback)
    const getFallbackScene = () => {
        const keys = Object.keys(SCENE_MAP);
        const targetDate = date ? new Date(date) : new Date();
        const day = isNaN(targetDate.getTime()) ? 0 : targetDate.getDate();
        return SCENE_MAP[keys[day % keys.length]];
    };

    // 동적 생성 이미지가 있으면 우선 사용, 없으면 기존 키워드 매칭 fallback
    const scene = imageUrl ? null : (findSceneByKey() || getFallbackScene() || DEFAULT_SCENE);

    return (
        <div className="scene-wrapper">
            <div className="scene-container">
                <img
                    src={imageUrl || scene.img}
                    alt={imageUrl ? title : scene.label}
                    className="scene-image"
                />
            </div>
        </div>
    );
};

export default SituationScene;
