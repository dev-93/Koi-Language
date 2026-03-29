import fs from 'fs';
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

function getText(prop) {
    if (!prop || !prop.rich_text) return '';
    return prop.rich_text.map(t => t.plain_text).join('');
}

function getTitle(prop) {
    if (!prop || !prop.title) return '';
    return prop.title.map(t => t.plain_text).join('');
}

async function sync() {
    console.log('🔄 Fetching situations and expressions from Notion (Linked Structure)...');
    
    try {
        // 1. Fetch Situations
        const sitQuery = await notionFetch(`databases/${SITUATIONS_DB_ID}/query`, 'POST');
        const situations = sitQuery.results;
        
        // 2. Fetch ALL Expressions (pagination handled if needed, but 22 is small)
        const expQuery = await notionFetch(`databases/${EXPRESSIONS_DB_ID}/query`, 'POST');
        const expressions = expQuery.results;
        
        console.log(`✅ Found ${situations.length} situations and ${expressions.length} expressions.`);

        // 3. Join them
        const resultSituations = situations.map((sitPage, sitIdx) => {
            const sitProps = sitPage.properties;
            const sitId = sitPage.id;

            // Find expressions belonging to this situation
            const relatedExps = expressions.filter(expPage => {
                const rel = expPage.properties.Situation?.relation;
                return rel && rel.some(r => r.id === sitId);
            });

            // Grop expressions by type
            const kr_wants_jp = [];
            const jp_wants_kr = [];

            relatedExps.forEach(expPage => {
                const expProps = expPage.properties;
                const type = expProps.Type?.select?.name;
                const data = {
                    kr: getTitle(expProps.Title_KR),
                    jp: getText(expProps.Text_JP),
                    reading: getText(expProps.Reading || ''),
                    tip: getText(expProps.Tip || ''),
                    // You can add more fields here if needed
                };

                if (type === 'kr_wants_jp') kr_wants_jp.push(data);
                else if (type === 'jp_wants_kr') jp_wants_kr.push(data);
            });

            return {
                id: sitIdx + 1,
                title: {
                    kr: getTitle(sitProps.Title_KR),
                    jp: getText(sitProps.Title_JP)
                },
                desc: {
                    kr: getText(sitProps.Desc_KR),
                    jp: getText(sitProps.Desc_JP)
                },
                expressions: {
                    kr_wants_jp,
                    jp_wants_kr
                },
                date: sitProps.Date?.date?.start || null
            };
        });

        // 4. Save to file
        const fileContent = `export const situations = ${JSON.stringify(resultSituations, null, 4)};\n`;
        fs.writeFileSync('./src/data/situations.js', fileContent);
        console.log('✨ src/data/situations.js has been successfully updated with joined data!');

    } catch (e) {
        console.error('❌ Sync failed:', e.message);
    }
}

sync();
