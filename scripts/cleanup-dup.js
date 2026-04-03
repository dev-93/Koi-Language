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

const cleanupDuplicates = async (date) => {
    console.log(`\n🔍 ${date} 중복 데이터 체크 중...`);
    
    // Situation DB 정리에 앞서 데이터 조회
    const { body } = await httpRequest(
        {
            hostname: 'api.notion.com',
            path: `/v1/databases/${SITUATION_DB_ID}/query`,
            method: 'POST',
        },
        {
            filter: { property: "Date", date: { equals: date } }
        }
    );
    
    const data = JSON.parse(body);
    const pages = data.results || [];
    
    if (pages.length > 1) {
        console.log(`⚠️ ${date}에 ${pages.length}개의 중복 페이지 발견. 1개만 남기고 모두 삭제합니다.`);
        // 첫 번째 페이지만 남기고 나머지 삭제
        for (let i = 1; i < pages.length; i++) {
            const res = await archivePage(pages[i].id);
            console.log(`🗑️ Duplicate Situation archived: ${pages[i].id} (Status: ${res})`);
        }
    } else {
        console.log(`✅ ${date} 중복 없음.`);
    }
};

const finalCleanup = async () => {
    // 1. 4월 2일 중복 제거
    await cleanupDuplicates('2026-04-02');
    
    // 2. 4월 4일/5일 혹시 남아있다면 완전 제거
    for (const d of ['2026-04-04', '2026-04-05']) {
        const { body } = await httpRequest(
            { hostname: 'api.notion.com', path: `/v1/databases/${SITUATION_DB_ID}/query`, method: 'POST' },
            { filter: { property: "Date", date: { equals: d } } }
        );
        const pages = JSON.parse(body).results || [];
        for (const p of pages) {
            await archivePage(p.id);
            console.log(`🗑️ Leftover ${d} archived: ${p.id}`);
        }
    }
    
    console.log('\n✅ Cleanup complete!');
};

finalCleanup();
