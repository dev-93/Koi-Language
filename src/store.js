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
      
      setUserProfile: (profile) => set({ userProfile: profile }),
      
      checkAndResetProgress: () => {
        const state = get();
        const today = new Date().toDateString();
        if (state.dailyProgress.date !== today) {
          set({
            dailyProgress: {
              date: today,
              cardsLearned: []
            }
          });
        }
      },

      markCardLearned: (situationId) => set((state) => {
        const today = new Date().toDateString();
        // Reset if it's a new day
        if (state.dailyProgress.date !== today) {
          return {
            dailyProgress: {
              date: today,
              cardsLearned: [situationId]
            }
          };
        }
        
        // Add if not already learned today
        if (!state.dailyProgress.cardsLearned.includes(situationId)) {
          return {
            dailyProgress: {
              ...state.dailyProgress,
              cardsLearned: [...state.dailyProgress.cardsLearned, situationId]
            }
          };
        }
        return state;
      }),
      
      resetProgress: () => set({ dailyProgress: { date: new Date().toDateString(), cardsLearned: [] } })
    }),
    {
      name: 'koi-language-storage',
    }
  )
);

export default useStore;
