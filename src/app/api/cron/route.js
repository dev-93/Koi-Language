import { NextResponse } from 'next/server';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SITUATION_DB_ID =
    process.env.VITE_NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATION_DB_ID;
const EXPRESSIONS_DB_ID =
    process.env.VITE_NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSION_DB_ID;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const sendTelegramMessage = async (text) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return null;
    const payload = JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' });

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
            }
        );
        return await response.json();
    } catch (e) {
        console.error('Telegram notification failed:', e);
        return null;
    }
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
    if (!response.ok) {
        console.error('Notion API error details:', JSON.stringify(data, null, 2));
        throw new Error(data.message || `Notion API Error (${response.status})`);
    }
    return data;
};

const geminiRequest = async (prompt) => {
    const payload = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2500,
            response_mime_type: 'application/json',
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
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

const getTargetDate = () => {
    const now = new Date();
    const kstNow = new Date(
        now.getTime() + now.getTimezoneOffset() * 60000 + 9 * 60 * 60 * 1000
    );
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

const createExpressionPage = async (expr, type, situationId, date) => {
    await new Promise((r) => setTimeout(r, 300));
    return notionRequest('POST', '/v1/pages', {
        parent: { database_id: EXPRESSIONS_DB_ID },
        properties: {
            Title_KR: { title: [{ text: { content: expr.kr || '' } }] },
            Text_JP: { rich_text: [{ text: { content: expr.jp || '' } }] },
            Reading: {
                rich_text: [{ text: { content: expr.reading || expr.pronunciation || '' } }],
            },
            Tip: { rich_text: [{ text: { content: expr.tip ?? '' } }] },
            Words: { rich_text: [{ text: { content: JSON.stringify(expr.words ?? []) } }] },
            Type: { select: { name: type } },
            Situation: { relation: [{ id: situationId }] },
            Date: { date: { start: date } },
        },
    });
};

export async function GET(request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!NOTION_TOKEN || !GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Missing configuration' }, { status: 500 });
    }

    const targetDate = getTargetDate();
    console.log(`[Cron] Content generation started for date: ${targetDate}`);

    const prompt = `
당신은 한국과 일본의 데이트 문화 차이를 깊게 이해하고 있는 연애 전문가이자 언어 선생님입니다.
내일(${targetDate}) 날짜에 맞는 새로운 데이트 상황과 표현을 JSON 형식으로 생성해주세요.

반드시 다음 JSON 형식으로만 응답하세요.
{
  "situation": {
    "title_kr": "상황 제목 (한국어)",
    "title_jp": "상황 제목 (일본어)",
    "desc_kr": "상황 설명 (한국어, 2~3문장)",
    "desc_jp": "상황 설명 (일본어)"
  },
  "expressions": {
    "kr_wants_jp": [
      {
        "kr": "한국어 표현",
        "jp": "일본어 표현",
        "reading": "일본어 발음 (한글만)",
        "tip": "일본 문화 반영 데이트 팁 (1~2문장)",
        "words": [{ "word": "단어", "mean": "뜻" }]
      }
    ],
    "jp_wants_kr": [
      {
        "kr": "한국어 표현",
        "jp": "일본어 표현",
        "reading": "일본어 발음 (한글만)",
        "tip": "일본인 심리 팁 (1~2문장)",
        "words": [{ "word": "단어", "mean": "뜻" }]
      }
    ]
  }
}
`;

    try {
        const geminiRes = await geminiRequest(prompt);
        const rawText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        if (!rawText) {
            if (geminiRes.promptFeedback) {
                throw new Error(
                    `Gemini blocked response: ${JSON.stringify(geminiRes.promptFeedback)}`
                );
            }
            throw new Error('Gemini returned empty response (possibly safety filters)');
        }

        let data;
        try {
            const jsonStr = rawText.match(/\{[\s\S]*\}/)?.[0] || rawText;
            data = JSON.parse(jsonStr.trim());
        } catch (parseErr) {
            console.error('Gemini Raw:', rawText);
            throw new Error(`JSON Parse error: ${parseErr.message}`);
        }

        if (!data.situation || !data.expressions) {
            throw new Error('Invalid JSON structure from Gemini');
        }

        const sitPage = await createSituationPage(data.situation, targetDate);
        const sitId = sitPage.id;

        const expressions = [
            ...(data.expressions.kr_wants_jp || []).map((e) => ({ ...e, type: 'kr_wants_jp' })),
            ...(data.expressions.jp_wants_kr || []).map((e) => ({ ...e, type: 'jp_wants_kr' })),
        ];

        for (const expr of expressions) {
            await createExpressionPage(expr, expr.type, sitId, targetDate);
        }

        await sendTelegramMessage(
            `✅ <b>[Koi Language]</b>\n` +
                `콘텐츠 업데이트 준비 완료!\n\n` +
                `📅 <b>적용 날짜:</b> ${targetDate}\n` +
                `💖 <b>상황:</b> ${data.situation.title_kr}`
        );

        return NextResponse.json({ success: true, date: targetDate });
    } catch (err) {
        console.error('CRON_ERROR:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown Error';

        await sendTelegramMessage(
            `❌ <b>[Koi Language]</b>\n` +
                `동기화 작업 실패!\n\n` +
                `⚠️ <b>에러:</b> ${errorMessage.substring(0, 500)}`
        );

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
