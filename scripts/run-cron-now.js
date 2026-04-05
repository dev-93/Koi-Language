#!/usr/bin/env node
/* eslint-disable no-undef */
import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SITUATION_DB_ID = process.env.NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATIONS_DB_ID;
const EXPRESSIONS_DB_ID = process.env.NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSIONS_DB_ID;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const getKSTDate = (dateStr) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().split('T')[0];
};

const targetDate = process.argv[2] || getKSTDate();

const httpRequest = (options, body) =>
    new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = https.request(
            {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
                    ...options.headers,
                },
            },
            (res) => {
                let data = '';
                res.on('data', (c) => (data += c));
                res.on('end', () => resolve({ status: res.statusCode, body: data }));
            }
        );
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });

const geminiRequest = async (prompt) => {
    const { status, body } = await httpRequest(
        {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            method: 'POST',
        },
        {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.2, // 결정론적 응답
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
        }
    );

    if (status >= 400) throw new Error(`Gemini API Error (${status}): ${body}`);
    const parsed = JSON.parse(body);
    if (parsed.error) throw new Error(`Gemini Error: ${parsed.error.message}`);
    return parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
};

const notionPost = async (path, body) => {
    const { status, body: resBody } = await httpRequest(
        {
            hostname: 'api.notion.com',
            path,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
            },
        },
        body
    );
    if (status >= 400) throw new Error(`Notion POST failed (${status}): ${resBody}`);
    return JSON.parse(resBody);
};

(async () => {
    console.log(`\n🚀 [${targetDate}] 통합 콘텐츠 생성을 시작합니다...`);

    if (!GEMINI_API_KEY || !NOTION_TOKEN) {
        console.error('❌ 설정 오류: GEMINI_API_KEY 또는 NOTION_TOKEN이 없습니다.');
        return;
    }

    try {
        const PROMPT = `일본인 연인과의 실전 데이트 상황 1개와 관련 표현 3개를 생성하세요.
날짜: ${targetDate}
반드시 순수 JSON만 반환하고, 따옴표는 작은따옴표(') 또는 이스케이프 처리를 하세요.`;

        console.log('🤖 Gemini에게 통합 데이터 요청 중...');
        const rawResponse = await geminiRequest(PROMPT);
        
        let data;
        try {
            data = JSON.parse(rawResponse.replace(/[\u0000-\u001F\u007F-\u009F]/g, " "));
        } catch (e) {
            const cleaned = rawResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
            data = JSON.parse(cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, " "));
        }

        console.log('📝 Notion 상황 페이지 작성 중...');
        const sitPage = await notionPost('/v1/pages', {
            parent: { database_id: SITUATION_DB_ID },
            properties: {
                Title_KR: { title: [{ text: { content: data.situation.title_kr } }] },
                Title_JP: { rich_text: [{ text: { content: data.situation.title_jp } }] },
                Desc_KR: { rich_text: [{ text: { content: data.situation.desc_kr } }] },
                Desc_JP: { rich_text: [{ text: { content: data.situation.desc_jp } }] },
                Date: { date: { start: targetDate } },
            },
        });

        console.log(`✍️ 통합 표현 ${data.expressions.length}개 추가 중...`);
        for (const expr of data.expressions) {
            await new Promise(resolve => setTimeout(resolve, 300));
            await notionPost('/v1/pages', {
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
            process.stdout.write('.');
        }
        console.log(`\n✅ 성공!`);
    } catch (err) {
        console.error(`\n❌ 실패:`, err.message);
    }
})();
