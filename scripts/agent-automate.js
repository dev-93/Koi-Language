import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { uploadToBlob } from './upload-images.js';

dotenv.config();

const SITUATIONS_DB_ID = process.env.NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATIONS_DB_ID;
const NOTION_TOKEN = process.env.NOTION_TOKEN;

async function runAutomatedTask() {
    console.log('🤖 Starting Koi Language Agent Automation...');

    try {
        // 1. 노션에서 누락된 이미지 찾기
        const response = await fetch(
            `https://api.notion.com/v1/databases/${SITUATIONS_DB_ID}/query`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${NOTION_TOKEN}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sorts: [{ property: 'Date', direction: 'ascending' }],
                }),
            }
        );

        const data = await response.json();
        const situations = data.results || [];
        const missingTasks = [];

        for (const page of situations) {
            const props = page.properties;
            const date = props.Date?.date?.start;
            const title =
                props.Title_KR?.title?.[0]?.plain_text || props.Name?.title?.[0]?.plain_text || '';
            const desc = props.Desc_KR?.rich_text?.[0]?.plain_text || '';

            if (!date) continue;

            const fileName = `${page.id}.png`;
            const filePath = path.join(process.cwd(), 'public', 'situations', fileName);

            if (!fs.existsSync(filePath)) {
                missingTasks.push({ id: page.id, title, desc, fileName, date });
            }
        }

        if (missingTasks.length === 0) {
            console.log('✅ Crystal clear! All images are up to date.');
            return;
        }

        console.log(`📌 I found ${missingTasks.length} situations that need illustrations.`);
        console.log('--- TASK LIST FOR AGENT ---');
        missingTasks.forEach((task, index) => {
            console.log(`${index + 1}. [${task.date}] ${task.title} (ID: ${task.id})`);
        });
        console.log('---------------------------');

        console.log(
            '\n[AGENT_INSTRUCTION]: Please use the "generate_image" tool for each task above.'
        );
        console.log(
            'After generating each image, save it to the "public/situations/" folder with the corresponding ID name.'
        );
        console.log(
            'Then call "node scripts/upload-images.js <FILENAME>" to upload it to Vercel Blob.'
        );
    } catch (err) {
        console.error('❌ Automation Error:', err.message);
    }
}

runAutomatedTask();
