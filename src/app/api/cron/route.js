import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { getKSTDate } from '@/lib/date';
import { generateAndSave, getSeriesInfo } from '@/lib/gemini-content';
import { sendTelegramMessage } from '@/lib/telegram';

const getBusinessStatus = () => {
    try {
        const filePath = path.join(process.cwd(), 'BUSINESS.md');
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const all = (content.match(/- \[[ x]\]/g) || []).length;
            const done = (content.match(/- \[x\]/g) || []).length;
            const progress = all > 0 ? Math.round((done / all) * 100) : 0;
            const next =
                content
                    .split('\n')
                    .find((l) => l.includes('- [ ]'))
                    ?.replace(/- \[ \]\s*/, '')
                    .trim() || 'All Done!';
            return `\n\n📈 <b>Status</b>: ${progress}% (${done}/${all})\n🚧 <b>Next</b>: ${next}`;
        }
    } catch (e) {
        console.error('Business Status Parse Error:', e);
    }
    return '';
};

export async function GET(request) {
    const targetDate = getKSTDate();

    try {
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notionToken = process.env.NOTION_TOKEN;
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!notionToken || !geminiApiKey) throw new Error('Env configuration missing');

        const situationDbId =
            process.env.NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATIONS_DB_ID;

        // 오늘 날짜 데이터가 이미 있으면 스킵 (재시도 cron 중복 방지)
        const existing = await fetch(`https://api.notion.com/v1/databases/${situationDbId}/query`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${notionToken}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filter: { property: 'Date', date: { equals: targetDate } },
                page_size: 1,
            }),
        }).then((r) => r.json());

        if (existing.results?.length > 0) {
            return NextResponse.json({ skipped: true, message: `${targetDate} 데이터 이미 존재` });
        }

        const result = await generateAndSave({
            targetDate,
            geminiApiKey,
            geminiApiKeyFallback: process.env.GEMINI_API_KEY_FALLBACK,
            geminiImageApiKey: process.env.GEMINI_IMAGE_API_KEY,
            notionToken,
            situationDbId,
            expressionsDbId:
                process.env.NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSIONS_DB_ID,
        });

        const bizStatus = getBusinessStatus();
        const imgStatus = result.imageUrl
            ? '🖼️ 이미지 생성됨'
            : `⚠️ 이미지 없음${result.imageError ? ` (${result.imageError})` : ''}`;
        const series = getSeriesInfo(targetDate);
        const seriesTag = series ? `\n📚 시리즈 ${series.day}일차` : '';
        await sendTelegramMessage(
            `✅ <b>Koi Language</b> 동기화 성공\n주제: ${result.situation.title_kr}\n${imgStatus}${seriesTag}${bizStatus}`
        );

        // ISR 캐시 즉시 갱신
        revalidatePath('/');

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Cron Error:', err);
        await sendTelegramMessage(`❌ <b>Koi Language</b> 동기화 실패\n에러: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
