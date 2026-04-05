import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

export async function sendTelegramReport() {
    const businessMdPath = path.join(process.cwd(), 'BUSINESS.md');
    const content = fs.readFileSync(businessMdPath, 'utf8');

    const allTasks = content.match(/- \[[ x]\]/g) || [];
    const completedTasks = content.match(/- \[x\]/g) || [];
    const progress = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

    const nextActionLine = content.split('\n').find(line => line.includes('- [ ]')) || 'All Done!';
    const nextAction = nextActionLine.replace(/- \[ \]\s*/, '').trim();

    const reportMessage = `
📈 *Koi-Language Status*
- Progress: ${progress}% (${completedTasks.length}/${allTasks.length})
- Next: ${nextAction}
    `.trim();

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: reportMessage,
                parse_mode: 'Markdown',
            }),
        });
        console.log('✅ Business report sent.');
    } catch (e) {
        console.error('❌ Report failed:', e.message);
    }
}

// 직접 실행 시에도 동작하도록 유지
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('report-business.js')) {
    sendTelegramReport();
}
