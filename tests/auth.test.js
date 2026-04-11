import { encrypt, decrypt } from '../src/lib/crypto.js';
import assert from 'assert';

async function testAuth() {
    console.log('🧪 Starting Auth Logic Tests...');

    try {
        const payload = { 
            user: { email: 'test@example.com', name: 'Test User' }, 
            expires: new Date(Date.now() + 10000) 
        };

        // 1. Encryption
        const token = await encrypt(payload);
        assert.ok(token, 'Token should be generated');
        console.log('✅ Token generation passed');

        // 2. Decryption
        const decrypted = await decrypt(token);
        assert.strictEqual(decrypted.user.email, payload.user.email, 'Decrypted user email should match');
        assert.strictEqual(decrypted.user.name, payload.user.name, 'Decrypted user name should match');
        console.log('✅ Token decryption passed');

        // 3. Invalid Token
        const invalidToken = 'invalid.token.here';
        const result = await decrypt(invalidToken);
        assert.strictEqual(result, null, 'Invalid token should return null');
        console.log('✅ Invalid token handling passed');

        console.log('\n🎉 ALL AUTH TESTS PASSED!');
    } catch (error) {
        console.error('\n❌ AUTH TESTS FAILED:');
        console.error(error);
        process.exit(1);
    }
}

testAuth();
