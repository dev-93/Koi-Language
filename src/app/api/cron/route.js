import { NextResponse } from 'next/server';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SITUATION_DB_ID =
    process.env.VITE_NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATION_DB_ID;
const EXPRESSIONS_DB_ID =
    process.env.VITE_NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSION_DB_ID;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const sendTelegramMessage = async (text) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return null;
    const payload = JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' });

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
    });
    return response.json();
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
            temperature: 0.9,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40,
        },
    });
    // 최신 모델인 gemini-2.5-flash 사용 (scripts/run-cron-now.js와 동일하게 변경)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(`Gemini API Error: ${data.error.message} (${data.error.code})`);
    }
    return data;
};

const getTomorrowDate = () => {
    // 서버 시간(UTC) 기준이 아닌 KST(UTC+9) 기준으로 내일 날짜 계산
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    kstNow.setDate(kstNow.getDate() + 1);
    return kstNow.toISOString().split('T')[0];
};

const createSituationPage = (data, date) =>
    notionRequest('POST', '/v1/pages', {
        parent: { database_id: SITUATION_DB_ID },
        properties: {
            Title_KR: { title: [{ text: { content: data.title_kr || data.titleKr || '' } }] },
            Title_JP: { rich_text: [{ text: { content: data.title_jp || data.titleJp || '' } }] },
            Desc_KR: { rich_text: [{ text: { content: data.desc_kr || data.descKr || '' } }] },
            Desc_JP: { rich_text: [{ text: { content: data.desc_jp || data.descJp || '' } }] },
            Date: { date: { start: date } },
        },
    });

const createExpressionPage = (expr, type, situationId, date) =>
    notionRequest('POST', '/v1/pages', {
        parent: { database_id: EXPRESSIONS_DB_ID },
        properties: {
            Title_KR: { title: [{ text: { content: expr.kr || '' } }] },
            Text_JP: { rich_text: [{ text: { content: expr.jp || '' } }] },
            Reading: {
                rich_text: [{ text: { content: expr.reading || expr.pronunciation || '' } }],
            },
            Tip: { rich_text: [{ text: { content: expr.tip ?? '' } }] },
            Words: { rich_text: [{ text: { content: JSON.stringify(expr.words ?? []) } }] },
            Type: { select: { name: type } },
            Situation: { relation: [{ id: situationId }] },
            Date: { date: { start: date } },
        },
    });

export async function GET(request) {
    // 1. 보안 검증 (CRON_SECRET)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!NOTION_TOKEN || !GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Missing configuration' }, { status: 500 });
    }

    const targetDate = getTomorrowDate();
    console.log(`[Cron] Generation started for date: ${targetDate}`);

    const prompt = `
당신은 한국과 일본의 데이트 문화 차이를 깊게 이해하고 있는 연애 전문가이자 언어 선생님입니다.
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
        "reading": "일본어 문장의 한국어 한글 발음 (예: '마타 오아이시타이데스')",
        "tip": "일본인 상대의 마음을 사로잡는 구체적이고 재치 있는 데이트 팁 (일본 문화/성향 반영, 1~2문장)",
        "words": [
          { "word": "일본어단어", "mean": "뜻" }
        ]
      }
    ],
    "jp_wants_kr": [
      {
        "kr": "한국어 표현",
        "jp": "일본어 표현",
        "reading": "일본어 문장의 한국어 한글 발음 (예: '마타 오아이시타이데스')",
        "tip": "일본인 상대의 행동/심리를 이해하는 통찰력 있는 팁 (1~2문장)",
        "words": [
          { "word": "일본어단어", "mean": "뜻" }
        ]
      }
    ]
  }
}

*핵심 지침:*
1. 'tip'은 단순히 문장을 설명하는 "직진 표현입니다" 같은 뻔한 말이 아니어야 합니다.
2. 일본 데이트 문화(예: 연락 속도, 완곡한 거절, 더치페이 문화 등)와 일본인의 국민성/심리를 반영한 '실전 팁'이어야 합니다.
3. 말투는 친근하고 센스 있게 작성하세요 (예: "일본에선 이 말 한마디면 센스쟁이 확정!", "너무 서두르지 마세요, 일본인들은 ~하는 걸 좋아하니까요").
4. 'words' 배열의 각 요소는 반드시 'word'와 'mean'이라는 두 개의 키를 가진 객체여야 합니다.
5. 일본어 표현(jp)의 'reading' 필드는 반드시 '한국어(한글)' 발음으로만 작성해야 합니다.

kr_wants_jp (한국인이 일본인에게 표현)은 2~3개, jp_wants_kr (일본인이 한국인에게 표현)은 2~3개 생성하세요. 창의적이고 설레는 상황을 만들어주세요.
`;

    try {
        const geminiRes = await geminiRequest(prompt);
        const rawText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        if (!rawText) {
            throw new Error('Gemini returned empty response');
        }

        // JSON 파싱 (마크다운 코드 블록 처리 및 유연한 추출)
        const jsonMatch =
            rawText.match(/```json\n?([\s\S]*?)\n?```/) || rawText.match(/({[\s\S]*})/);
        const jsonText = jsonMatch ? jsonMatch[1] : rawText;

        let data;
        try {
            data = JSON.parse(jsonText.trim());
        } catch (parseErr) {
            console.error('JSON Parse error. Raw text:', rawText);
            throw new Error(`Failed to parse Gemini response: ${parseErr.message}`);
        }

        if (!data.situation || !data.expressions) {
            throw new Error('Invalid content structure from Gemini');
        }

        // 노션에 Situation 먼저 생성
        const sitPage = await createSituationPage(data.situation, targetDate);
        const sitId = sitPage.id;

        // 표현들 병렬 생성
        const exprPromises = [
            ...(data.expressions.kr_wants_jp || []).map((e) =>
                createExpressionPage(e, 'kr_wants_jp', sitId, targetDate)
            ),
            ...(data.expressions.jp_wants_kr || []).map((e) =>
                createExpressionPage(e, 'jp_wants_kr', sitId, targetDate)
            ),
        ];

        if (exprPromises.length > 0) {
            await Promise.all(exprPromises);
        }

        // 텔레그램 알림 전송
        await sendTelegramMessage(
            `💌 <b>[Koi Language]</b>\n` +
                `새로운 데이트 표현 업데이트 완료!\n\n` +
                `📅 <b>학습 날짜:</b> ${targetDate}\n` +
                `💖 <b>주제:</b> ${data.situation.title_kr}\n\n` +
                `지금 바로 앱에서 확인해보세요!`
        );

        return NextResponse.json({
            success: true,
            date: targetDate,
            situation: data.situation.title_kr,
        });
    } catch (err) {
        console.error('Cron job failed:', err);

        const errorMessage = err instanceof Error ? err.message : String(err);

        await sendTelegramMessage(
            `❌ <b>[Koi Language]</b>\n` +
                `노션 동기화 작업 실패!\n\n` +
                `🕒 <b>시간:</b> ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n` +
                `⚠️ <b>에러:</b> ${errorMessage}`
        );

        return NextResponse.json(
            { error: 'Cron job failed', detail: errorMessage },
            { status: 500 }
        );
    }
}
