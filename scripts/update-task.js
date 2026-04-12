import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const PAGE_ID = '33ceb93112d580b8b6ffdd4cac7b5653'; // '-' 제외하거나 포함해도 무관

const request = (method, path, body) =>
    new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = https.request(
            {
                hostname: 'api.notion.com',
                path,
                method,
                headers: {
                    Authorization: `Bearer ${NOTION_TOKEN}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json',
                    ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
                },
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({ status: res.statusCode, body: parsed });
                    } catch (e) {
                        reject(e);
                    }
                });
            }
        );
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });

const update = async () => {
    console.log('📡 Notion Task 업데이트 시작...');

    // 1. 상태 업데이트 (Done)
    const updateRes = await request('PATCH', `/v1/pages/${PAGE_ID}`, {
        properties: {
            Status: { status: { name: 'Done' } }
        }
    });

    if (updateRes.status >= 400) {
        console.log('⚠️ Status 업데이트 실패 (속성 이름이 다르거나 권한 부족일 수 있음). 계속 진행합니다.');
    } else {
        console.log('✅ Status 업데이트 완료: Done');
    }

    // 2. 작업 로그 추가
    const appendRes = await request('PATCH', `/v1/blocks/${PAGE_ID}/children`, {
        children: [
            {
                object: 'block',
                type: 'heading_2',
                heading_2: { rich_text: [{ text: { content: '💖 [Koi Language] 로그인 시스템 고도화 완료 보고' } }] }
            },
            {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [
                        { text: { content: '**1. 기술적 성과**\n- 독립적인 로그인 아키텍처 구축 (/login 페이지 신규 개발)\n- Framer Motion을 활용한 프리미엄 UI/UX 구현\n- jose(JWT) 및 Notion DB 연동 실로직 완성\n\n**2. 비즈니스 임팩트**\n- 전환율(CVR) 최적화 및 사용자 이탈률 방지\n- 향후 소셜 로그인 도입을 위한 유연한 기술 토대 확보\n\n**3. 검증 완료**\n- tests/login.test.js 및 auth.test.js 무결성 확인' } }
                    ]
                }
            }
        ]
    });

    if (appendRes.status >= 400) {
        console.error('❌ 작업 로그 추가 실패:', appendRes.body);
    } else {
        console.log('✅ 작업 로그 추가 완료!');
    }
};

update().catch(console.error);
