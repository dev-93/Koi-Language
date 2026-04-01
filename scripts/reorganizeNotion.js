import dotenv from 'dotenv';
import { situations } from '../src/data/situations.js';

dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SITUATIONS_DB_ID = '332eb931-12d5-80e2-9e63-f7b9463b653f';
const PARENT_PAGE_ID = '332eb931-12d5-806d-ac3f-c43248610eff';

async function notionFetch(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        },
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`https://api.notion.com/v1/${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Notion API error');
    return data;
}

async function run() {
    console.log('🚀 Reorganizing Notion into Parent-Child structure...');

    try {
        // 1. Create Expressions Database
        console.log('📦 Creating "Expressions" database...');
        const expressionsDb = await notionFetch('databases', 'POST', {
            parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
            title: [{ type: 'text', text: { content: 'Expressions List' } }],
            properties: {
                Title_KR: { title: {} },
                Text_JP: { rich_text: {} },
                Reading: { rich_text: {} },
                Tip: { rich_text: {} },
                Type: {
                    select: {
                        options: [
                            { name: 'kr_wants_jp', color: 'blue' },
                            { name: 'jp_wants_kr', color: 'pink' },
                        ],
                    },
                },
                Situation: {
                    relation: {
                        database_id: SITUATIONS_DB_ID,
                        single_property: {}, // Fixed
                    },
                },
                Date: { date: {} },
            },
        });

        const EXPRESSIONS_DB_ID = expressionsDb.id;
        console.log(`✅ Expressions DB Created: ${EXPRESSIONS_DB_ID}`);

        // 2. Clear old Situations
        console.log('🧹 Clearing old Situations entries...');
        const q1 = await notionFetch(`databases/${SITUATIONS_DB_ID}/query`, 'POST');
        for (const page of q1.results) await notionFetch(`blocks/${page.id}`, 'DELETE');

        // 3. Migrate Situations and Expressions
        const today = new Date().toISOString().split('T')[0];

        for (const sit of situations) {
            console.log(`🎬 Migrating Situation: ${sit.title.kr}...`);

            const sitPage = await notionFetch('pages', 'POST', {
                parent: { database_id: SITUATIONS_DB_ID },
                properties: {
                    Title_KR: { title: [{ text: { content: sit.title.kr } }] },
                    Title_JP: { rich_text: [{ text: { content: sit.title.jp || '' } }] },
                    Desc_KR: { rich_text: [{ text: { content: sit.desc.kr || '' } }] },
                    Desc_JP: { rich_text: [{ text: { content: sit.desc.jp || '' } }] },
                    Date: { date: { start: today } },
                },
            });

            const sitPageId = sitPage.id;

            // Flatten expressions
            const kr_wants_jp = sit.expressions.kr_wants_jp || [];
            const jp_wants_kr = sit.expressions.jp_wants_kr || [];

            for (const exp of kr_wants_jp) {
                await notionFetch('pages', 'POST', {
                    parent: { database_id: EXPRESSIONS_DB_ID },
                    properties: {
                        Title_KR: { title: [{ text: { content: exp.kr } }] },
                        Text_JP: { rich_text: [{ text: { content: exp.jp } }] },
                        Reading: { rich_text: [{ text: { content: exp.reading || '' } }] },
                        Tip: { rich_text: [{ text: { content: exp.tip || '' } }] },
                        Type: { select: { name: 'kr_wants_jp' } },
                        Situation: { relation: [{ id: sitPageId }] },
                        Date: { date: { start: today } },
                    },
                });
            }

            for (const exp of jp_wants_kr) {
                await notionFetch('pages', 'POST', {
                    parent: { database_id: EXPRESSIONS_DB_ID },
                    properties: {
                        Title_KR: { title: [{ text: { content: exp.kr } }] },
                        Text_JP: { rich_text: [{ text: { content: exp.jp } }] },
                        Reading: { rich_text: [{ text: { content: exp.reading || '' } }] },
                        Tip: { rich_text: [{ text: { content: exp.tip || '' } }] },
                        Type: { select: { name: 'jp_wants_kr' } },
                        Situation: { relation: [{ id: sitPageId }] },
                        Date: { date: { start: today } },
                    },
                });
            }
        }

        console.log('\n✨ ALL DATA REORGANIZED!');
        console.log(`SITUATIONS_DB_ID=${SITUATIONS_DB_ID}`);
        console.log(`EXPRESSIONS_DB_ID=${EXPRESSIONS_DB_ID}`);
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

run();
