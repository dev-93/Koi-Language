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

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
            }
        );
        return await response.json();
    } catch (e) {
        console.error('Telegram notification failed:', e);
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
    if (!response.ok) {
        console.error('Notion API error details:', JSON.stringify(data, null, 2));
        throw new Error(data.message || `Notion API Error (${response.status})`);
    }
    return data;
};

const geminiRequest = async (prompt) => {
    const payload = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2500,
            response_mime_type: 'application/json',
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
    });

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

const getTargetDate = () => {
    const now = new Date();
    const kstNow = new Date(
        now.getTime() + now.getTimezoneOffset() * 60000 + 9 * 60 * 60 * 1000
    );
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

const createExpressionPage = async (expr, type, situationId, date) => {
    await new Promise((r) => setTimeout(r, 300));
    return notionRequest('POST', '/v1/pages', {
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
};

export async function GET(request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!NOTION_TOKEN || !GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Missing configuration' }, { status: 500 });
    }

    const targetDate = getTargetDate();
    console.log(`[Cron] Content generation started for date: ${targetDate}`);

    const prompt = `
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
    "title_kr": "상황 제목 (예: 이자카야에서 혼자 마시는 사람에게 자연스럽게 말 걸기)",
    "title_jp": "상황 제목 (일본어)",
    "desc_kr": "상황 설명 (한국어, 2~3문장)",
    "desc_jp": "상황 설명 (일본어)"
  },
  "expressions": {
    "kr_wants_jp": [
      {
        "kr": "한국어 표현",
        "jp": "일본어 표현",
        "reading": "일본어 발음 (한글만)",
        "tip": "일본 문화/심리 팁 (1~2문장)",
        "words": [{ "word": "단어", "mean": "뜻" }]
      }
    ],
    "jp_wants_kr": [
      {
        "kr": "한국어 표현",
        "jp": "일본어 표현",
        "reading": "일본어 발음 (한글만)",
        "tip": "일본인 친구가 해주는 조언 느낌의 팁 (1~2문장)",
        "words": [{ "word": "단어", "mean": "뜻" }]
      }
    ]
  }
}
`;

    try {
        const geminiRes = await geminiRequest(prompt);
        const rawText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        if (!rawText) {
            if (geminiRes.promptFeedback) {
                throw new Error(
                    `Gemini blocked response: ${JSON.stringify(geminiRes.promptFeedback)}`
                );
            }
            throw new Error('Gemini returned empty response (possibly safety filters)');
        }

        let data;
        try {
            const jsonStr = rawText.match(/\{[\s\S]*\}/)?.[0] || rawText;
            data = JSON.parse(jsonStr.trim());
        } catch (parseErr) {
            console.error('Gemini Raw:', rawText);
            throw new Error(`JSON Parse error: ${parseErr.message}`);
        }

        if (!data.situation || !data.expressions) {
            throw new Error('Invalid JSON structure from Gemini');
        }

        const sitPage = await createSituationPage(data.situation, targetDate);
        const sitId = sitPage.id;

        const expressions = [
            ...(data.expressions.kr_wants_jp || []).map((e) => ({ ...e, type: 'kr_wants_jp' })),
            ...(data.expressions.jp_wants_kr || []).map((e) => ({ ...e, type: 'jp_wants_kr' })),
        ];

        for (const expr of expressions) {
            await createExpressionPage(expr, expr.type, sitId, targetDate);
        }

        await sendTelegramMessage(
            `✅ <b>[Koi Language]</b>\n` +
                `콘텐츠 업데이트 준비 완료!\n\n` +
                `📅 <b>적용 날짜:</b> ${targetDate}\n` +
                `💖 <b>상황:</b> ${data.situation.title_kr}`
        );

        return NextResponse.json({ success: true, date: targetDate });
    } catch (err) {
        console.error('CRON_ERROR:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown Error';

        await sendTelegramMessage(
            `❌ <b>[Koi Language]</b>\n` +
                `동기화 작업 실패!\n\n` +
                `⚠️ <b>에러:</b> ${errorMessage.substring(0, 500)}`
        );

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
