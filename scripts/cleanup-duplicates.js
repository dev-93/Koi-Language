import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const KEEP_SITUATION_ID = '33aeb931-12d5-815d-9167-e38c43760cfb'; // 벚꽃 데이트
const DATE = '2026-04-06';

async function cleanup() {
    console.log(`🧹 ${DATE} 중복 데이터 정리 시작...`);

    // 1. 잘못된 상황들 삭제
    const sitDbId = process.env.NOTION_SITUATION_DB_ID || '332eb93112d580e29e63f7b9463b653f';
    const situations = await notion.databases.query({
        database_id: sitDbId,
        filter: {
            and: [
                { property: 'Date', date: { equals: DATE } },
                { property: 'title', title: { is_not_empty: true } },
            ],
        },
    });

    for (const page of situations.results) {
        if (page.id !== KEEP_SITUATION_ID) {
            console.log(`🗑️ 상황 삭제: ${page.id}`);
            await notion.pages.update({ page_id: page.id, archived: true });
        }
    }

    // 2. 연결되지 않았거나 다른 상황에 연결된 표현들 삭제
    const expDbId = process.env.NOTION_EXPRESSION_DB_ID || '332eb93112d5811a81edeedec17049b7';
    const expressions = await notion.databases.query({
        database_id: expDbId,
        filter: { property: 'Date', date: { equals: DATE } },
    });

    for (const page of expressions.results) {
        const relation = page.properties.Situation?.relation || [];
        const isLinkedToTarget = relation.some((r) => r.id === KEEP_SITUATION_ID);

        if (!isLinkedToTarget) {
            console.log(`🗑️ 표현 삭제: ${page.id}`);
            await notion.pages.update({ page_id: page.id, archived: true });
        }
    }

    console.log('✅ 정리 완료!');
}

cleanup().catch(console.error);
