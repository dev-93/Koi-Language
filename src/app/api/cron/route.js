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
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                kr: { type: "STRING" },
                                jp: { type: "STRING" },
                                reading: { type: "STRING" },
                                tip_kr: { type: "STRING", description: "한국인 학습자를 위한 데이트 팁" },
                                tip_jp: { type: "STRING", description: "일본인 학습자를 위한 데이트 팁" },
                                words: {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            kr: { type: "STRING" },
                                            jp: { type: "STRING" },
                                            reading: { type: "STRING" }
                                        },
                                        required: ["kr", "jp", "reading"]
                                    }
                                }
                            },
                            required: ["kr", "jp", "reading", "tip_kr", "tip_jp", "words"]
                        }
                    }
                },
                required: ["situation", "expressions"]
            }
        },
    });
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
            Title_KR: { title: [{ text: { content: data.title_kr || '' } }] },
            Title_JP: { rich_text: [{ text: { content: data.title_jp || '' } }] },
            Desc_KR: { rich_text: [{ text: { content: data.desc_kr || '' } }] },
            Desc_JP: { rich_text: [{ text: { content: data.desc_jp || '' } }] },
            Date: { date: { start: date } },
        },
    });

const createExpressionPage = (expr, situationId, date) =>
    notionRequest('POST', '/v1/pages', {
        parent: { database_id: EXPRESSIONS_DB_ID },
        properties: {
            Title_KR: { title: [{ text: { content: expr.kr || '' } }] },
            Text_JP: { rich_text: [{ text: { content: expr.jp || '' } }] },
            Reading: { rich_text: [{ text: { content: expr.reading || '' } }] },
            Tip: { rich_text: [{ text: { content: JSON.stringify({ kr: expr.tip_kr, jp: expr.tip_jp }) } }] },
            Words: { rich_text: [{ text: { content: JSON.stringify(expr.words ?? []) } }] },
            Type: { select: { name: 'integrated' } },
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

**[핵심 미션: 언어 중립 통합 구조]**
이제부터는 한국인용/일본인용을 따로 나누지 않고, 하나의 모델 안에 모든 정보를 담습니다. 
하나의 표현('expressions')에 대해 한국어(kr), 일본어(jp), 일본어 발음(reading), 그리고 각 나라 학습자를 위한 데이트 팁(tip_kr, tip_jp)을 모두 생성하세요.

**[상황의 다양성 보장]**
매일 똑같은 '첫 데이트 신청' 상황은 지양하세요. 아래와 같은 다양한 테마 중 하나를 매일 무작위로 선정하여 상황을 만드세요:
1. 자연스러운 만남, 2. 썸 단계, 3. 첫 만남/소개팅, 4. 데이트 중, 5. 특별한 순간.

날짜: ${targetDate}

반드시 다음 JSON 형식으로만 응답하세요:
{
  "situation": {
    "title_kr": "상황 제목",
    "title_jp": "상황 제목 (일본어)",
    "desc_kr": "상황 설명 (한국어, 2~3문장)",
    "desc_jp": "상황 설명 (일본어)"
  },
  "expressions": [
    {
      "kr": "한국어 표현",
      "jp": "일본어 표현",
      "reading": "일본어 발음 (한글로만)",
      "tip_kr": "한국인 학습자를 위한 데이트 팁",
      "tip_jp": "일본인 학습자를 위한 데이트 팁",
      "words": [
        { "kr": "한국어 단어", "jp": "일본어 단어", "reading": "일본어 발음" }
      ]
    }
  ]
}

*핵심 지침:*
1. 'words' 배열 내 단어들도 반드시 kr, jp, reading 세 가지 정보를 모두 포함해야 합니다.
2. 'tip_kr'은 한국인이 일본인을 만날 때 주의할 점, 'tip_jp'는 일본인이 한국인을 만날 때 주의할 점을 작성하세요.
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

        const expressions = data.expressions || [];

        for (const expr of expressions) {
            await createExpressionPage(expr, sitId, targetDate);
        }

        await sendTelegramMessage(
            `💌 <b>[Koi Language]</b>\n` +
            `새로운 데이트 표현 통합 업데이트 완료!\n\n` +
            `📅 <b>학습 날짜:</b> ${targetDate}\n` +
            `💖 <b>주제:</b> ${data.situation.title_kr}\n\n` +
            `이제 하나의 데이터로 한/일 모두 대응 가능합니다!`
        );

        return NextResponse.json({ success: true, date: targetDate, situation: data.situation.title_kr });
    } catch (err) {
        console.error('Cron job failed:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        await sendTelegramMessage(
            `❌ <b>[Koi Language]</b>\n` +
            `노션 통합 동기화 실패!\n\n` +
            `⚠️ <b>에러:</b> ${errorMessage.substring(0, 500)}`
        );
        return NextResponse.json({ error: 'Cron job failed', detail: errorMessage }, { status: 500 });
    }
}
