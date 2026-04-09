import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

/**
 * 로컬 이미지를 Vercel Blob으로 업로드합니다.
 * @param {string} localPath - 로컬 파일 경로
 * @param {string} fileName - 저장될 파일 이름
 * @returns {Promise<string>} - 업로드된 이미지 URL
 */
export async function uploadToBlob(localPath, fileName) {
    if (!BLOB_READ_WRITE_TOKEN) {
        throw new Error('Missing BLOB_READ_WRITE_TOKEN in .env');
    }

    try {
        const fileBuffer = fs.readFileSync(localPath);
        console.log(`☁️  Uploading ${fileName} to Vercel Blob...`);
        
        const blob = await put(`situations/${fileName}`, fileBuffer, {
            access: 'public',
            contentType: 'image/png',
            token: BLOB_READ_WRITE_TOKEN
        });

        console.log(`✅ Upload successful: ${blob.url}`);
        return blob.url;
    } catch (err) {
        console.error(`❌ Upload failed for ${fileName}:`, err.message);
        throw err;
    }
}

// 스크립트로 직접 실행 시 (예: node scripts/upload-images.js some-id.png)
const targetFile = process.argv[2];
if (targetFile) {
    const localPath = path.join(process.cwd(), 'public', 'situations', targetFile);
    if (fs.existsSync(localPath)) {
        uploadToBlob(localPath, targetFile);
    } else {
        console.error(`File not found: ${localPath}`);
    }
}
