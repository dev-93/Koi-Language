import dotenv from 'dotenv';
import { situations } from '../src/data/situations.js';

dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const TARGET_DB_ID = '332eb931-12d5-80e2-9e63-f7b9463b653f';

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

async function migrateAndCleanup() {
    console.log('🚀 Starting migration to lipstick database and cleaning up "Koi" duplicates...');

    try {
        // 1. Cleanup: Search all items matching "Koi" and archive
        const searchRes = await notionFetch('search', 'POST', {
            query: 'Koi',
            filter: { property: 'object', value: 'database' },
        });

        for (const db of searchRes.results) {
            console.log(
                `🗑️ Archiving old database: ${db.title[0]?.plain_text || 'Untitled'} (${db.id})...`
            );
            try {
                await notionFetch(`blocks/${db.id}`, 'DELETE');
            } catch (e) {
                console.error(`- Error deleting ${db.id}: ${e.message}`);
            }
        }

        // 2. Migrate data
        console.log(`📦 Migrating situations into ${TARGET_DB_ID}...`);
        for (const sit of situations) {
            console.log(`- Adding Situation: ${sit.title.kr}...`);
            await notionFetch('pages', 'POST', {
                parent: { database_id: TARGET_DB_ID },
                properties: {
                    Title_KR: { title: [{ text: { content: sit.title.kr } }] },
                    Title_JP: { rich_text: [{ text: { content: sit.title.jp || '' } }] },
                    Desc_KR: { rich_text: [{ text: { content: sit.desc.kr || '' } }] },
                    Desc_JP: { rich_text: [{ text: { content: sit.desc.jp || '' } }] },
                    Expressions_JSON: {
                        rich_text: [{ text: { content: JSON.stringify(sit.expressions) } }],
                    },
                },
            });
        }

        console.log('\n✨ All done! Use npm run sync:notion to get latest data.');
    } catch (e) {
        console.error('❌ Migration failed:', e.message);
    }
}

migrateAndCleanup();
