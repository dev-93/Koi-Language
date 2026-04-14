import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
    persist(
        (set, get) => ({
            userProfile: null, // { myNationality: 'KR'|'JP', myGender: 'M'|'F', targetGender: 'M'|'F', name: string }
            user: null,
            session: null,
            authLoading: true,
            currentTab: 'today', // 'today' | 'archive' | 'settings'
            dailyProgress: {
                date: new Date().toDateString(),
                cardsLearned: [], // Array of situation IDs
            },
            recentKeywords: [], // 최근 학습한 상황의 키워드 (중복 방지용)
            favorites: [], // 마음에 드는 표현 저장 [{exprId, jp, kr, reading, tip, situationTitle, savedAt}]

            setUserProfile: (profile) => set({ userProfile: profile }),
            setAuth: (session) => {
                const user = session?.user || null;
                const metadata = user?.user_metadata || {};
                
                set((state) => ({
                    session,
                    user,
                    authLoading: false,
                    userProfile: user ? { 
                        ...state.userProfile, 
                        name: metadata.full_name || user.email,
                        myNationality: metadata.nationality || state.userProfile?.myNationality || 'KR'
                    } : state.userProfile
                }));
            },
            updateUserProfile: async (updates) => {
                const { supabase } = await import('./lib/supabase.js');
                const { data, error } = await supabase.auth.updateUser({
                    data: updates
                });
                
                if (error) throw error;
                
                set((state) => ({
                    user: data.user,
                    userProfile: {
                        ...state.userProfile,
                        ...updates,
                        // metadata.nationality가 있으면 myNationality로 매핑
                        myNationality: updates.nationality || state.userProfile?.myNationality
                    }
                }));
                return data;
            },
            signOut: async () => {
                const { supabase } = await import('./lib/supabase.js');
                await supabase.auth.signOut();
                set({ user: null, session: null, userProfile: null });
            },
            resetUserProfile: () => set({ userProfile: null }),
            setCurrentTab: (tab) => set({ currentTab: tab }),

            checkAndResetProgress: () => {
                const state = get();
                const today = new Date().toDateString();
                if (state.dailyProgress.date !== today) {
                    set({
                        dailyProgress: {
                            date: today,
                            cardsLearned: [],
                        },
                        recentKeywords: [],
                    });
                }
            },

            addRecentKeywords: (keywords) =>
                set((state) => ({
                    // 중복 제거 및 최대 8개만 유지 (토큰 효율)
                    recentKeywords: [...new Set([...(keywords || []), ...state.recentKeywords])].slice(
                        0,
                        8
                    ),
                })),

            markCardLearned: (situationId) =>
                set((state) => {
                    const today = new Date().toDateString();
                    // Reset if it's a new day
                    if (state.dailyProgress.date !== today) {
                        return {
                            dailyProgress: {
                                date: today,
                                cardsLearned: [situationId],
                            },
                        };
                    }

                    // Add if not already learned today
                    if (!state.dailyProgress.cardsLearned.includes(situationId)) {
                        return {
                            dailyProgress: {
                                ...state.dailyProgress,
                                cardsLearned: [...state.dailyProgress.cardsLearned, situationId],
                            },
                        };
                    }
                    return state;
                }),

            resetProgress: () =>
                set({
                    dailyProgress: { date: new Date().toDateString(), cardsLearned: [] },
                    recentKeywords: [],
                }),

            toggleFavorite: (expr) =>
                set((state) => {
                    const exists = state.favorites.some((f) => f.exprId === expr.exprId);
                    if (exists) {
                        return { favorites: state.favorites.filter((f) => f.exprId !== expr.exprId) };
                    }
                    return { favorites: [{ ...expr, savedAt: new Date().toISOString() }, ...state.favorites] };
                }),

            isFavorite: (exprId) => {
                return get().favorites.some((f) => f.exprId === exprId);
            },
        }),
        {
            name: 'koi-language-storage',
        }
    )
);

export default useStore;
