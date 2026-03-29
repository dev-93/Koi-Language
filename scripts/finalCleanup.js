import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SITUATIONS_DB_ID = process.env.NOTION_SITUATIONS_DB_ID;
const EXPRESSIONS_DB_ID = process.env.NOTION_EXPRESSIONS_DB_ID;

async function notionFetch(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`https://api.notion.com/v1/${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Notion API error');
    return data;
}

function getTitle(page) {
    return page.properties.Title_KR?.title?.[0]?.plain_text || '';
}

async function run() {
    console.log('🧹 Cleaning up Situations and Expressions...');

    try {
        // 1. Fetch Situations
        const sitQuery = await notionFetch(`databases/${SITUATIONS_DB_ID}/query`, 'POST');
        const situations = sitQuery.results;

        for (const sit of situations) {
            const title = getTitle(sit);
            let newDate = null;

            if (title === '카페에서 첫 만남') newDate = '2026-03-27';
            else if (title === '데이트 신청하기') newDate = '2026-03-28';
            else if (title === '연락처 물어보기') newDate = '2026-03-29';
            else if (title === '칭찬하기') {
                console.log(`🗑️ Deleting "칭찬하기" Situation and its expressions...`);
                // Archive linked expressions
                const expQuery = await notionFetch(`databases/${EXPRESSIONS_DB_ID}/query`, 'POST', {
                    filter: { property: 'Situation', relation: { contains: sit.id } }
                });
                for (const exp of expQuery.results) await notionFetch(`blocks/${exp.id}`, 'DELETE');
                // Archive Situation
                await notionFetch(`blocks/${sit.id}`, 'DELETE');
                continue;
            }

            if (newDate) {
                console.log(`📅 Updating "${title}" date to ${newDate}...`);
                await notionFetch(`pages/${sit.id}`, 'PATCH', {
                    properties: { Date: { date: { start: newDate } } }
                });
            }
        }

        console.log('✨ Cleanup finished! Now syncing...');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

run();
