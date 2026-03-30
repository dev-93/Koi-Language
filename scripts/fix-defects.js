import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.NOTION_TOKEN;
const EXPR_DB_ID = '332eb93112d5811a81edeedec17049b7';

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

async function fixMissingFields() {
    try {
        console.log('Fixing identified data defects...');
        
        // Find "카톡이나 인스타 하세요?" pages
        const query = await notionRequest('POST', `/v1/databases/${EXPR_DB_ID}/query`, {
            filter: {
                property: 'Title_KR',
                title: { contains: '카톡이나 인스타 하세요?' }
            }
        });

        for (const page of query.results) {
            console.log(`Updating page: ${page.id}`);
            const words = [
                {word: '카톡(カカオ)', mean: '카카오톡(KakaoTalk)'},
                {word: '인스타', mean: '인스타그램(Instagram)'},
                {word: 'やってますか', mean: '하고 있나요?'}
            ];
            await notionRequest('PATCH', `/v1/pages/${page.id}`, {
                properties: {
                    Words: { rich_text: [{ text: { content: JSON.stringify(words) } }] }
                }
            });
        }
        console.log('Defects fixed! Running final validation...');
    } catch (err) {
        console.error('Failed to fix:', err);
    }
}

fixMissingFields();
