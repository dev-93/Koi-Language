import { NextResponse } from 'next/server';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SITUATION_DB_ID = process.env.NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATIONS_DB_ID;
const EXPRESSIONS_DB_ID =
    process.env.NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSIONS_DB_ID;

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
        next: { revalidate: 300 },
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

const parseExpression = (page) => {
    const wordsRaw = getRichText(page.properties['Words']);
    const tipRaw = getRichText(page.properties['Tip']);
    const readingRaw =
        getRichText(page.properties['Reading']) || getRichText(page.properties['reading']);

    let words = [];
    try {
        words = wordsRaw ? JSON.parse(wordsRaw) : [];
    } catch {
        words = [];
    }

    // JSON 형식인 경우와 평문인 경우 모두 대응
    let tip = tipRaw;
    try {
        tip = JSON.parse(tipRaw);
    } catch {
        tip = tipRaw;
    }

    let reading = readingRaw;
    try {
        reading = JSON.parse(readingRaw);
    } catch {
        reading = readingRaw;
    }

    return {
        id: page.id,
        kr: getTitle(page.properties['Title_KR']) || getTitle(page.properties['KR']),
        jp: getRichText(page.properties['Text_JP']) || getRichText(page.properties['JP']),
        reading, // JSON { kr, jp } 또는 String
        tip, // JSON { kr, jp } 또는 String
        // Target 필드가 없으면 기존 Type 필드를 폴백으로 사용
        target: getSelect(page.properties['Target']) || getSelect(page.properties['Type']),
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
                const props = page.properties;
                const sit = {
                    id: page.id,
                    title: { kr: getTitle(props['Title_KR']), jp: getRichText(props['Title_JP']) },
                    desc: { kr: getRichText(props['Desc_KR']), jp: getRichText(props['Desc_JP']) },
                    date: getDate(props['Date']),
                    imageUrl: props['URL']?.url || getRichText(props['URL']) || null,
                };

                const sitExpressions = expressions.filter((e) => e.situationIds.includes(sit.id));
                const integrated = sitExpressions.filter((e) => {
                    const target = (e.target || '').toUpperCase();
                    return target === 'INTEGRATED';
                });

                return {
                    ...sit,
                    expressions: {
                        kr_wants_jp: [
                            ...sitExpressions.filter((e) => {
                                const t = (e.target || '').toUpperCase();
                                return t === 'KR' || t === 'KR_WANTS_JP';
                            }),
                            ...integrated.map((e) => ({ ...e, is_integrated: true })),
                        ],
                        jp_wants_kr: [
                            ...sitExpressions.filter((e) => {
                                const t = (e.target || '').toUpperCase();
                                return t === 'JP' || t === 'JP_WANTS_KR';
                            }),
                            ...integrated.map((e) => ({ ...e, is_integrated: true })),
                        ],
                    },
                };
            })
            .filter((s) => s.date)
            .sort((a, b) => (b.date > a.date ? 1 : -1));

        return NextResponse.json({ situations });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
