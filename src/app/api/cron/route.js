import { NextResponse } from 'next/server';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SITUATION_DB_ID =
    process.env.VITE_NOTION_SITUATION_DB_ID ||
    process.env.NOTION_SITUATION_DB_ID ||
    process.env.NOTION_SITUATIONS_DB_ID;
const EXPRESSIONS_DB_ID =
    process.env.VITE_NOTION_EXPRESSION_DB_ID ||
    process.env.NOTION_EXPRESSION_DB_ID ||
    process.env.NOTION_EXPRESSIONS_DB_ID;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const sendTelegramMessage = async (text) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return null;
    const payload = JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' });

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
    });
    return response.json();
};

const notionRequest = async (method, path, body) => {
    const payload = body ? JSON.stringify(body) : null;
    const response = await fetch(`https://api.notion.com${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        },
        body: payload,
    });

    const data = await response.json();
    if (!response.ok) throw data;
    return data;
};

const geminiRequest = async (prompt) => {
    const payload = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40,
            response_mime_type: 'application/json',
            responseSchema: {
                type: "OBJECT",
                properties: {
                    situation: {
                        type: "OBJECT",
                        properties: {
                            title_kr: { type: "STRING" },
                            title_jp: { type: "STRING" },
                            desc_kr: { type: "STRING" },
                            desc_jp: { type: "STRING" }
                        },
                        required: ["title_kr", "title_jp", "desc_kr", "desc_jp"]
                    },
                    expressions: {
                        type: "OBJECT",
                        properties: {
                            kr_wants_jp: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        kr: { type: "STRING" },
                                        jp: { type: "STRING" },
                                        reading: { type: "STRING" },
                                        tip: { type: "STRING" },
                                        words: {
                                            type: "ARRAY",
                                            items: {
                                                type: "OBJECT",
                                                properties: {
                                                    word: { type: "STRING" },
                                                    mean: { type: "STRING" }
                                                },
                                                required: ["word", "mean"]
                                            }
                                        }
                                    },
                                    required: ["kr", "jp", "reading", "tip", "words"]
                                }
                            },
                            jp_wants_kr: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        kr: { type: "STRING" },
                                        jp: { type: "STRING" },
                                        reading: { type: "STRING" },
                                        tip: { type: "STRING" },
                                        words: {
                                            type: "ARRAY",
                                            items: {
                                                type: "OBJECT",
                                                properties: {
                                                    word: { type: "STRING" },
                                                    mean: { type: "STRING" }
                                                },
                                                required: ["word", "mean"]
                                            }
                                        }
                                    },
                                    required: ["kr", "jp", "reading", "tip", "words"]
                                }
                            }
                        },
                        required: ["kr_wants_jp", "jp_wants_kr"]
                    }
                },
                required: ["situation", "expressions"]
            }
        },
    });
    // 최신 모델인 gemini-2.5-flash 사용 (사용자 프로젝트 설정 유지)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(`Gemini API Error: ${data.error.message} (${data.error.code})`);
    }
    return data;
};

const getTomorrowDate = () => {
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    kstNow.setDate(kstNow.getDate() + 1);
    return kstNow.toISOString().split('T')[0];
};

const createSituationPage = (data, date) =>
    notionRequest('POST', '/v1/pages', {
        parent: { database_id: SITUATION_DB_ID },
        properties: {
            Title_KR: { title: [{ text: { content: data.title_kr || data.titleKr || '' } }] },
            Title_JP: { rich_text: [{ text: { content: data.title_jp || data.titleJp || '' } }] },
            Desc_KR: { rich_text: [{ text: { content: data.desc_kr || data.descKr || '' } }] },
            Desc_JP: { rich_text: [{ text: { content: data.desc_jp || data.descJp || '' } }] },
            Date: { date: { start: date } },
        },
    });

const createExpressionPage = (expr, type, situationId, date) =>
    notionRequest('POST', '/v1/pages', {
        parent: { database_id: EXPRESSIONS_DB_ID },
        properties: {
            Title_KR: { title: [{ text: { content: expr.kr || '' } }] },
            Text_JP: { rich_text: [{ text: { content: expr.jp || '' } }] },
            Reading: { rich_text: [{ text: { content: expr.reading || expr.pronunciation || '' } }] },
            Tip: { rich_text: [{ text: { content: expr.tip ?? '' } }] },
            Words: { rich_text: [{ text: { content: JSON.stringify(expr.words ?? []) } }] },
            Type: { select: { name: type } },
            Situation: { relation: [{ id: situationId }] },
            Date: { date: { start: date } },
        },
    });

export async function GET(request) {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!NOTION_TOKEN || !GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Missing configuration' }, { status: 500 });
    }

    if (!SITUATION_DB_ID || !EXPRESSIONS_DB_ID) {
        return NextResponse.json({ error: 'Database IDs missing' }, { status: 500 });
    }

    const targetDate = getTomorrowDate();

    const prompt = `당신은 한국과 일본의 데이트 문화 차이를 깊게 이해하고 있는 연애 전문가이자 언어 선생님입니다.
일본인과의 만남에서 바로 사용할 수 있는 실전 상황과 표현을 생성해주세요.

**[핵심 미션: 상황의 다양성 보장]**
매일 똑같은 '첫 데이트 신청' 상황은 지양하세요. 아래와 같은 다양한 테마 중 하나를 매일 무작위로 선정하여 상황을 만드세요:
1. **자연스러운 만남**: 이자카야나 바에서 옆자리 사람에게 말 걸기, 서점/카페에서 취향이 비슷한 사람에게 질문하기.
2. **썸 단계**: 연락처 교환 후 첫 카톡/라인 보내기, 상대방의 취향(음식, 취미) 확인하기, 은근슬쩍 호감 표시하기.
3. **첫 만남/소개팅**: 약속 장소에서 처음 만난 순간, 메뉴 고르기, 공통점 찾기, 대화가 끊겼을 때 자연스럽게 이어가기.
4. **데이트 중**: 음식 사진 찍어주기 제안하기, 걷다가 잠깐 쉬어가자고 하기, 일본의 길거리 간식 같이 먹기.
5. **특별한 순간**: 고백하기, 비 오는 날 우산 같이 쓰기, 축제(마츠리)나 이벤트 같이 가자고 제안하기.

날짜: ${targetDate}

반드시 다음 JSON 형식으로만 응답하세요:
{
  "situation": {
    "title_kr": "상황 제목",
    "title_jp": "상황 제목 (일본어)",
    "desc_kr": "상황 설명 (한국어, 2~3문장)",
    "desc_jp": "상황 설명 (일본어)"
  },
  "expressions": {
    "kr_wants_jp": [
      {
        "kr": "한국어 표현",
        "jp": "일본어 표현",
        "reading": "일본어 발음 (한글로만)",
        "tip": "데이트 팁 (1~2문장)",
        "words": [{ "word": "단어", "mean": "뜻" }]
      }
    ],
    "jp_wants_kr": [
      {
        "kr": "한국어 표현",
        "jp": "일본어 표현",
        "reading": "일본어 발음 (한글로만)",
        "tip": "심리 팁 (1~2문장)",
        "words": [{ "word": "단어", "mean": "뜻" }]
      }
    ]
  }
}

*핵심 지침:*
1. [필수] 모든 문자열은 따옴표가 겹치지 않도록 주의하세요. 문자열 안의 따옴표는 작은따옴표(')를 사용하거나 반드시 역슬래시로 이스케이프(\") 하세요.
2. 'tip'은 구체적이고 실전적인 일본 문화/심리 팁이어야 합니다.
3. 말투는 친근하고 센스 있게 작성하세요.
`;

    try {
        const geminiRes = await geminiRequest(prompt);
        const rawText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (!rawText) throw new Error('Gemini returned empty response');

        let jsonText = rawText;
        const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/) || rawText.match(/(\{[\s\S]*\})/);
        if (jsonMatch) jsonText = jsonMatch[1];

        let data;
        try {
            data = JSON.parse(jsonText.trim());
        } catch (parseErr) {
            const cleanedJson = jsonText.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
            data = JSON.parse(cleanedJson);
        }

        const sitPage = await createSituationPage(data.situation, targetDate);
        const sitId = sitPage.id;

        const expressions = [
            ...(data.expressions.kr_wants_jp || []).map(e => ({ ...e, type: 'kr_wants_jp' })),
            ...(data.expressions.jp_wants_kr || []).map(e => ({ ...e, type: 'jp_wants_kr' }))
        ];

        for (const expr of expressions) {
            await createExpressionPage(expr, expr.type, sitId, targetDate);
        }

        await sendTelegramMessage(
            `💌 <b>[Koi Language]</b>\n` +
            `새로운 데이트 표현 업데이트 완료!\n\n` +
            `📅 <b>학습 날짜:</b> ${targetDate}\n` +
            `💖 <b>주제:</b> ${data.situation.title_kr}\n\n` +
            `지금 바로 앱에서 확인해보세요!`
        );

        return NextResponse.json({ success: true, date: targetDate, situation: data.situation.title_kr });
    } catch (err) {
        console.error('Cron job failed:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        await sendTelegramMessage(
            `❌ <b>[Koi Language]</b>\n` +
            `노션 동기화 작업 실패!\n\n` +
            `⚠️ <b>에러:</b> ${errorMessage.substring(0, 500)}`
        );
        return NextResponse.json({ error: 'Cron job failed', detail: errorMessage }, { status: 500 });
    }
}
