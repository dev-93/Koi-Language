import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SIT_DB_ID = process.env.NOTION_SITUATIONS_DB_ID;

async function setup() {
    if (!NOTION_TOKEN || !SIT_DB_ID) {
        console.error('❌ Missing NOTION_TOKEN or NOTION_SITUATIONS_DB_ID');
        process.exit(1);
    }

    try {
        console.log('🔍 Fetching Situations DB info to find parent page...');
        const dbRes = await fetch(`https://api.notion.com/v1/databases/${SIT_DB_ID}`, {
            headers: {
                Authorization: `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
            },
        });
        const dbData = await dbRes.json();
        
        if (!dbRes.ok) throw new Error(dbData.message || 'Failed to fetch DB info');
        
        const parentId = dbData.parent.page_id;
        console.log(`✅ Found parent page: ${parentId}`);

        console.log('🚀 Creating Users Database in Notion...');
        const createRes = await fetch('https://api.notion.com/v1/databases', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                parent: { type: 'page_id', page_id: parentId },
                title: [{ type: 'text', text: { content: 'Users' } }],
                properties: {
                    Email: { title: {} },
                    Password: { rich_text: {} },
                    Name: { rich_text: {} },
                    Nationality: { select: { options: [{ name: 'KR' }, { name: 'JP' }] } },
                    UserGender: { select: { options: [{ name: 'M' }, { name: 'F' }] } },
                    TargetGender: { select: { options: [{ name: 'M' }, { name: 'F' }] } },
                    CreatedAt: { date: {} }
                },
            }),
        });
        const createData = await createRes.json();

        if (!createRes.ok) throw new Error(createData.message || 'Failed to create Users DB');

        const userDbId = createData.id;
        console.log(`✨ Users Database created! ID: ${userDbId}`);

        // .env 업데이트
        const envPath = path.resolve(process.cwd(), '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        if (envContent.includes('NOTION_USERS_DB_ID')) {
            envContent = envContent.replace(/NOTION_USERS_DB_ID=.*/, `NOTION_USERS_DB_ID=${userDbId}`);
        } else {
            envContent += `\nNOTION_USERS_DB_ID=${userDbId}`;
        }

        fs.writeFileSync(envPath, envContent);
        console.log('📝 .env file updated with NOTION_USERS_DB_ID');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

setup();
