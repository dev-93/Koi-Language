import 'dotenv/config';
import crypto from 'crypto';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const USERS_DB_ID = process.env.NOTION_USERS_DB_ID;

/**
 * 비밀번호 해싱
 */
export function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * 이메일로 사용자 찾기
 */
export async function findUserByEmail(email) {
    if (!NOTION_TOKEN || !USERS_DB_ID) return null;

    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${USERS_DB_ID}/query`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filter: {
                    property: 'Email',
                    title: { equals: email },
                },
            }),
        });

        const data = await response.json();
        if (!response.ok || data.results.length === 0) return null;

        const page = data.results[0];
        const props = page.properties;

        return {
            id: page.id,
            email: props.Email.title[0]?.plain_text,
            password: props.Password.rich_text[0]?.plain_text,
            name: props.Name.rich_text[0]?.plain_text,
            nationality: props.Nationality.select?.name,
            userGender: props.UserGender.select?.name,
            targetGender: props.TargetGender.select?.name,
        };
    } catch (error) {
        console.error('findUserByEmail Error:', error);
        return null;
    }
}

/**
 * 사용자 생성
 */
export async function createUser({ email, password, name }) {
    if (!NOTION_TOKEN || !USERS_DB_ID) {
        console.error('❌ Missing NOTION_TOKEN or USERS_DB_ID in createUser');
        return null;
    }

    try {
        console.log(`📡 Sending request to Notion to create user: ${email}`);
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                parent: { database_id: USERS_DB_ID },
                properties: {
                    Email: { title: [{ text: { content: email } }] },
                    Password: { rich_text: [{ text: { content: hashPassword(password) } }] },
                    Name: { rich_text: [{ text: { content: name || 'Koi User' } }] },
                    CreatedAt: { date: { start: new Date().toISOString() } }
                },
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('❌ Notion API Error in createUser:', data);
            throw new Error(data.message || 'Failed to create user');
        }

        console.log(`✅ User created successfully in Notion: ${data.id}`);
        return { id: data.id, email, name };
    } catch (error) {
        console.error('❌ createUser Exception:', error);
        throw error;
    }
}

/**
 * 사용자 프로필 업데이트 (국적, 성별)
 */
export async function updateUserProfile(userId, profile) {
    if (!NOTION_TOKEN) return null;

    try {
        const properties = {};
        if (profile.nationality) properties.Nationality = { select: { name: profile.nationality } };
        if (profile.userGender) properties.UserGender = { select: { name: profile.userGender } };
        if (profile.targetGender) properties.TargetGender = { select: { name: profile.targetGender } };

        const response = await fetch(`https://api.notion.com/v1/pages/${userId}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ properties }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update user profile');

        return true;
    } catch (error) {
        console.error('updateUserProfile Error:', error);
        throw error;
    }
}
