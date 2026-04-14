import assert from 'node:assert';
import { supabase } from '../src/lib/supabase.js';
import useStore from '../src/store.js';

// Zustand의 persist 미들웨어가 Node.js 환경에서 에러가 나지 않도록 localStorage 모킹
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// Supabase auth.signOut 모킹 (실제 네트워크 요청 방지)
supabase.auth.signOut = async () => {
  return { error: null };
};

async function testSupabase() {
  console.log('--- Testing Supabase Client ---');
  assert.ok(supabase, 'Supabase client should exist');
  assert.strictEqual(typeof supabase.auth.signOut, 'function', 'supabase.auth.signOut should be a function');
  console.log('✅ Supabase Client test passed\n');
}

async function testStoreAuth() {
  console.log('--- Testing Store Auth logic ---');
  
  // 1. 초기 상태 확인
  const initialState = useStore.getState();
  // persist 미들웨어 때문에 초기값이 다를 수 있으므로 명시적으로 초기화 (테스트용)
  useStore.setState({ user: null, session: null, userProfile: null, authLoading: true });
  
  assert.strictEqual(useStore.getState().user, null, 'Initial user should be null');
  
  // 2. setAuth 테스트
  const mockSession = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' }
    }
  };
  
  console.log('Testing setAuth...');
  useStore.getState().setAuth(mockSession);
  const stateAfterAuth = useStore.getState();
  
  assert.deepStrictEqual(stateAfterAuth.session, mockSession, 'Session should be set');
  assert.deepStrictEqual(stateAfterAuth.user, mockSession.user, 'User should be set');
  assert.strictEqual(stateAfterAuth.userProfile.name, 'Test User', 'User profile name should be updated from metadata');
  assert.strictEqual(stateAfterAuth.authLoading, false, 'authLoading should be false after auth');
  
  // 3. signOut 테스트
  console.log('Testing signOut...');
  await useStore.getState().signOut();
  const stateAfterSignOut = useStore.getState();
  
  assert.strictEqual(stateAfterSignOut.user, null, 'User should be null after signOut');
  assert.strictEqual(stateAfterSignOut.session, null, 'Session should be null after signOut');
  assert.strictEqual(stateAfterSignOut.userProfile, null, 'UserProfile should be null after signOut');
  
  console.log('✅ Store Auth test passed\n');
}

(async () => {
  try {
    console.log('--- Starting Auth Tests ---');
    await testSupabase();
    console.log('Supabase test done');
    await testStoreAuth();
    console.log('Store test done');
    console.log('All tests passed successfully! 🚀');
  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    console.log('--- Auth Tests Completed ---');
    process.exit(0);
  }
})();
