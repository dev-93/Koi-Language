import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_EXPRESSIONS_DB_ID;

async function run() {
    console.log('🚀 Adding "Words" column to Expressions List...');
    try {
        const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    Words: { rich_text: {} }
                }
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error');
        console.log('✅ Column "Words" successfully added to Notion!');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

run();
