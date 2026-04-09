/**
 * Gemini 콘텐츠 생성 + Notion 저장 공통 모듈
 */

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
            },
            required: ['title_kr', 'title_jp', 'desc_kr', 'desc_jp'],
        },
        expressions: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    kr: { type: 'STRING' },
                    jp: { type: 'STRING' },
                    reading_en: { type: 'STRING', description: 'Romaji (e.g. Kimi to issho de...)' },
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

export const buildPrompt = (targetDate) => `당신은 일본어 연애/소셜 표현 전문가입니다.

아래 카테고리 중 하나를 랜덤으로 골라 실전 상황 1개와 관련 표현 3~6개를 생성하세요.

[카테고리]
- 소개팅/미팅 (첫 만남, 자기소개, 연락처 교환)
- 썸/밀당 (카톡/LINE 대화, 은근한 호감 표현, 재회 약속)
- 술자리/이자카야 (건배, 취기 고백, 분위기 띄우기)
- 여행/원거리 (공항 마중, 비행기 타고 만나러 가기, 관광지 데이트)
- 일상 데이트 (카페, 영화, 공원 산책, 집 데이트)
- 감정 표현 (고백, 질투, 화해, 감사, 보고 싶음)
- 문화 체험 (축제, 온천, 벚꽃, 불꽃놀이, 신사 참배)

날짜: ${targetDate}

중요:
1. 이전에 자주 나온 "카페", "벚꽃", "첫 데이트" 같은 뻔한 상황은 피하세요.
2. 구체적이고 생생한 상황을 만드세요 (예: "이자카야에서 사케 마시며 고백하기", "비 오는 날 편의점 앞에서 우산 나눠쓰기").
3. 표현은 최소 3개, 최대 6개로 상황의 복잡도에 따라 자유롭게 조절하세요.
4. 모든 reading_en 필드에는 영어 로마자 발음(Romaji)을 적으세요.
5. 각 표현의 words는 핵심 단어 최대 3개만 포함하세요.`;

// ── Gemini API 호출 ──

export const geminiGenerateContent = async (prompt, apiKey) => {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 4096,
                    response_mime_type: 'application/json',
                    responseSchema: EXPRESSION_SCHEMA,
                },
            }),
        }
    );

    const data = await response.json();
    if (data.error) throw new Error(`Gemini API Error: ${data.error.message}`);
    if (!response.ok) throw new Error(`Gemini API Error (${response.status}): ${JSON.stringify(data)}`);

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return JSON.parse(rawText.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' '));
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
    if (!response.ok) throw new Error(`Notion POST failed (${response.status}): ${JSON.stringify(resBody)}`);
    return resBody;
};

/**
 * Gemini로 콘텐츠 생성 후 Notion에 저장하는 통합 함수
 * @param {Object} opts
 * @param {string} opts.targetDate - YYYY-MM-DD
 * @param {string} opts.geminiApiKey
 * @param {string} opts.notionToken
 * @param {string} opts.situationDbId
 * @param {string} opts.expressionsDbId
 * @param {(msg: string) => void} [opts.onProgress] - 진행 콜백
 * @returns {Promise<{situation: Object, expressionCount: number}>}
 */
export const generateAndSave = async ({
    targetDate,
    geminiApiKey,
    notionToken,
    situationDbId,
    expressionsDbId,
    onProgress,
}) => {
    const prompt = buildPrompt(targetDate);
    const data = await geminiGenerateContent(prompt, geminiApiKey);

    const sitPage = await notionPost('/v1/pages', {
        parent: { database_id: situationDbId },
        properties: {
            Title_KR: { title: [{ text: { content: data.situation.title_kr } }] },
            Title_JP: { rich_text: [{ text: { content: data.situation.title_jp } }] },
            Desc_KR: { rich_text: [{ text: { content: data.situation.desc_kr } }] },
            Desc_JP: { rich_text: [{ text: { content: data.situation.desc_jp } }] },
            Date: { date: { start: targetDate } },
        },
    }, notionToken);

    for (const expr of data.expressions) {
        await notionPost('/v1/pages', {
            parent: { database_id: expressionsDbId },
            properties: {
                Title_KR: { title: [{ text: { content: expr.kr } }] },
                Text_JP: { rich_text: [{ text: { content: expr.jp } }] },
                Reading: { rich_text: [{ text: { content: expr.reading_en } }] },
                Tip: { rich_text: [{ text: { content: JSON.stringify({ kr: expr.tip_kr, jp: expr.tip_jp }) } }] },
                Words: { rich_text: [{ text: { content: JSON.stringify(expr.words) } }] },
                Target: { select: { name: 'INTEGRATED' } },
                Situation: { relation: [{ id: sitPage.id }] },
                Date: { date: { start: targetDate } },
            },
        }, notionToken);
        onProgress?.('.');
    }

    return { situation: data.situation, expressionCount: data.expressions.length };
};
