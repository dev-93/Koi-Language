#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Koi Language: 오늘의 콘텐츠 수동 생성 스크립트
 */
import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const SITUATION_DB_ID = process.env.VITE_NOTION_SITUATION_DB_ID;
const EXPRESSIONS_DB_ID = process.env.VITE_NOTION_EXPRESSION_DB_ID;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/** KST 기준 날짜 계산 */
const getKSTDate = (dateStr) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().split('T')[0];
};

const targetDate = process.argv[2] || getKSTDate();

// ── HTTP Helper ──────────────────────────────────────────
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

// ── Gemini ───────────────────────────────────────────────
const geminiRequest = async (prompt) => {
    const { status, body } = await httpRequest(
        {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            method: 'POST',
        },
        { contents: [{ parts: [{ text: prompt }] }] }
    );

    if (status >= 400) {
        throw new Error(`Gemini API Error (${status}): ${body}`);
    }

    const parsed = JSON.parse(body);
    return parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
};

// ── Notion ───────────────────────────────────────────────
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
    if (status >= 400) throw new Error(`Notion POST failed: ${resBody}`);
    return JSON.parse(resBody);
};

// ── 메인 실행 ───────────────────────────────────────────
(async () => {
    console.log(`\n🚀 [${targetDate}] 콘텐츠 생성을 시작합니다...`);

    try {
        const PROMPT = `
        연애/데이트 일본어 학습을 위한 JSON 형식의 콘텐츠를 생성해주세요.
        반드시 JSON 파일만 마크다운 없이 반환하세요.
        {
          "situation": { 
             "title_kr": "상황 제목", 
             "title_jp": "일본어 제목", 
             "desc_kr": "설명 (2~3문장)", 
             "desc_jp": "일본어 설명 (2~3문장)" 
          },
          "expressions": {
            "kr_wants_jp": [
              { 
                "kr": "한국어 표현", 
                "jp": "일본어 표현", 
                "reading": "일본어 한국어 발음 표기", 
                "tip": "데이트 팁", 
                "words": [{ "word": "단어", "mean": "뜻" }] 
              }
            ],
            "jp_wants_kr": [
              { 
                "kr": "한국어 표현", 
                "jp": "일본어 표현", 
                "reading": "발음", 
                "tip": "", 
                "words": [] 
              }
            ]
          }
        }
        주의: 'words' 배열의 각 요소는 반드시 'word'와 'mean' 필수 키를 포함해야 합니다.
        `;

        console.log('🤖 Gemini에게 물어보는 중...');
        const rawResponse = await geminiRequest(PROMPT);
        // JSON 파싱 (안전 처리)
        const jsonStr = rawResponse.match(/\{[\s\S]*\}/)?.[0] || rawResponse;
        const data = JSON.parse(jsonStr);

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

        // 표현 데이터 합쳐서 처리
        const exprList = [
            ...data.expressions.kr_wants_jp.map((e) => ({ ...e, type: 'kr_wants_jp' })),
            ...data.expressions.jp_wants_kr.map((e) => ({ ...e, type: 'jp_wants_kr' })),
        ];

        console.log(`✍️ 표현 ${exprList.length}개 Notion에 추가 중...`);
        for (const expr of exprList) {
            // words 데이터 검증 (word가 없는 요소 필터링)
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
        }

        console.log('\n✅ 모든 작업이 성공적으로 끝났습니다!');
    } catch (err) {
        console.error('\n❌ 실행 실패:', err.message);
    }
})();
