import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SITUATION_DB_ID = process.env.VITE_NOTION_SITUATION_DB_ID;

const query = async () => {
    const payload = JSON.stringify({
        filter: { property: 'Date', date: { equals: '2026-04-05' } },
        page_size: 1,
    });

    const options = {
        hostname: 'api.notion.com',
        path: `/v1/databases/${SITUATION_DB_ID}/query`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        },
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
            const json = JSON.parse(data);
            const title = json.results?.[0]?.properties?.Title_KR?.title?.[0]?.text?.content;
            console.log(`\n📌 4월 4일 생성된 타이틀: [${title}]`);
        });
    });
    req.write(payload);
    req.end();
};

query();
