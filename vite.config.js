import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

// --- Notion API Helper (Development Only) ---
const getNotionConfig = (env) => ({
    token: env.NOTION_TOKEN,
    sitDbId: env.VITE_NOTION_SITUATION_DB_ID,
    exprDbId: env.VITE_NOTION_EXPRESSION_DB_ID,
});

const notionRequest = (method, path, body, token) =>
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
                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    try {
                        const data = Buffer.concat(chunks).toString('utf-8');
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

const queryAll = async (dbId, filter, token) => {
    const results = [];
    let cursor = undefined;
    do {
        const body = { page_size: 100, ...(filter && { filter }), ...(cursor && { start_cursor: cursor }) };
        const res = await notionRequest('POST', `/v1/databases/${dbId}/query`, body, token);
        results.push(...res.results);
        cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);
    return results;
};
// ------------------------------------------

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            {
                name: 'notion-api-proxy',
                configureServer(server) {
                    server.middlewares.use(async (req, res, next) => {
                        if (req.url === '/api/situations') {
                            try {
                                const token = env.NOTION_TOKEN;
                                if (!token) throw new Error('NOTION_TOKEN is missing in .env');

                                const [sitPages, exprPages] = await Promise.all([
                                    queryAll(env.VITE_NOTION_SITUATION_DB_ID, null, token),
                                    queryAll(env.VITE_NOTION_EXPRESSION_DB_ID, null, token),
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

                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ situations }));
                            } catch (err) {
                                console.error('[Vite API Proxy] Error:', err);
                                res.statusCode = 500;
                                res.end(JSON.stringify({ error: 'Failed to fetch from Notion', detail: err.message }));
                            }
                            return;
                        }
                        next();
                    });
                },
            },
        ],
    };
});
