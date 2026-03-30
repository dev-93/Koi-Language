import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.NOTION_TOKEN;
const EXPR_DB_ID = '332eb93112d5811a81edeedec17049b7';
const SIT_ID = '333eb931-12d5-819d-86d0-fc3be915a216';
const DATE = '2026-03-30';
const LEVEL = '입문편';

const notionRequest = (method, path, body) =>
    new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = https.request(
            {
                hostname: 'api.notion.com',
                path,
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
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

async function findAndFixCreated() {
    try {
        console.log('Finding 3/30 Expressions to update...');
        const query = await notionRequest('POST', `/v1/databases/${EXPR_DB_ID}/query`, {
            filter: {
                property: 'Situation',
                relation: { contains: SIT_ID }
            }
        });

        // 1. 기존 데이터(kr_wants_jp)에 Date, Level, Words 채우기
        console.log(`Updating ${query.results.length} existing expressions...`);
        for (const page of query.results) {
            const title = page.properties.Title_KR.title[0].plain_text;
            let words = [];
            if (title.includes('벚꽃')) words = [{word: '桜(さくら)', mean: '벚꽃'}, {word: '綺麗(きれい)', mean: '예쁘다, 깨끗하다'}];
            if (title.includes('사진')) words = [{word: '一緒(いっしょ)に', mean: '같이'}, {word: '写真(しゃしん)', mean: '사진'}];
            if (title.includes('내년')) words = [{word: '来年(らいねん)', mean: '내년'}, {word: '来(く)る', mean: '오다'}];

            await notionRequest('PATCH', `/v1/pages/${page.id}`, {
                properties: {
                    Date: { date: { start: DATE } },
                    Level: { select: { name: LEVEL } },
                    Words: { rich_text: [{ text: { content: JSON.stringify(words) } }] }
                }
            });
        }

        // 2. jp_wants_kr 데이터 추가
        console.log('Adding jp_wants_kr expressions...');
        const jpExprs = [
            {
                kr: '벚꽃이 정말 예쁘네요.',
                jp: '桜が本当に綺麗ですね。',
                reading: 'beoskkoc-i jeongmal yeppeuneyo.',
                tip: '',
                type: 'jp_wants_kr',
                words: [{word: '桜(さくら)', mean: '벚꽃'}, {word: '綺麗(きれい)', mean: '예쁘다, 깨끗하다'}]
            },
            {
                kr: '우리 사진 찍을까요?',
                jp: '一緒に写真を撮りましょうか？',
                reading: 'uri sajin jjik-eulkkayo?',
                tip: '',
                type: 'jp_wants_kr',
                words: [{word: '一緒(いっしょ)에', mean: '같이'}, {word: '写真(しゃしん)', mean: '사진'}]
            },
            {
                kr: '내년에도 같이 오고 싶어요.',
                jp: '来年も一緒に来たいです。',
                reading: 'naenyeonedo gachi ogo sip-eoyo.',
                tip: '',
                type: 'jp_wants_kr',
                words: [{word: '来年(らいねん)', mean: '내년'}, {word: '来(く)る', mean: '오다'}]
            }
        ];

        for (const ex of jpExprs) {
            await notionRequest('POST', '/v1/pages', {
                parent: { database_id: EXPR_DB_ID },
                properties: {
                    Title_KR: { title: [{ text: { content: ex.kr } }] },
                    Text_JP: { rich_text: [{ text: { content: ex.jp } }] },
                    Reading: { rich_text: [{ text: { content: ex.reading } }] },
                    Tip: { rich_text: [{ text: { content: ex.tip } }] },
                    Type: { select: { name: ex.type } },
                    Date: { date: { start: DATE } },
                    Level: { select: { name: LEVEL } },
                    Situation: { relation: [{ id: SIT_ID }] },
                    Words: { rich_text: [{ text: { content: JSON.stringify(ex.words) } }] }
                }
            });
        }
        console.log('All updates and new entries completed!');
    } catch (err) {
        console.error('Failed:', err);
    }
}

findAndFixCreated();
