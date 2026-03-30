import https from 'https';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SITUATION_DB_ID = '332eb93112d580e29e63f7b9463b653f';
const EXPRESSIONS_DB_ID = '332eb93112d5811a81edeedec17049b7';

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

const getRichText = (prop) => prop?.rich_text?.[0]?.plain_text ?? '';
const getTitle = (prop) => prop?.title?.[0]?.plain_text ?? '';
const getSelect = (prop) => prop?.select?.name ?? '';
const getDate = (prop) => prop?.date?.start ?? '';
const getRelationIds = (prop) => prop?.relation?.map((r) => r.id) ?? [];

const parseSituation = (page) => ({
    id: page.id,
    title: {
        kr: getTitle(page.properties['Title_KR']),
        jp: getRichText(page.properties['Title_JP']),
    },
    desc: {
        kr: getRichText(page.properties['Desc_KR']),
        jp: getRichText(page.properties['Desc_JP']),
    },
    date: getDate(page.properties['Date']),
});

const parseExpression = (page) => {
    const wordsRaw = getRichText(page.properties['Words']);
    let words = [];
    try {
        words = wordsRaw ? JSON.parse(wordsRaw) : [];
    } catch {
        words = [];
    }
    return {
        id: page.id,
        kr: getTitle(page.properties['Title_KR']),
        jp: getRichText(page.properties['Text_JP']),
        reading: getRichText(page.properties['Reading']),
        tip: getRichText(page.properties['Tip']),
        type: getSelect(page.properties['Type']),
        situationIds: getRelationIds(page.properties['Situation']),
        words,
    };
};

const queryAll = async (dbId, filter) => {
    const results = [];
    let cursor = undefined;
    do {
        const body = { page_size: 100, ...(filter && { filter }), ...(cursor && { start_cursor: cursor }) };
        const res = await notionRequest('POST', `/v1/databases/${dbId}/query`, body);
        results.push(...res.results);
        cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);
    return results;
};

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const [sitPages, exprPages] = await Promise.all([
            queryAll(SITUATION_DB_ID),
            queryAll(EXPRESSIONS_DB_ID),
        ]);

        const expressions = exprPages.map(parseExpression);

        const situations = sitPages
            .map((page) => {
                const sit = parseSituation(page);
                const sitExpressions = expressions.filter((e) => e.situationIds.includes(sit.id));
                return {
                    ...sit,
                    expressions: {
                        kr_wants_jp: sitExpressions.filter((e) => e.type === 'kr_wants_jp'),
                        jp_wants_kr: sitExpressions.filter((e) => e.type === 'jp_wants_kr'),
                    },
                };
            })
            .filter((s) => s.date)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        return res.status(200).json({ situations });
    } catch (err) {
        console.error('Notion fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch from Notion', detail: err.message });
    }
}
