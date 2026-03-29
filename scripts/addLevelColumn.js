import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const EXPERESSIONS_DB_ID = process.env.NOTION_EXPRESSIONS_DB_ID;

async function run() {
    console.log('🚀 Adding "Level" column to Expressions List...');
    
    try {
        // 1. Add Level column (Select property)
        const res = await fetch(`https://api.notion.com/v1/databases/${EXPERESSIONS_DB_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    Level: {
                        select: {
                            options: [
                                { name: '입문편', color: 'green' },
                                { name: '실전편', color: 'blue' },
                                { name: '고수편', color: 'red' }
                            ]
                        }
                    }
                }
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message);
        }
        console.log('✅ Level column added successfully!');

        // 2. Query all existing expressions and set them to "입문편"
        const queryRes = await fetch(`https://api.notion.com/v1/databases/${EXPERESSIONS_DB_ID}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        });
        const queryData = await queryRes.json();
        
        for (const page of queryData.results) {
            await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${NOTION_TOKEN}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    properties: {
                        Level: { select: { name: '입문편' } }
                    }
                })
            });
        }
        console.log(`✅ Set "입문편" level for ${queryData.results.length} expressions.`);
    } catch (e) {
        console.error('❌ Error adding column:', e.message);
    }
}
run();
