import React from 'react';

const SCENE_MAP = {
    '벚꽃': {
        img: '/situations/cherry_blossom.png',
        label: '봄날의 낭만'
    },
    '카페': {
        img: '/situations/cafe.png',
        label: '두근두근 데이트'
    },
    '연락처': {
        img: '/situations/contact.png',
        label: '첫 번째 연결'
    },
    '야간데이트': {
        img: '/situations/night_date.png',
        label: '로맨틱 나이트'
    },
    '공원': {
        img: '/situations/park.png',
        label: '여유로운 산책'
    },
    '기타': {
        img: '/situations/default.png',
        label: '소중한 일상'
    }
};

const SituationScene = ({ title = '' }) => {
    // 키워드로 이미지 찾기
    const sceneKey = Object.keys(SCENE_MAP).find(key => title.includes(key)) || '기타';
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
