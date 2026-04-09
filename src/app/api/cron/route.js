import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getKSTDate } from '@/lib/date';
import { generateAndSave } from '@/lib/gemini-content';
import { sendTelegramMessage } from '@/lib/telegram';

const getBusinessStatus = () => {
    try {
        const filePath = path.join(process.cwd(), 'BUSINESS.md');
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const all = (content.match(/- \[[ x]\]/g) || []).length;
            const done = (content.match(/- \[x\]/g) || []).length;
            const progress = all > 0 ? Math.round((done / all) * 100) : 0;
            const next = content.split('\n').find(l => l.includes('- [ ]'))?.replace(/- \[ \]\s*/, '').trim() || 'All Done!';
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

        const result = await generateAndSave({
            targetDate,
            geminiApiKey,
            geminiApiKeyFallback: process.env.GEMINI_API_KEY_FALLBACK,
            notionToken,
            situationDbId: process.env.NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATIONS_DB_ID,
            expressionsDbId: process.env.NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSIONS_DB_ID,
        });

        const bizStatus = getBusinessStatus();
        const imgStatus = result.imageUrl ? '🖼️ 이미지 생성됨' : '⚠️ 이미지 없음';
        await sendTelegramMessage(`✅ <b>Koi Language</b> 동기화 성공\n주제: ${result.situation.title_kr}\n${imgStatus}${bizStatus}`);
        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Cron Error:', err);
        await sendTelegramMessage(`❌ <b>Koi Language</b> 동기화 실패\n에러: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
