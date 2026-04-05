import { NextResponse } from 'next/server';

// 환경 변수 유연하게 매핑
const getEnv = (key) => process.env[key] || process.env[`VITE_${key}`];

const NOTION_TOKEN = getEnv('NOTION_TOKEN');
const SITUATION_DB_ID = getEnv('NOTION_SITUATION_DB_ID') || getEnv('NOTION_SITUATIONS_DB_ID');
const EXPRESSIONS_DB_ID = getEnv('NOTION_EXPRESSION_DB_ID') || getEnv('NOTION_EXPRESSIONS_DB_ID');
const GEMINI_API_KEY = getEnv('GEMINI_API_KEY');
const TELEGRAM_BOT_TOKEN = getEnv('TELEGRAM_BOT_TOKEN');
const TELEGRAM_CHAT_ID = getEnv('TELEGRAM_CHAT_ID');

const sendTelegramMessage = async (text) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return null;
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
        });
    } catch (e) {
        console.error('Telegram Error:', e);
    }
};

const notionRequest = async (method, path, body) => {
    const response = await fetch(`https://api.notion.com${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Notion Error: ${JSON.stringify(data)}`);
    return data;
};

const geminiRequest = async (prompt) => {
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.2, // 더 결정론적이고 짧은 응답 유도
            maxOutputTokens: 2048, // 충분한 토큰 확보
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
                                tip_kr: { type: "STRING" },
                                tip_jp: { type: "STRING" },
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
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data;
};

export async function GET(request) {
    const now = new Date();
    const targetDate = new Date(now.getTime() + 9 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!NOTION_TOKEN || !GEMINI_API_KEY) throw new Error('Env configuration missing');

        const prompt = `일본인 연인과의 실전 데이트 상황 1개와 관련 표현 3개를 생성하세요.
날짜: ${targetDate}
반드시 순수 JSON만 반환하고, 텍스트 내 따옴표는 작은따옴표(')를 사용하세요.`;

        const geminiRes = await geminiRequest(prompt);
        let rawText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        
        // 잘림 방지 및 정규화
        let data;
        try {
            data = JSON.parse(rawText.replace(/[\u0000-\u001F\u007F-\u009F]/g, " "));
        } catch (e) {
            // 끝이 잘렸을 경우를 대비한 최소한의 보정
            if (rawText.trim().endsWith('"')) rawText += '}]}';
            else if (!rawText.trim().endsWith('}')) rawText += '}';
            data = JSON.parse(rawText.replace(/[\u0000-\u001F\u007F-\u009F]/g, " "));
        }

        const sitPage = await notionRequest('POST', '/v1/pages', {
            parent: { database_id: SITUATION_DB_ID },
            properties: {
                Title_KR: { title: [{ text: { content: data.situation.title_kr } }] },
                Title_JP: { rich_text: [{ text: { content: data.situation.title_jp } }] },
                Desc_KR: { rich_text: [{ text: { content: data.situation.desc_kr } }] },
                Desc_JP: { rich_text: [{ text: { content: data.situation.desc_jp } }] },
                Date: { date: { start: targetDate } },
            },
        });

        for (const expr of data.expressions) {
            await notionRequest('POST', '/v1/pages', {
                parent: { database_id: EXPRESSIONS_DB_ID },
                properties: {
                    Title_KR: { title: [{ text: { content: expr.kr } }] },
                    Text_JP: { rich_text: [{ text: { content: expr.jp } }] },
                    Reading: { rich_text: [{ text: { content: expr.reading } }] },
                    Tip: { rich_text: [{ text: { content: JSON.stringify({ kr: expr.tip_kr, jp: expr.tip_jp }) } }] },
                    Words: { rich_text: [{ text: { content: JSON.stringify(expr.words) } }] },
                    Type: { select: { name: 'integrated' } },
                    Situation: { relation: [{ id: sitPage.id }] },
                    Date: { date: { start: targetDate } },
                },
            });
        }

        await sendTelegramMessage(`✅ <b>Koi Language</b> 통합 동기화 성공\n주제: ${data.situation.title_kr}`);
        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Final Patch Error:', err);
        await sendTelegramMessage(`❌ <b>Koi Language</b> 동기화 실패\n에러: ${err.message.substring(0, 100)}`);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
