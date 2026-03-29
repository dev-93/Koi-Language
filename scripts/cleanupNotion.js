import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const SITUATIONS_DB_ID = process.env.NOTION_SITUATIONS_DB_ID?.replace(/-/g, '');
const EXPRESSIONS_DB_ID = process.env.NOTION_EXPRESSIONS_DB_ID?.replace(/-/g, '');

async function cleanup() {
    console.log('🧹 Starting Notion cleanup...');
    const search = await notion.search({
        query: 'Koi',
        filter: { property: 'object', value: 'data_source' }, // Fixed value
    });

    for (const result of search.results) {
        const id = result.id.replace(/-/g, '');
        const title = result.title?.[0]?.plain_text || 'Untitled';
        
        if (id !== SITUATIONS_DB_ID && id !== EXPRESSIONS_DB_ID) {
            console.log(`🗑️ Deleting duplicate/old database: ${title} (${id})...`);
            try {
                await notion.blocks.delete({ block_id: result.id });
                console.log('✅ Deleted.');
            } catch (e) {
                console.error(`❌ Failed to delete ${title}:`, e.message);
            }
        } else {
            console.log(`✨ Keeping active database: ${id === SITUATIONS_DB_ID ? 'Situations' : 'Expressions'}`);
        }
    }
    console.log('✨ Cleanup finished!');
}

cleanup();
