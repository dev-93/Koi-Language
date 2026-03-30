import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SITUATION_DB_ID = '332eb93112d580e29e63f7b9463b653f';
const EXPRESSIONS_DB_ID = '332eb93112d5811a81edeedec17049b7';

const request = (method, path, body) =>
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
                        if (res.statusCode >= 400) {
                            console.error('API Error:', parsed);
                            reject(parsed);
                        } else {
                            resolve(parsed);
                        }
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

const seed = async () => {
    const date = '2026-03-30';

    console.log(`📝 [${date}] 노션에 데이터 추가 시작...`);

    // 1. Situation 생성
    const sitPage = await request('POST', '/v1/pages', {
        parent: { database_id: SITUATION_DB_ID },
        properties: {
            Title_KR: { title: [{ text: { content: '취미 물어보기' } }] },
            Title_JP: { rich_text: [{ text: { content: '趣味を聞く' } }] },
            Desc_KR: {
                rich_text: [{ text: { content: '공통의 관심사를 찾아 대화를 이어가 보세요. 취미 이야기는 자연스럽게 친해지는 최고의 방법이에요! 🎨' } }],
            },
            Desc_JP: {
                rich_text: [{ text: { content: '共通の関心事を見つけて会話を繋げましょう。趣味の話は自然に仲良くなれる最高の方法です！🎨' } }],
            },
            Date: { date: { start: date } },
        },
    });

    const sitId = sitPage.id;
    console.log(`✅ Situation 생성 완료: ${sitId}`);

    // 2. Expressions 생성
    const expressions = [
        {
            kr: '쉬는 날에는 보통 뭘 하시나요?',
            jp: '休みの日はいつも何をしていますか？',
            reading: '야스미노 히와 이츠모 나니오 시테이마스카?',
            tip: '자연스럽게 취미를 물어보는 좋은 시작입니다. 먼저 물어보면 상대방도 편하게 이야기를 꺼낼 수 있어요!',
            type: 'kr_wants_jp',
            words: [
                { word: '休み(やすみ)', mean: '쉬는 날, 휴일' },
                { word: 'いつも', mean: '보통, 항상' },
                { word: '何(なに)', mean: '무엇' },
            ],
        },
        {
            kr: '혹시 좋아하는 취미가 있으세요?',
            jp: '何か好きな趣味はありますか？',
            reading: '나니카 스키나 슈미와 아리마스카?',
            tip: '취미를 물어볼 때 "혹시"를 붙이면 부드럽고 배려 있어 보여요. 💌',
            type: 'kr_wants_jp',
            words: [
                { word: '何か(なにか)', mean: '혹시, 무언가' },
                { word: '好き(すき)', mean: '좋아하다' },
                { word: '趣味(しゅみ)', mean: '취미' },
            ],
        },
        {
            kr: '쉬는 날에는 보통 뭘 하시나요?',
            jp: '休みの日はいつも何をしていますか？',
            reading: 'swineun nareneun botong mwol hasinayo?',
            tip: '',
            type: 'jp_wants_kr',
            words: [],
        },
        {
            kr: '혹시 좋아하는 취미가 있으세요?',
            jp: '何か好きな趣味はありますか？',
            reading: 'hoksi joahaneun chwimiga isseoyo?',
            tip: '',
            type: 'jp_wants_kr',
            words: [],
        },
    ];

    for (const expr of expressions) {
        await request('POST', '/v1/pages', {
            parent: { database_id: EXPRESSIONS_DB_ID },
            properties: {
                Title_KR: { title: [{ text: { content: expr.kr } }] },
                Text_JP: { rich_text: [{ text: { content: expr.jp } }] },
                Reading: { rich_text: [{ text: { content: expr.reading } }] },
                Tip: { rich_text: [{ text: { content: expr.tip } }] },
                Words: { rich_text: [{ text: { content: JSON.stringify(expr.words) } }] },
                Type: { select: { name: expr.type } },
                Situation: { relation: [{ id: sitId }] },
                Date: { date: { start: date } },
            },
        });
        console.log(`✅ Expression 생성: [${expr.type}] ${expr.kr}`);
    }

    console.log('\n🎉 모든 데이터 삽입 완료!');
};

seed().catch((err) => {
    console.error('❌ 오류 발생:', err);
    process.exit(1);
});
