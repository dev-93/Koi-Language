#!/usr/bin/env node
/* eslint-disable no-undef */
import dotenv from 'dotenv';
import { getKSTDate } from '../src/lib/date.js';
import { generateAndSave } from '../src/lib/gemini-content.js';
import { sendTelegramReport } from './report-business.js';

dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SITUATION_DB_ID = process.env.NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATIONS_DB_ID;
const EXPRESSIONS_DB_ID =
    process.env.NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSIONS_DB_ID;

const targetDate = process.argv[2] || getKSTDate();

(async () => {
    console.log(`\n🚀 [${targetDate}] 로마자 통합 콘텐츠 생성을 시작합니다...`);
    if (!GEMINI_API_KEY || !NOTION_TOKEN) return console.error('❌ 설정 오류');

    try {
        const result = await generateAndSave({
            targetDate,
            geminiApiKey: GEMINI_API_KEY,
            geminiApiKeyFallback: process.env.GEMINI_API_KEY_FALLBACK,
            notionToken: NOTION_TOKEN,
            situationDbId: SITUATION_DB_ID,
            expressionsDbId: EXPRESSIONS_DB_ID,
            onProgress: () => process.stdout.write('.'),
        });

        console.log(
            `\n✅ 성공! (${result.situation.title_kr}, ${result.expressionCount}개 표현${result.imageUrl ? ', 🖼️ 이미지 생성됨' : ''})`
        );
        await sendTelegramReport();
    } catch (err) {
        console.error(`\n❌ 실패:`, err.message);
    }
})();
