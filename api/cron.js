/* eslint-env node */
import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const SITUATION_DB_ID = process.env.VITE_NOTION_SITUATION_DB_ID;
const EXPRESSIONS_DB_ID = process.env.VITE_NOTION_EXPRESSION_DB_ID;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const sendTelegramMessage = (text) => 
    new Promise((resolve) => {
        if (!TG_TOKEN || !TG_CHAT_ID) return resolve(null);
        const payload = JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' });
        const req = https.request(
            {
                hostname: 'api.telegram.org',
                path: `/bot${TG_TOKEN}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            },
            (res) => {
                let data = '';
                res.on('data', (d) => data += d);
                res.on('end', () => resolve(data));
            }
        );
        req.on('error', (e) => {
            console.error('[Telegram] Error:', e);
            resolve(null);
        });
        req.write(payload);
        req.end();
    });

const notionRequest = (method, path, body) =>
    new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = https.request(
            {
                hostname: 'api.notion.com',
                path,
                method,
                headers: {
                    Authorization: `Bearer ${NOTION_TOKEN}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json',
                    ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
                },
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (res.statusCode >= 400) reject(parsed);
                        else resolve(parsed);
                    } catch (e) {
                        reject(e);
                    }
                });
            }
        );
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });

const geminiRequest = (prompt) =>
    new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
        });
        const path = `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const req = https.request(
            {
                hostname: 'generativelanguage.googleapis.com',
                path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            }
        );
        req.on('error', reject);
        req.write(payload);
        req.end();
    });

const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};

const createSituationPage = (data, date) =>
    notionRequest('POST', '/v1/pages', {
        parent: { database_id: SITUATION_DB_ID },
        properties: {
            Title_KR: { title: [{ text: { content: data.title_kr } }] },
            Title_JP: { rich_text: [{ text: { content: data.title_jp } }] },
            Desc_KR: { rich_text: [{ text: { content: data.desc_kr } }] },
            Desc_JP: { rich_text: [{ text: { content: data.desc_jp } }] },
            Date: { date: { start: date } },
        },
    });

const createExpressionPage = (expr, type, situationId, date) =>
    notionRequest('POST', '/v1/pages', {
        parent: { database_id: EXPRESSIONS_DB_ID },
        properties: {
            Title_KR: { title: [{ text: { content: expr.kr } }] },
            Text_JP: { rich_text: [{ text: { content: expr.jp } }] },
            Reading: { rich_text: [{ text: { content: expr.reading } }] },
            Tip: { rich_text: [{ text: { content: expr.tip ?? '' } }] },
            Words: { rich_text: [{ text: { content: JSON.stringify(expr.words ?? []) } }] },
            Type: { select: { name: type } },
            Situation: { relation: [{ id: situationId }] },
            Date: { date: { start: date } },
        },
    });

export default async function handler(req, res) {
    // Vercel 크론잡 보안 검증
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const targetDate = getTomorrowDate();
    const prompt = `
당신은 한국인과 일본인의 연애/데이트 일본어 표현을 가르치는 언어 선생님입니다.
내일(${targetDate}) 날짜에 맞는 새로운 데이트 상황과 표현을 JSON 형식으로 생성해주세요.

반드시 다음 JSON 형식으로만 응답하세요. 마크다운 코드 블록 없이 순수 JSON만:
{
  "situation": {
    "title_kr": "상황 제목 (한국어, 예: 영화 같이 보자고 하기)",
    "title_jp": "상황 제목 (일본어)",
    "desc_kr": "상황 설명 (한국어, 2~3문장, 재미있고 공감가는 내용)",
    "desc_jp": "상황 설명 (일본어)"
  },
  "expressions": {
    "kr_wants_jp": [
      {
        "kr": "한국어 표현",
        "jp": "일본어 표현",
        "reading": "일본어 한국어 발음 표기",
        "tip": "데이트 팁 (재치있게, 1~2문장)",
        "words": [
          { "word": "일본어단어", "mean": "뜻" }
        ]
      }
    ],
    "jp_wants_kr": [
      {
        "kr": "한국어 표현",
        "jp": "일본어 표현",
        "reading": "한국어 로마자 발음 표기",
        "tip": "팁 내용",
        "words": [
          { "word": "한국어단어", "mean": "뜻" }
        ]
      }
    ]
  }
}

*주의: 'words' 배열의 각 요소는 반드시 'word'와 'mean'이라는 두 개의 키를 가진 객체여야 합니다.*
*참고: 일본어 발음(reading)은 한국인이 읽기 편하게 카타카나나 히라가나가 아닌 한국어 발음으로 적어주세요.*

kr_wants_jp (한국인이 일본인에게 표현)은 2~3개, jp_wants_kr (일본인이 한국인에게 표현)은 2~3개 생성하세요.
이미 사용된 주제들과 겹치지 않는 창의적인 데이트 상황을 만들어주세요.
`;

    try {
        const geminiRes = await geminiRequest(prompt);
        const rawText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        // JSON 파싱 (마크다운 코드 블록 처리)
        const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/) || rawText.match(/({[\s\S]*})/);
        const jsonText = jsonMatch ? jsonMatch[1] : rawText;
        const data = JSON.parse(jsonText.trim());

        // 노션에 Situation 먼저 생성
        const sitPage = await createSituationPage(data.situation, targetDate);
        const sitId = sitPage.id;

        // 표현들 병렬 생성
        const exprPromises = [
            ...data.expressions.kr_wants_jp.map((e) => createExpressionPage(e, 'kr_wants_jp', sitId, targetDate)),
            ...data.expressions.jp_wants_kr.map((e) => createExpressionPage(e, 'jp_wants_kr', sitId, targetDate)),
        ];
        await Promise.all(exprPromises);

        console.log(`[Cron] Created content for ${targetDate}`);
        
        // 텔레그램 알림 전송
        await sendTelegramMessage(
            `💌 <b>[Koi Language]</b>\n` +
            `새로운 데이트 표현 업데이트 완료!\n\n` +
            `📅 <b>학습 날짜:</b> ${targetDate}\n` +
            `💖 <b>주제:</b> ${data.situation.title_kr}\n\n` +
            `지금 바로 앱에서 확인해보세요!`
        );

        return res.status(200).json({ success: true, date: targetDate, situation: data.situation.title_kr });
    } catch (err) {
        console.error('[Cron] Error:', err);
        
        // 에러 알림 전송
        await sendTelegramMessage(
            `❌ <b>[Koi Language]</b>\n` +
            `노션 동기화 작업 실패!\n\n` +
            `🕒 <b>시간:</b> ${new Date().toLocaleString()}\n` +
            `⚠️ <b>에러:</b> ${err.message}`
        );
        
        return res.status(500).json({ error: 'Cron job failed', detail: err.message });
    }
}
