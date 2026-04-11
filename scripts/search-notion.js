import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;

async function search() {
    console.log('🔍 Searching for all databases and "Login" pages...');
    
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        },
    };

    const req = https.request('https://api.notion.com/v1/search', options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
            console.log('--- Search Results ---');
            const result = JSON.parse(data);
            if (result.results) {
                result.results.forEach(item => {
                    const title = item.properties?.Title?.title?.[0]?.plain_text || 
                                  item.properties?.Name?.title?.[0]?.plain_text || 
                                  item.title?.[0]?.plain_text || 'Untitled';
                    console.log(`- [${item.object}] ID: ${item.id}, Title: ${title}`);
                });
            } else {
                console.log(result);
            }
        });
    });

    req.write(JSON.stringify({
        filter: { property: 'object', value: 'database' }
    }));
    req.end();
}

search();
