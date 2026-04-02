#!/usr/bin/env node
/**
/**
 * Koi Language: Notion 데이터 중 잘못된 일본어 발음(히라가나/카타카나)을 한글 발음으로 수정하는 스크립트
 */
import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const EXPRESSIONS_DB_ID = process.env.VITE_NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSION_DB_ID;

if (!NOTION_TOKEN || !GEMINI_API_KEY || !EXPRESSIONS_DB_ID) {
    console.error('❌ 필수 환경 변수가 누락되었습니다. (.env 파일을 확인하세요)');
    process.exit(1);
}

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

// ── Notion ───────────────────────────────────────────────
const notionRequest = async (method, path, body) => {
    const { status, body: resBody } = await httpRequest(
        {
            hostname: 'api.notion.com',
            path,
            method,
            headers: {
                Authorization: `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
            },
        },
        body
    );
    if (status >= 400) throw new Error(`Notion ${method} failed (${status}): ${resBody}`);
    return JSON.parse(resBody);
};

// ── Gemini ───────────────────────────────────────────────
const convertToKoreanReading = async (jpText, retryCount = 0) => {
    const prompt = `다음을 한국인이 읽기 편하도록 한글 발음으로만 변환해주세요.
다른 말은 하지 말고 변환된 한글 발음만 응답하세요.
히라가나나 카타카나가 아닌 반드시 한국어(한글)로만 적어주세요.
문장: "${jpText}"
출력 예시: "마타 오아이시타이데스"`;

    const { status, body } = await httpRequest(
        {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            method: 'POST',
        },
        { contents: [{ parts: [{ text: prompt }] }] }
    );

    if (status === 429 && retryCount < 3) {
        const wait = (retryCount + 1) * 30000; // 30초, 60초, 90초 대기
        console.warn(`⚠️ Rate Limit 도달. ${wait / 1000}초 후 재시도...`);
        await new Promise(r => setTimeout(r, wait));
        return convertToKoreanReading(jpText, retryCount + 1);
    }

    if (status >= 400) {
        console.warn(`⚠️ Gemini API Error (${status}): ${body}`);
        return null;
    }

    const parsed = JSON.parse(body);
    return parsed.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
};

// 일본어(히라가나/카타카나) 포함 여부 체크
const hasJapanese = (text) => /[\u3040-\u309F\u30A0-\u30FF]/.test(text);

(async () => {
    console.log('🔍 Notion에서 개선이 필요한 데이터를 조회 중...');

    try {
        let cursor = undefined;
        let allTargets = [];
        do {
            const query = await notionRequest('POST', `/v1/databases/${EXPRESSIONS_DB_ID}/query`, {
                page_size: 100,
                ...(cursor && { start_cursor: cursor })
            });
            
            const batchTargets = query.results.filter(page => {
                const reading = page.properties.Reading?.rich_text?.[0]?.plain_text || '';
                return hasJapanese(reading);
            });
            allTargets.push(...batchTargets);
            
            cursor = query.has_more ? query.next_cursor : undefined;
        } while (cursor);

        console.log(`📝 총 ${allTargets.length}개의 잘못된 발음 데이터를 발견했습니다.`);

        for (const [index, page] of allTargets.entries()) {
            const jpText = page.properties.Text_JP?.rich_text?.[0]?.plain_text || '';
            const currentReading = page.properties.Reading?.rich_text?.[0]?.plain_text || '';
            
            console.log(`\n[${index + 1}/${allTargets.length}] 수정 중...`);
            console.log(`- 원문: ${jpText}`);
            console.log(`- 현재 발음: ${currentReading}`);

            const newReading = await convertToKoreanReading(jpText);

            if (newReading) {
                await notionRequest('PATCH', `/v1/pages/${page.id}`, {
                    properties: {
                        Reading: {
                            rich_text: [{ text: { content: newReading } }]
                        }
                    }
                });
                console.log(`✅ 수정 완료: ${newReading}`);
            } else {
                console.log(`❌ 변환 실패`);
            }

            // Free Tier Rate Limit(분당 5회) 고려하여 넉넉히 대기
            await new Promise(r => setTimeout(r, 12000)); 
        }

        console.log('\n✨ 모든 작업이 완료되었습니다!');
    } catch (err) {
        console.error('\n❌ 실행 실패:', err);
    }
})();
