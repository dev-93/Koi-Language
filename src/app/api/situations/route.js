import { NextResponse } from 'next/server';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SITUATION_DB_ID =
    process.env.VITE_NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATION_DB_ID;
const EXPRESSIONS_DB_ID =
    process.env.VITE_NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSION_DB_ID;

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
        next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
        const error = await response.json();
        throw error;
    }
    return response.json();
};

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
        kr: getTitle(page.properties['Title_KR']) || getTitle(page.properties['KR']),
        jp: getRichText(page.properties['Text_JP']) || getRichText(page.properties['JP']),
        reading:
            getRichText(page.properties['Reading']) ||
            getRichText(page.properties['Pronunciation']),
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
        const body = {
            page_size: 100,
            ...(filter && { filter }),
            ...(cursor && { start_cursor: cursor }),
        };
        const res = await notionRequest('POST', `/v1/databases/${dbId}/query`, body);
        results.push(...res.results);
        cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);
    return results;
};

export async function GET() {
    if (!NOTION_TOKEN || !SITUATION_DB_ID) {
        return NextResponse.json({ error: 'Missing configuration' }, { status: 500 });
    }

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
            // 지능형 로테이션: 오늘 데이트 데이터는 최상단, 나머지는 매번 랜덤 셔플(중복 피로 감소)
            .sort((a, b) => {
                const today = new Date().toISOString().split('T')[0];
                if (a.date === today && b.date !== today) return -1;
                if (b.date === today && a.date !== today) return 1;
                return Math.random() - 0.5;
            });

        return NextResponse.json(
            { situations },
            {
                headers: {
                    'Cache-Control': 's-maxage=300, stale-while-revalidate',
                },
            }
        );
    } catch (err) {
        console.error('Notion fetch error:', err);
        return NextResponse.json(
            { error: 'Failed to fetch from Notion', detail: err.message },
            { status: 500 }
        );
    }
}
