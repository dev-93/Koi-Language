#!/usr/bin/env node
import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SITUATION_DB_ID = process.env.VITE_NOTION_SITUATION_DB_ID;
const EXPRESSIONS_DB_ID = process.env.VITE_NOTION_EXPRESSION_DB_ID;

const httpRequest = (options, body) =>
    new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = https.request(
            {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
                    Authorization: `Bearer ${NOTION_TOKEN}`,
                    'Notion-Version': '2022-06-28',
                    ...options.headers,
                },
            },
            (res) => {
                let data = '';
                res.on('data', (c) => (data += c));
                res.on('end', () => resolve({ status: res.statusCode, body: data }));
            }
        );
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });

const archivePage = async (pageId) => {
    const { status } = await httpRequest(
        {
            hostname: 'api.notion.com',
            path: `/v1/pages/${pageId}`,
            method: 'PATCH',
        },
        { archived: true }
    );
    return status;
};

const cleanup = async () => {
    const dates = ['2026-04-04', '2026-04-05'];

    for (const dbId of [SITUATION_DB_ID, EXPRESSIONS_DB_ID]) {
        console.log(`\n🧹 Database ${dbId} 에서 4월 4일, 5일 데이터 삭제 중...`);
        const { body } = await httpRequest(
            {
                hostname: 'api.notion.com',
                path: `/v1/databases/${dbId}/query`,
                method: 'POST',
            },
            {
                filter: {
                    or: dates.map((d) => ({ property: 'Date', date: { equals: d } })),
                },
            }
        );

        const data = JSON.parse(body);
        const pages = data.results || [];
        console.log(`🔍 총 ${pages.length}개의 페이지 발견.`);

        for (const page of pages) {
            const res = await archivePage(page.id);
            console.log(`🗑️ Page archived: ${page.id} (Status: ${res})`);
        }
    }
    console.log('\n✅ Cleanup complete!');
};

cleanup();
