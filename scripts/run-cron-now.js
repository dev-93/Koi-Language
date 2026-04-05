#!/usr/bin/env node
/* eslint-disable no-undef */
import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const SITUATION_DB_ID = process.env.VITE_NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATIONS_DB_ID;
const EXPRESSIONS_DB_ID = process.env.VITE_NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSIONS_DB_ID;
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
    console.log(`\n🚀 [${targetDate}] 콘텐츠 생성을 시작합니다...`);

    if (!GEMINI_API_KEY || !NOTION_TOKEN) {
        console.error('❌ 설정 오류: GEMINI_API_KEY 또는 NOTION_TOKEN이 없습니다.');
        return;
    }

    if (!SITUATION_DB_ID || !EXPRESSIONS_DB_ID) {
        console.error('❌ 설정 오류: Notion DB ID가 설정되지 않았습니다.');
        return;
    }

    try {
        const PROMPT = `당신은 한국과 일본의 데이트 문화 차이를 깊게 이해하고 있는 연애 전문가이자 언어 선생님입니다.
일본인과의 만남에서 바로 사용할 수 있는 실전 상황과 표현을 생성해주세요.

**[핵심 미션: 상황의 다양성 보장]**
매일 똑같은 '첫 데이트 신청' 상황은 지양하세요. 아래와 같은 다양한 테마 중 하나를 매일 무작위로 선정하여 상황을 만드세요:
1. **자연스러운 만남**, 2. **썸 단계**, 3. **첫 만남/소개팅**, 4. **데이트 중**, 5. **특별한 순간**.

날짜: ${targetDate}

반드시 다음 JSON 형식으로 응답하세요:
{
  "situation": { "title_kr": "제목", "title_jp": "제목JP", "desc_kr": "설명", "desc_jp": "설명JP" },
  "expressions": {
    "kr_wants_jp": [{ "kr": "표현", "jp": "표현JP", "reading": "발음", "tip": "팁", "words": [{"word":"W","mean":"M"}] }],
    "jp_wants_kr": [{ "kr": "표현", "jp": "표현JP", "reading": "발음", "tip": "팁", "words": [] }]
  }
}

*지침: 문자열 내 따옴표는 반드시 이스케이프(\") 하세요.*
`;

        console.log('🤖 Gemini에게 물어보는 중...');
        const rawResponse = await geminiRequest(PROMPT);
        let jsonStr = rawResponse;
        const match = rawResponse.match(/(\{[\s\S]*\})/);
        if (match) jsonStr = match[1];

        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch (e) {
            console.error('⚠️ JSON parsing failed. Attempting cleanup...');
            data = JSON.parse(jsonStr.trim().replace(/[\\u0000-\\u001F\\u007F-\\u009F]/g, ''));
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

        const exprList = [
            ...(data.expressions.kr_wants_jp || []).map((e) => ({ ...e, type: 'kr_wants_jp' })),
            ...(data.expressions.jp_wants_kr || []).map((e) => ({ ...e, type: 'jp_wants_kr' })),
        ];

        console.log(`✍️ 표현 ${exprList.length}개 추가 중...`);
        for (const expr of exprList) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const safeWords = (expr.words || []).filter((w) => w && w.word);
            await notionPost('/v1/pages', {
                parent: { database_id: EXPRESSIONS_DB_ID },
                properties: {
                    Title_KR: { title: [{ text: { content: expr.kr } }] },
                    Text_JP: { rich_text: [{ text: { content: expr.jp } }] },
                    Reading: { rich_text: [{ text: { content: expr.reading } }] },
                    Tip: { rich_text: [{ text: { content: expr.tip || '' } }] },
                    Words: { rich_text: [{ text: { content: JSON.stringify(safeWords) } }] },
                    Type: { select: { name: expr.type } },
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
