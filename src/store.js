import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
    persist(
        (set, get) => ({
            userProfile: null, // { myNationality: 'KR'|'JP', myGender: 'M'|'F', targetGender: 'M'|'F', name: string }
            dailyProgress: {
                date: new Date().toDateString(),
                cardsLearned: [], // Array of situation IDs
            },
            recentKeywords: [], // 최근 학습한 상황의 키워드 (중복 방지용)

            setUserProfile: (profile) => set({ userProfile: profile }),
            resetUserProfile: () => set({ userProfile: null }),

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
        }),
        {
            name: 'koi-language-storage',
        }
    )
);

export default useStore;
