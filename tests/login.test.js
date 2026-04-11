import 'dotenv/config';
import { findUserByEmail, createUser, updateUserProfile, hashPassword } from '../src/lib/user.js';
import assert from 'assert';

/**
 * [Login & User Integration Test]
 * 이 테스트는 Notion DB를 활용한 사용자 관리 로직을 검증합니다.
 */

const TEST_EMAIL = `test_${Date.now()}@koi-language.com`;
const TEST_PASSWORD = 'password123';
const TEST_NAME = 'Test User';

async function runTest() {
    console.log('🧪 사용자 관리 통합 테스트를 시작합니다...');
    let userId = null;

    try {
        // 1. 사용자 생성 테스트
        console.log('1️⃣ 사용자 생성 테스트 중...');
        const newUser = await createUser({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            name: TEST_NAME
        });
        
        if (!newUser || !newUser.id) {
            throw new Error('사용자 생성 결과가 비어있거나 ID가 없습니다.');
        }

        assert.ok(newUser.id, '사용자 생성 후 ID가 반환되어야 합니다.');
        assert.strictEqual(newUser.email, TEST_EMAIL, '이메일이 일치해야 합니다.');
        userId = newUser.id;
        console.log('✅ 사용자 생성 성공');

        // 2. 이메일로 사용자 조회 테스트
        console.log('2️⃣ 사용자 조회 테스트 중...');
        const user = await findUserByEmail(TEST_EMAIL);
        assert.ok(user, '생성된 사용자를 조회할 수 있어야 합니다.');
        assert.strictEqual(user.id, userId, 'ID가 일치해야 합니다.');
        assert.strictEqual(user.password, hashPassword(TEST_PASSWORD), '비밀번호 해시값이 일치해야 합니다.');
        console.log('✅ 사용자 조회 성공');

        // 3. 프로필 업데이트 테스트
        console.log('3️⃣ 프로필 업데이트 테스트 중...');
        const updateResult = await updateUserProfile(userId, {
            nationality: 'KR',
            userGender: 'M',
            targetGender: 'F'
        });
        assert.strictEqual(updateResult, true, '프로필 업데이트가 성공해야 합니다.');
        
        // 업데이트 결과 재조회
        const updatedUser = await findUserByEmail(TEST_EMAIL);
        assert.strictEqual(updatedUser.nationality, 'KR', '국적이 KR로 업데이트되어야 합니다.');
        assert.strictEqual(updatedUser.userGender, 'M', '본인 성별이 M으로 업데이트되어야 합니다.');
        assert.strictEqual(updatedUser.targetGender, 'F', '상대 성별이 F로 업데이트되어야 합니다.');
        console.log('✅ 프로필 업데이트 성공');

        console.log('\n✨ 모든 사용자 관리 테스트가 성공적으로 완료되었습니다!');
    } catch (error) {
        console.error('\n❌ 테스트 실패 상세:', error);
        process.exit(1);
    }
}

runTest();
