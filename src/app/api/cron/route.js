import { NextResponse } from 'next/server';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SITUATION_DB_ID = process.env.NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATIONS_DB_ID;
const EXPRESSIONS_DB_ID = process.env.NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSIONS_DB_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

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
            temperature: 0.1,
            maxOutputTokens: 2048,
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
                                reading_en: { type: "STRING", description: "Romaji pronunciation (e.g. Kimi to issho de...)" },
                                tip_kr: { type: "STRING" },
                                tip_jp: { type: "STRING" },
                                words: {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            kr: { type: "STRING" },
                                            jp: { type: "STRING" },
                                            reading_en: { type: "STRING", description: "Romaji pronunciation for the word (e.g. Kimi)" }
                                        },
                                        required: ["kr", "jp", "reading_en"]
                                    }
                                }
                            },
                            required: ["kr", "jp", "reading_en", "tip_kr", "tip_jp", "words"]
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
중요: 
1. 모든 reading_en 필드에는 전세계 공용 '영어 로마자 발음(Romaji)'을 적으세요.
2. 각 표현(expressions)마다 단어(words) 리스트는 가장 핵심적인 것 '최대 3개'만 생성하세요.`;

        const geminiRes = await geminiRequest(prompt);
        let rawText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        
        let data = JSON.parse(rawText.replace(/[\u0000-\u001F\u007F-\u009F]/g, " "));

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
                    // 영어 로마자를 Reading 컬럼에 바로 넣습니다. (호환성을 위해)
                    Reading: { rich_text: [{ text: { content: expr.reading_en } }] },
                    Tip: { rich_text: [{ text: { content: JSON.stringify({ kr: expr.tip_kr, jp: expr.tip_jp }) } }] },
                    Words: { rich_text: [{ text: { content: JSON.stringify(expr.words) } }] },
                    Target: { select: { name: 'INTEGRATED' } },
                    Situation: { relation: [{ id: sitPage.id }] },
                    Date: { date: { start: targetDate } },
                },
            });
        }

        await sendTelegramMessage(`✅ <b>Koi Language</b> 로마자 통합 동기화 성공\n주제: ${data.situation.title_kr}`);
        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Cron Error:', err);
        await sendTelegramMessage(`❌ <b>Koi Language</b> 동기화 실패\n에러: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
