/**
 * Gemini 콘텐츠 생성 + 이미지 생성 + Notion 저장 공통 모듈
 */
import { put } from '@vercel/blob';

// ── 프롬프트 & 스키마 ──

const EXPRESSION_SCHEMA = {
    type: 'OBJECT',
    properties: {
        situation: {
            type: 'OBJECT',
            properties: {
                title_kr: { type: 'STRING' },
                title_jp: { type: 'STRING' },
                desc_kr: { type: 'STRING' },
                desc_jp: { type: 'STRING' },
                image_prompt_en: {
                    type: 'STRING',
                    description:
                        'English scene description for image generation (e.g. "walking together under blooming cherry blossom trees in a park, pink petals falling in the air, romantic spring atmosphere")',
                },
            },
            required: ['title_kr', 'title_jp', 'desc_kr', 'desc_jp', 'image_prompt_en'],
        },
        expressions: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    kr: { type: 'STRING' },
                    jp: { type: 'STRING' },
                    reading_en: {
                        type: 'STRING',
                        description: 'Romaji (e.g. Kimi to issho de...)',
                    },
                    tip_kr: { type: 'STRING' },
                    tip_jp: { type: 'STRING' },
                    words: {
                        type: 'ARRAY',
                        items: {
                            type: 'OBJECT',
                            properties: {
                                kr: { type: 'STRING' },
                                jp: { type: 'STRING' },
                                reading_en: { type: 'STRING' },
                            },
                            required: ['kr', 'jp', 'reading_en'],
                        },
                    },
                },
                required: ['kr', 'jp', 'reading_en', 'tip_kr', 'tip_jp', 'words'],
            },
        },
    },
    required: ['situation', 'expressions'],
};

// ── 커스텀 시리즈 (날짜 지정) ──

const CUSTOM_SERIES = [
    {
        startDate: '2026-04-11',
        days: 2,
        category:
            '자연스럽게 말 걸기 (카페에서 옆자리에게, 서점에서 같은 책 고르다가, 편의점 앞에서, 공원 벤치에서 등 일상 속 자연스러운 첫 대화)',
    },
];

// ── 시리즈 모드 ──

const CATEGORIES = [
    '소개팅/미팅 (첫 만남, 자기소개, 연락처 교환)',
    '썸/밀당 (카톡/LINE 대화, 은근한 호감 표현, 재회 약속)',
    '술자리/이자카야 (건배, 취기 고백, 분위기 띄우기)',
    '여행/원거리 (공항 마중, 비행기 타고 만나러 가기, 관광지 데이트)',
    '일상 데이트 (카페, 영화, 공원 산책, 집 데이트)',
    '감정 표현 (고백, 질투, 화해, 감사, 보고 싶음)',
    '문화 체험 (축제, 온천, 벚꽃, 불꽃놀이, 신사 참배)',
];

/**
 * 시리즈 모드 판별: 1~3일, 15~17일이면 시리즈
 * 같은 시리즈 기간에는 월+시작일 기반으로 동일 카테고리 선택
 * 월초/월중 시리즈가 서로 다른 카테고리, 연속 월도 겹치지 않도록 분배
 */
export const getSeriesInfo = (targetDate) => {
    // 1. 커스텀 시리즈 우선 체크
    const target = new Date(targetDate);
    for (const cs of CUSTOM_SERIES) {
        const start = new Date(cs.startDate);
        const diffDays = Math.round((target - start) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < cs.days) {
            return { category: cs.category, day: diffDays + 1 };
        }
    }

    // 2. 기본 자동 시리즈 (1~3일, 15~17일)
    const date = new Date(targetDate);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    const isFirstSeries = day >= 1 && day <= 3;
    const isSecondSeries = day >= 15 && day <= 17;

    if (!isFirstSeries && !isSecondSeries) return null;

    const seriesDay = isFirstSeries ? day : day - 14;

    // 월초 = 짝수 인덱스, 월중 = 홀수 인덱스로 분배해서 같은 달 내 중복 방지
    // (year * 12 + month)로 매달 2칸씩 이동해서 연속 월 중복도 방지
    const base = ((year * 12 + month) * 2) % CATEGORIES.length;
    const offset = isFirstSeries ? 0 : 1;
    const categoryIndex = (base + offset) % CATEGORIES.length;

    return { category: CATEGORIES[categoryIndex], day: seriesDay };
};

export const buildPrompt = (targetDate, recentTitles = []) => {
    const avoidList =
        recentTitles.length > 0
            ? `\n\n[최근 생성된 상황 - 반드시 피하세요]\n${recentTitles.map((t) => `- ${t}`).join('\n')}`
            : '';

    const series = getSeriesInfo(targetDate);

    const categorySection = series
        ? `[시리즈 모드 - ${series.day}일차]
지정 카테고리: ${series.category}
이 카테고리 안에서 이전 날과 다른 새로운 상황을 만드세요.`
        : `아래 카테고리 중 하나를 랜덤으로 골라주세요.

[카테고리]
- 소개팅/미팅 (첫 만남, 자기소개, 연락처 교환)
- 썸/밀당 (카톡/LINE 대화, 은근한 호감 표현, 재회 약속)
- 술자리/이자카야 (건배, 취기 고백, 분위기 띄우기)
- 여행/원거리 (공항 마중, 비행기 타고 만나러 가기, 관광지 데이트)
- 일상 데이트 (카페, 영화, 공원 산책, 집 데이트)
- 감정 표현 (고백, 질투, 화해, 감사, 보고 싶음)
- 문화 체험 (축제, 온천, 벚꽃, 불꽃놀이, 신사 참배)`;

    return `당신은 일본어 연애/소셜 표현 전문가입니다.

실전 상황 1개와 관련 표현 3~6개를 생성하세요.

${categorySection}

날짜: ${targetDate}${avoidList}

중요:
1. 위 [최근 생성된 상황]과 비슷한 주제나 키워드는 절대 반복하지 마세요.
2. 구체적이고 생생한 상황을 만드세요 (예: "비 오는 날 편의점 앞에서 우산 나눠쓰기", "온천 여관에서 유카타 입고 불꽃놀이 보기").
3. 표현은 최소 3개, 최대 6개로 상황의 복잡도에 따라 자유롭게 조절하세요.
4. 모든 reading_en 필드에는 영어 로마자 발음(Romaji)을 적으세요.
5. 각 표현의 words는 핵심 단어 최대 3개만 포함하세요.
6. image_prompt_en은 상황을 영어로 구체적으로 묘사하세요 (예: "walking together under blooming cherry blossom trees in a park, pink petals falling in the air, romantic spring atmosphere"). 커플의 행동과 장소, 분위기를 포함하세요.`;
};

// ── Gemini API 호출 (fallback 키 지원) ──

/**
 * Gemini API 호출을 실행하고, 실패 시 fallback 키로 재시도
 * @param {Function} requestFn - (apiKey) => Promise 형태의 요청 함수
 * @param {string[]} apiKeys - 시도할 API 키 목록
 * @returns {Promise<*>}
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const withRetryAndFallback = async (
    requestFn,
    apiKeys,
    { maxRetries = 3, delayMs = 5000 } = {}
) => {
    let lastError;
    for (const key of apiKeys) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn(key);
            } catch (err) {
                lastError = err;
                const isOverloaded =
                    err.message?.includes('high demand') || err.message?.includes('overloaded');
                console.warn(
                    `⚠️ Gemini 실패 (키 ${apiKeys.indexOf(key) + 1}, ${attempt}/${maxRetries}): ${err.message}`
                );
                if (isOverloaded && attempt < maxRetries) {
                    await sleep(delayMs * attempt);
                } else {
                    break; // 과부하가 아니면 다음 키로
                }
            }
        }
    }
    throw lastError;
};

// ── Gemini 텍스트 콘텐츠 생성 ──

export const geminiGenerateContent = async (prompt, apiKey) => {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                    response_mime_type: 'application/json',
                    responseSchema: EXPRESSION_SCHEMA,
                },
            }),
        }
    );

    const data = await response.json();
    if (data.error) throw new Error(`Gemini API Error: ${data.error.message}`);
    if (!response.ok)
        throw new Error(`Gemini API Error (${response.status}): ${JSON.stringify(data)}`);

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return JSON.parse(rawText.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' '));
};

// ── Gemini 이미지 생성 ──

const IMAGE_STYLE_PROMPT = 'A cute heartwarming flat vector illustration of a lovely Korean couple';
const IMAGE_STYLE_SUFFIX =
    'soft pastel colors, minimalist background, UI illustration style, clean simple outlines, flat shading, dribbble style, light purple and soft pink tones, 16:9 aspect ratio, horizontal landscape format';

/**
 * Gemini (gemini-3.1-flash-image-preview) 로 상황에 맞는 썸네일 생성
 * @param {string} situationDesc - 영어 장면 묘사
 * @param {string} apiKey - GEMINI_IMAGE_API_KEY
 * @returns {Promise<Buffer>} 이미지 Buffer
 */
export const geminiGenerateImage = async (situationDesc, apiKey) => {
    const prompt = `${IMAGE_STYLE_PROMPT} ${situationDesc}, ${IMAGE_STYLE_SUFFIX}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseModalities: ['TEXT', 'IMAGE'],
                    imageConfig: { aspectRatio: '16:9' },
                },
            }),
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini Image Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!imagePart) throw new Error('Gemini Image: 응답에 이미지가 없습니다');

    return Buffer.from(imagePart.inlineData.data, 'base64');
};

/**
 * 이미지 Buffer를 Vercel Blob에 업로드
 * @param {Buffer} buffer - 이미지 Buffer
 * @param {string} filename - 파일명 (e.g. "2025-04-09.png")
 * @returns {Promise<string>} 업로드된 이미지 URL
 */
export const uploadToBlob = async (buffer, filename) => {
    const { url } = await put(`situations/${filename}`, buffer, {
        access: 'public',
        contentType: 'image/png',
    });
    return url;
};

// ── Notion 저장 ──

const notionPost = async (path, body, token) => {
    const response = await fetch(`https://api.notion.com${path}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    const resBody = await response.json();
    if (!response.ok)
        throw new Error(`Notion POST failed (${response.status}): ${JSON.stringify(resBody)}`);
    return resBody;
};

/**
 * Gemini로 콘텐츠 + 이미지 생성 후 Notion에 저장하는 통합 함수
 * @param {Object} opts
 * @param {string} opts.targetDate - YYYY-MM-DD
 * @param {string} opts.geminiApiKey
 * @param {string} [opts.geminiApiKeyFallback] - 실패 시 사용할 대체 API 키
 * @param {string} [opts.geminiImageApiKey] - 이미지 생성 전용 API 키
 * @param {string} opts.notionToken
 * @param {string} opts.situationDbId
 * @param {string} opts.expressionsDbId
 * @param {(msg: string) => void} [opts.onProgress] - 진행 콜백
 * @returns {Promise<{situation: Object, expressionCount: number, imageUrl: string|null}>}
 */
export const generateAndSave = async ({
    targetDate,
    geminiApiKey,
    geminiApiKeyFallback,
    geminiImageApiKey,
    notionToken,
    situationDbId,
    expressionsDbId,
    onProgress,
}) => {
    const apiKeys = [geminiApiKey, geminiApiKeyFallback].filter(Boolean);

    // 1. 최근 상황 제목 조회 (중복 방지용)
    let recentTitles = [];
    try {
        const recent = await notionPost(
            `/v1/databases/${situationDbId}/query`,
            {
                sorts: [{ property: 'Date', direction: 'descending' }],
                page_size: 7,
            },
            notionToken
        );
        recentTitles = recent.results
            .map((p) => p.properties?.Title_KR?.title?.[0]?.plain_text)
            .filter(Boolean);
    } catch (err) {
        console.warn('최근 상황 조회 실패 (계속 진행):', err.message);
    }

    // 2. 텍스트 콘텐츠 생성 (fallback 키 지원)
    const prompt = buildPrompt(targetDate, recentTitles);
    const data = await withRetryAndFallback((key) => geminiGenerateContent(prompt, key), apiKeys);

    // 3. Gemini 이미지 생성 + Blob 업로드
    let imageUrl = null;
    let imageError = null;
    if (geminiImageApiKey) {
        try {
            const imagePrompt = `${data.situation.image_prompt_en}`;
            onProgress?.('🎨');
            const imageBuffer = await geminiGenerateImage(imagePrompt, geminiImageApiKey);
            if (imageBuffer) {
                imageUrl = await uploadToBlob(imageBuffer, `${targetDate}.png`);
                onProgress?.('📸');
            }
        } catch (err) {
            imageError = err.message;
            console.error('이미지 생성/업로드 실패 (계속 진행):', err.message);
        }
    }

    // 4. Notion에 상황 저장
    const situationProperties = {
        Title_KR: { title: [{ text: { content: data.situation.title_kr } }] },
        Title_JP: { rich_text: [{ text: { content: data.situation.title_jp } }] },
        Desc_KR: { rich_text: [{ text: { content: data.situation.desc_kr } }] },
        Desc_JP: { rich_text: [{ text: { content: data.situation.desc_jp } }] },
        Date: { date: { start: targetDate } },
    };

    if (imageUrl) {
        situationProperties.URL = { rich_text: [{ text: { content: imageUrl } }] };
    }

    const sitPage = await notionPost(
        '/v1/pages',
        {
            parent: { database_id: situationDbId },
            properties: situationProperties,
        },
        notionToken
    );

    // 5. 표현 저장
    for (const expr of data.expressions) {
        await notionPost(
            '/v1/pages',
            {
                parent: { database_id: expressionsDbId },
                properties: {
                    Title_KR: { title: [{ text: { content: expr.kr } }] },
                    Text_JP: { rich_text: [{ text: { content: expr.jp } }] },
                    Reading: { rich_text: [{ text: { content: expr.reading_en } }] },
                    Tip: {
                        rich_text: [
                            {
                                text: {
                                    content: JSON.stringify({ kr: expr.tip_kr, jp: expr.tip_jp }),
                                },
                            },
                        ],
                    },
                    Words: { rich_text: [{ text: { content: JSON.stringify(expr.words) } }] },
                    Target: { select: { name: 'INTEGRATED' } },
                    Situation: { relation: [{ id: sitPage.id }] },
                    Date: { date: { start: targetDate } },
                },
            },
            notionToken
        );
        onProgress?.('.');
    }

    return {
        situation: data.situation,
        expressionCount: data.expressions.length,
        imageUrl,
        imageError,
    };
};
