import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SITUATIONS_DB_ID = process.env.NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATIONS_DB_ID;
const NOTION_TOKEN = process.env.NOTION_TOKEN;

async function checkMissingImages() {
    console.log('🔍 Checking Notion situations for missing images...');
    
    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${SITUATIONS_DB_ID}/query`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sorts: [{ property: 'Date', direction: 'ascending' }],
            }),
        });

        const data = await response.json();
        const situations = data.results || [];

        const missingTasks = [];

        for (const page of situations) {
            const props = page.properties;
            const date = props.Date?.date?.start;
            const titleKr = props.Title_KR?.title?.[0]?.plain_text || props.Name?.title?.[0]?.plain_text || '';
            const descKr = props.Desc_KR?.rich_text?.[0]?.plain_text || '';
            
            if (!date) continue;

            // 파일명 규칙: SITUATION_ID.png 또는 날짜 기반 (여기서는 ID 기반이 안전함)
            const fileName = `${page.id}.png`; 
            const filePath = path.join(process.cwd(), 'public', 'situations', fileName);

            if (!fs.existsSync(filePath)) {
                missingTasks.push({
                    id: page.id,
                    date,
                    title: titleKr,
                    desc: descKr,
                    fileName
                });
            }
        }

        if (missingTasks.length === 0) {
            console.log('✅ All situations have images. Nothing to do.');
        } else {
            console.log(`📌 Found ${missingTasks.length} situations missing images:`);
            console.log(JSON.stringify(missingTasks, null, 2));
            console.log('\n[AGENT_INSTRUCTION]: Please generate images for the tasks listed above.');
        }
    } catch (err) {
        console.error('❌ Error in agent-sync:', err.message);
    }
}

checkMissingImages();
