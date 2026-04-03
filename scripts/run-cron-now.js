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
        {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.8,
                response_mime_type: 'application/json',
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ],
        }
    );

    if (status >= 400) {
        throw new Error(`Gemini API Error (${status}): ${body}`);
    }

    const parsed = JSON.parse(body);
    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        if (parsed.promptFeedback) {
            throw new Error(`Gemini blocked: ${JSON.stringify(parsed.promptFeedback)}`);
        }
        throw new Error('Gemini returned empty response');
    }
    return text;
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
    if (status >= 400) {
        console.error('Notion Error:', resBody);
        throw new Error(`Notion POST failed (${status})`);
    }
    return JSON.parse(resBody);
};

// ── 메인 실행 ───────────────────────────────────────────
(async () => {
    console.log(`\n🚀 [${targetDate}] 콘텐츠 생성을 시작합니다...`);

    try {
        const PROMPT = `
        당신은 한국과 일본의 데이트 문화 차이를 깊게 이해하고 있는 연애 전문가이자 언어 선생님입니다.
        일본인과의 만남에서 바로 사용할 수 있는 실전 상황과 표현을 생성해주세요.

        **[핵심 미션: 상황의 다양성 보장]**
        매일 똑같은 '첫 데이트 신청' 상황은 지양하세요. 아래와 같은 다양한 테마 중 하나를 매일 무작위로 선정하여 상황을 만드세요:
        1. **자연스러운 만남**: 이자카야나 바에서 옆자리 사람에게 말 걸기, 서점/카페에서 취향이 비슷한 사람에게 질문하기.
        2. **썸 단계**: 연락처 교환 후 첫 카톡/라인 보내기, 상대방의 취향(음식, 취미) 확인하기, 은근슬쩍 호감 표시하기.
        3. **첫 만남/소개팅**: 약속 장소에서 처음 만난 순간, 메뉴 고르기, 공통점 찾기, 대화가 끊겼을 때 자연스럽게 이어가기.
        4. **데이트 중**: 음식 사진 찍어주기 제안하기, 걷다가 잠깐 쉬어가자고 하기, 일본의 길거리 간식 같이 먹기.
        5. **특별한 순간**: 고백하기, 비 오는 날 우산 같이 쓰기, 축제(마츠리)나 이벤트 같이 가자고 제안하기.

        **[오늘의 날짜]**: ${targetDate} (이 날짜에 맞는 신선한 주제 선정)

        반드시 다음 JSON 형식으로 응답하세요:
        {
          "situation": { 
             "title_kr": "상황 제목 (예: 퇴근길 이자카야에서 우연히 만난 사람에게 말 걸기)", 
             "title_jp": "일본어 제목", 
             "desc_kr": "상황 설명 (한국어, 2~3문장)", 
             "desc_jp": "일본어 상황 설명 (2~3문장)" 
          },
          "expressions": {
            "kr_wants_jp": [
              { 
                "kr": "한국어 표현", 
                "jp": "일본어 표현", 
                "reading": "일본어 발음 (한글만)", 
                "tip": "데이트 팁 (1~2문장)", 
                "words": [{ "word": "단어", "mean": "뜻" }] 
              }
            ],
            "jp_wants_kr": [
              { 
                "kr": "한국어 표현", 
                "jp": "일본어 표현", 
                "reading": "일본어 발음 (한글만)", 
                "tip": "심리 팁 (1~2문장)", 
                "words": [] 
              }
            ]
          }
        }
        `;

        console.log('🤖 Gemini에게 물어보는 중...');
        const rawResponse = await geminiRequest(PROMPT);
        
        // JSON 파싱
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

        // 표현 데이터 합쳐서 순차 처리
        const exprList = [
            ...(data.expressions.kr_wants_jp || []).map((e) => ({ ...e, type: 'kr_wants_jp' })),
            ...(data.expressions.jp_wants_kr || []).map((e) => ({ ...e, type: 'jp_wants_kr' })),
        ];

        console.log(`✍️ 표현 ${exprList.length}개 Notion에 추가 중 (순차 처리)...`);
        for (const expr of exprList) {
            // Notion Rate Limit 방지
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

        console.log('\n\n✅ 모든 작업이 성공적으로 끝났습니다!');
    } catch (err) {
        console.error('\n❌ 실행 실패:', err.message);
        process.exit(1);
    }
})();
