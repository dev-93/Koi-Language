import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;

/**
 * 노션 페이지의 특정 속성(URL)을 업데이트합니다.
 * @param {string} pageId - 노션 페이지 ID
 * @param {string} imageUrl - Vercel Blob 이미지 URL
 */
export async function updateNotionImageUrl(pageId, imageUrl) {
    if (!NOTION_TOKEN) {
        throw new Error('Missing NOTION_TOKEN in .env');
    }

    console.log(`📝 Updating Notion page ${pageId} with URL...`);

    try {
        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                properties: {
                    URL: {
                        rich_text: [
                            {
                                text: {
                                    content: imageUrl,
                                },
                            },
                        ],
                    },
                },
            }),
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`✅ Notion update successful for page ${pageId}`);
        } else {
            console.error(`❌ Notion update failed: ${data.message}`);
            // 만약 'URL' 속성 이름이 틀렸다면 속성 목록을 확인해봐야 함
        }
    } catch (err) {
        console.error(`❌ Notion Fetch Error:`, err.message);
    }
}

// 직접 실행용 (node scripts/update-notion-url.js <PAGE_ID> <URL>)
if (process.argv[2] && process.argv[3]) {
    updateNotionImageUrl(process.argv[2], process.argv[3]);
}
