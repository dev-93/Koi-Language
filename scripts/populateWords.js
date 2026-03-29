import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_EXPRESSIONS_DB_ID;

const vocabMap = {
    // 상황: 카페에서 첫 만남
    '무슨 커피 드시나요?': '何(なに):무슨, コーヒー:커피, 飲んでますか:마시고 있나요',
    '여기 자리 비어있나요?': 'ここ:여기, 空いてますか:비어있나요',
    '분위기가 참 좋네요.': '雰囲気(ふんいき):분위기, いいですね:좋네요',
    '책 제목이 재미있어 보이네요.': '本(ほん):책, タイトル:제목, 面白そう:재미있어 보임',
    '자주 오시나봐요.': 'よく:자주, 来られる:오시나(존경)',
    
    // 상황: 데이트 신청하기
    '같이 밥 먹으러 갈래요?': '一緒に:같이, ご飯(ごはん):밥, 行きませんか:가지 않을래요',
    '이번 주말에 시간 어때요?': '今週末:이번 주말, 時間(じかん):시간, どうですか:어때요',
    
    // 상황: 연락처 물어보기
    '라인이나 인스타 하세요?': 'やってますか:하세요, やる:하다',
    '조금 더 이야기해보고 싶어요.': 'もう少し:조금 더, 話してみたい:이야기해보고 싶다'
};

async function run() {
    console.log('🔍 Fetching expressions from Notion...');
    const response = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        }
    });
    
    const { results } = await response.json();
    console.log(`✅ Found ${results.length} expressions. Updating Words...`);

    for (const page of results) {
        const title = page.properties.Title_KR.title[0]?.plain_text;
        const words = vocabMap[title];

        if (words) {
            console.log(`📝 Updating "${title}" with words: ${words}`);
            await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${NOTION_TOKEN}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    properties: {
                        Words: {
                            rich_text: [{ text: { content: words } }]
                        }
                    }
                })
            });
        }
    }
    console.log('✨ All expressions updated in Notion!');
}

run();
