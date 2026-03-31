import { NextResponse } from 'next/server';

/**
 * 전역 설정 및 헬퍼 함수
 */
const notionToken = process.env.NOTION_TOKEN;
const situationDbId = process.env.VITE_NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATION_DB_ID;
const expressionDbId = process.env.VITE_NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSION_DB_ID;
const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

const httpRequest = async (options, body) => {
    return new Promise((resolve, reject) => {
        const http = require('https');
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        body: data ? JSON.parse(data) : {}
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
    });
};

/**
 * Next.js API Route Handler - GET (Cron)
 */
export async function GET(request) {
    try {
        // 1. 보안 검증 (CRON_SECRET)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!notionToken || !geminiApiKey) {
            return NextResponse.json({ error: 'Missing configuration' }, { status: 500 });
        }

        // 2. Gemini AI에게 오늘의 표현 요청
        const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
        const prompt = `당신은 일본어 전문 강사입니다. 오늘은 ${today}입니다.
오늘의 연애 상황과 5개의 관련 표현을 JSON으로 생성해 주세요.
반드시 아래 형식을 엄수하세요:
{
  "situation": { "title_kr": "상황 제목", "title_jp": "일본어 제목", "desc_kr": "설명", "desc_jp": "일본어 설명" },
  "words": [
    { "word": "표현(일본어)", "mean": "뜻(한국어)", "pron": "독음(한국어)", "tip": "연애 팁" }
  ]
}
중요: 상황 제목에 '벚꽃', '카페', '연락처', '야간', '공원', '식사' 등 특정 이미지 키워드를 포함하면 더 좋습니다.`;

        const geminiRes = await httpRequest({
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        if (geminiRes.status !== 200) throw new Error('Gemini API Error');

        const contentText = geminiRes.body.candidates?.[0]?.content?.parts?.[0]?.text;
        const cleanJson = contentText.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleanJson);

        // 3. 데이터 검증 및 필터링
        if (!data.situation || !data.words || data.words.length === 0) {
            throw new Error('Invalid AI response structure');
        }
        
        const validWords = data.words.filter(w => w.word && w.mean);

        // 4. 노션 상황 DB 등록
        const situationDate = new Date().toISOString().split('T')[0];
        const nationRes = await httpRequest({
            hostname: 'api.notion.com',
            path: '/v1/pages',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${notionToken}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        }, {
            parent: { database_id: situationDbId },
            properties: {
                Title_KR: { title: [{ text: { content: data.situation.title_kr } }] },
                Title_JP: { rich_text: [{ text: { content: data.situation.title_jp } }] },
                Desc_KR: { rich_text: [{ text: { content: data.situation.desc_kr } }] },
                Desc_JP: { rich_text: [{ text: { content: data.situation.desc_jp } }] },
                Date: { date: { start: situationDate } }
            }
        });

        if (nationRes.status !== 200) throw new Error(`Notion DB Error: ${nationRes.status}`);
        const situationId = nationRes.body.id;

        // 5. 노션 표현 DB 등록
        for (const item of validWords) {
            await httpRequest({
                hostname: 'api.notion.com',
                path: '/v1/pages',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${notionToken}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                }
            }, {
                parent: { database_id: expressionDbId },
                properties: {
                    KR: { title: [{ text: { content: item.mean } }] },
                    JP: { rich_text: [{ text: { content: item.word } }] },
                    Pronunciation: { rich_text: [{ text: { content: item.pron || '' } }] },
                    Tip: { rich_text: [{ text: { content: item.tip || '' } }] },
                    Situation: { relation: [{ id: situationId }] }
                }
            });
        }

        // 6. 텔레그램 알림 발송 (선택)
        if (telegramBotToken && telegramChatId) {
            const message = `🌸 오늘의 코이 언어 생성 완료!\n📍 상황: ${data.situation.title_kr}\n📚 단어: ${validWords.length}개 저장됨`;
            await httpRequest({
                hostname: 'api.telegram.org',
                path: `/bot${telegramBotToken}/sendMessage`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { chat_id: telegramChatId, text: message });
        }

        return NextResponse.json({ success: true, situation: data.situation.title_kr });

    } catch (error) {
        console.error('Cron Job Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
