/**
 * SituationScene
 * 상황 제목 키워드 → 미리 생성된 일러스트 이미지 자동 매핑
 * 런타임 API 비용 0원, Notion 저장 추가 없음
 */
const SCENE_MAP = [
    {
        keywords: ['벚꽃', '벚', '꽃놀이', '봄', '사진', '찍'],
        image: '/situations/cherry_blossom.png',
        label: '봄날의 낭만',
    },
    {
        keywords: ['카페', '커피', '카페에서'],
        image: '/situations/cafe.png',
        label: '아늑한 카페',
    },
    {
        keywords: ['연락처', '번호', '연락', '메시지', '전화'],
        image: '/situations/contact.png',
        label: '연결의 시작',
    },
    {
        keywords: ['데이트', '저녁', '야경', '야간', '밤'],
        image: '/situations/night_date.png',
        label: '두근두근 데이트',
    },
    {
        keywords: ['공원', '산책', '피크닉', '나들이', '잔디'],
        image: '/situations/park.png',
        label: '공원 데이트',
    },
];

const DEFAULT_SCENE = {
    image: '/situations/default.png',
    label: '특별한 순간',
};

const getScene = (title = '') =>
    SCENE_MAP.find(({ keywords }) => keywords.some((kw) => title.includes(kw))) ?? DEFAULT_SCENE;

const SituationScene = ({ title = '' }) => {
    const scene = getScene(title);

    return (
        <div className="situation-scene">
            <img src={scene.image} alt={scene.label} className="situation-scene-img" />
            {/* 하단 무드 라벨 */}
            <div className="scene-label">
                <span>{scene.label}</span>
            </div>
        </div>
    );
};

export default SituationScene;
