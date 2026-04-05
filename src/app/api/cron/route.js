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

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
        });
        return response.json();
    } catch (e) {
        console.error('Telegram Send Error:', e);
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
    if (!response.ok) throw data;
    return data;
};

const geminiRequest = async (prompt) => {
    const payload = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
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
    });
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
    });

    const data = await response.json();
    if (data.error) throw new Error(`Gemini API Error: ${data.error.message}`);
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
    const targetDate = getTomorrowDate();
    let logRawText = ''; 
    
    try {
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!NOTION_TOKEN || !GEMINI_API_KEY) throw new Error('Missing configuration');

        const prompt = `당신은 한국과 일본의 데이트 문화 차이를 깊게 이해한 연애 전문가이자 시니어 언어 선생님입니다.
일본인 배우자/연인과의 실전 상황과 표현을 생성해주세요.

**[핵심 미션]**
1. 통합 구조: 하나의 표현에 kr, jp, reading, tip_kr, tip_jp 정보를 누락 없이 담으세요.
2. 예외 케이스: 설명(desc, tip) 내에 따옴표가 들어갈 경우 반드시 작은따옴표(')로 대체하거나 이스케이프(\") 하세요.
3. 날짜: ${targetDate}

**[반드시 지켜야 할 사항]**
순수한 JSON 문자열만 응답하세요. 서술이나 마크다운 코드 블록(주석 포함)은 절대 사용하지 마세요.`;

        const geminiRes = await geminiRequest(prompt);
        logRawText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        
        let cleaned = logRawText.trim();
        // 마크다운 흔적 제거
        cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        // 제어 문자 및 줄바꿈 정리
        cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");

        let data;
        try {
            data = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('JSON Parse Error Source:', logRawText);
            // 정규표현식 최종 수단
            const match = logRawText.match(/\{[\s\S]*\}/);
            if (match) {
                data = JSON.parse(match[0].replace(/[\u001F\u007F-\u009F]/g, " "));
            } else {
                throw new Error(`Parse failed: ${parseErr.message}`);
            }
        }

        const sitPage = await createSituationPage(data.situation, targetDate);
        const expressions = data.expressions || [];

        for (const expr of expressions) {
            await createExpressionPage(expr, sitPage.id, targetDate);
        }

        await sendTelegramMessage(
            `✅ <b>[Koi Language]</b>\n` +
            `통합 동기화 최종 성공!\n📅 날짜: ${targetDate}\n💖 주제: ${data.situation.title_kr}`
        );

        return NextResponse.json({ success: true, date: targetDate });
    } catch (err) {
        console.error('Final Cron Error:', err);
        const msg = err instanceof Error ? err.message : String(err);
        // 에러 상세 로깅을 텔레그램으로 전송하여 다음 대응 시 참고
        await sendTelegramMessage(`❌ <b>[Koi Language]</b>\n동기화 최후의 수단 실패\n⚠️ 에러: ${msg.substring(0, 500)}`);
        return NextResponse.json({ error: 'Failed', detail: msg }, { status: 500 });
    }
}
