/* eslint-env node */
import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

/**
 * [Data Validation Script]
 * 이 스크립트는 노션 데이터베이스의 데이터 정합성을 검사합니다.
 * - 필수 필드 누락 체크 (Date, Level, Words)
 * - 관점 밸런스 체크 (KR용/JP용 표현 개수)
 */

const token = process.env.NOTION_TOKEN;
const SIT_DB_ID = process.env.VITE_NOTION_SITUATION_DB_ID;
const EXPR_DB_ID = process.env.VITE_NOTION_EXPRESSION_DB_ID;

const notionRequest = (method, path, body) =>
    new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = https.request(
            {
                hostname: 'api.notion.com',
                path,
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
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
                        if (res.statusCode >= 400) reject(parsed);
                        else resolve(parsed);
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

async function validate() {
    console.log('🚀 노션 데이터 무결성 검사를 시작합니다...');
    try {
        const [sitRes, exprRes] = await Promise.all([
            notionRequest('POST', `/v1/databases/${SIT_DB_ID}/query`, {}),
            notionRequest('POST', `/v1/databases/${EXPR_DB_ID}/query`, {})
        ]);

        const situations = sitRes.results;
        const expressions = exprRes.results;

        console.log(`- 탐색된 상황 개수: ${situations.length}`);
        console.log(`- 탐색된 표현 개수: ${expressions.length}\n`);

        let errorCount = 0;

        situations.forEach(sit => {
            const title = sit.properties.Title_KR.title[0]?.plain_text || '제목 없음';
            const date = sit.properties.Date.date?.start;
            const relatedExprs = expressions.filter(ex => 
                ex.properties.Situation.relation.some(rel => rel.id === sit.id)
            );

            console.log(`[상황: ${title}]`);
            if (!date) {
                console.error('  ❌ [Error] 날짜(Date)가 비어있습니다.');
                errorCount++;
            }

            const krCount = relatedExprs.filter(ex => ex.properties.Type.select?.name === 'kr_wants_jp').length;
            const jpCount = relatedExprs.filter(ex => ex.properties.Type.select?.name === 'jp_wants_kr').length;

            if (krCount === 0 || jpCount === 0) {
                console.warn(`  ⚠️ [Warn] 관점 불균형 (한국인용: ${krCount}, 일본인용: ${jpCount}) - 둘 다 있어야 합니다.`);
                errorCount++;
            }

            relatedExprs.forEach(ex => {
                const exTitle = ex.properties.Title_KR.title[0]?.plain_text;
                const exLevel = ex.properties.Level.select?.name;
                const exWords = ex.properties.Words.rich_text[0]?.plain_text;
                const exDate = ex.properties.Date.date?.start;

                if (!exLevel || !exWords || !exDate) {
                    console.error(`  ❌ [Error] 표현(${exTitle}): 필수 필드 누락 (Level: ${exLevel || '없음'}, Words: ${exWords ? '있음' : '없음'}, Date: ${exDate || '없음'})`);
                    errorCount++;
                }
            });
        });

        if (errorCount === 0) {
            console.log('\n✅ 모든 데이터가 완벽하게 준비되었습니다! 배포하셔도 좋습니다.');
        } else {
            console.log(`\n❌ 총 ${errorCount}개의 데이터 결함이 발견되었습니다. 수정을 권장합니다.`);
            process.exit(1);
        }

    } catch (err) {
        console.error('검사 중 오류 발생:', err);
        process.exit(1);
    }
}

validate();
