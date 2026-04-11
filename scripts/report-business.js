import fs from 'fs';
import path from 'path';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

export async function sendTelegramReport() {
    const businessMdPath = path.join(process.cwd(), 'BUSINESS.md');
    if (!fs.existsSync(businessMdPath)) return;

    const content = fs.readFileSync(businessMdPath, 'utf8');
    const allTasks = (content.match(/- \[[ x]\]/g) || []).length;
    const completedTasks = (content.match(/- \[x\]/g) || []).length;
    const progress = allTasks > 0 ? Math.round((completedTasks / allTasks) * 100) : 0;

    const nextActionLine =
        content.split('\n').find((line) => line.includes('- [ ]')) || 'All Done!';
    const nextAction = nextActionLine.replace(/- \[ \]\s*/, '').trim();

    const reportMessage = `
📈 <b>Koi-Language Status</b>
- Progress: ${progress}% (${completedTasks}/${allTasks})
- Next: ${nextAction}
    `.trim();

    const payload = JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: reportMessage,
        parse_mode: 'HTML',
    });

    return new Promise((resolve) => {
        const options = {
            hostname: 'api.telegram.org',
            path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };

        const req = https.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Business report sent.');
            } else {
                console.error(`❌ Report failed: ${res.statusCode}`);
            }
            resolve();
        });

        req.on('error', (e) => {
            console.error('❌ Report failed:', e.message);
            resolve();
        });

        req.write(payload);
        req.end();
    });
}

if (
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.endsWith('report-business.js')
) {
    sendTelegramReport();
}
