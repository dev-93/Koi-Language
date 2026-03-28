import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import { situations } from '../data/situations';
import { BookOpen, MessageCircleHeart } from 'lucide-react';

export default function Home() {
  const { userProfile, dailyProgress, checkAndResetProgress, markCardLearned } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkAndResetProgress();
  }, [checkAndResetProgress]);

  const isKr = userProfile.myNationality === 'KR';
  const myIcon = isKr ? '🇰🇷' : '🇯🇵';
  const targetIcon = isKr ? '🇯🇵' : '🇰🇷';
  const targetGenderAvatar = userProfile.targetGender === 'M' ? '👨' : '👩';

  const currentSituation = situations[0]; 

  const completedCount = dailyProgress.cardsLearned.length;
  const targetCards = 5;
  const progressRatio = Math.min((completedCount / targetCards) * 100, 100);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="title-cute m-0 text-3xl">Koi Language</h1>
        <div className="flex items-center gap-1 text-sm bg-white px-3 py-1 rounded-full shadow-sm">
          <span>{myIcon}</span>
          <span className="text-gray-300">|</span>
          <span>{targetIcon}{targetGenderAvatar}</span>
        </div>
      </div>

      <div className="card text-center relative overflow-hidden border-2 border-primary-peach/20 bg-white/50 backdrop-blur-sm">
        <div className="flex justify-center mb-2">
           <span className="text-2xl">✨</span>
        </div>
        <h2 className="mb-1 text-xl font-bold text-gray-800">오늘의 한마디</h2>
        <p className="text-sm text-gray-500 mb-4">하루 딱 5개 상황만 마스터해봐요!</p>
        
        <div className="flex justify-between mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          <span>PROGRESS</span>
          <span>{completedCount} / {targetCards}</span>
        </div>
        <div className="progress-bar-bg h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="progress-bar-fill" style={{ width: `${progressRatio}%`, background: 'linear-gradient(90deg, #FFB3A7, #FFDFDA)' }} />
        </div>
      </div>

      <div className="mt-10">
        <div className="flex flex-col gap-1 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary-peach rounded-full"></div>
            <h3 className="text-xl font-bold m-0 text-gray-800">오늘의 상황</h3>
          </div>
          <div className="mt-3 p-4 bg-primary-peach/5 rounded-2xl border border-primary-peach/10">
            <p className="text-primary-peach font-bold text-lg mb-1">{isKr ? currentSituation.title.kr : currentSituation.title.jp}</p>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">{isKr ? currentSituation.desc.kr : currentSituation.desc.jp}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-4 mb-20">
          {(isKr ? currentSituation.expressions.kr_wants_jp : currentSituation.expressions.jp_wants_kr).map((expr, idx) => (
            <div key={idx} className="relative">
              <div className="card p-6 border-none shadow-sm bg-white rounded-[1.8rem] hover:ring-2 hover:ring-primary-peach/10 transition-all">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[21px] font-bold m-0 text-gray-800 tracking-tight leading-tight">{isKr ? expr.jp : expr.kr}</h4>
                    <p className="text-[11px] text-blue-500/80 font-bold tracking-tight">{isKr ? expr.reading : expr.jp}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-50 flex flex-col gap-3">
                    <div className="bg-gray-50/80 px-4 py-3 rounded-2xl">
                      <p className="text-[15px] text-gray-800 font-black leading-relaxed">
                        {isKr ? expr.kr : expr.jp}
                      </p>
                    </div>

                    {expr.words && (
                      <div className="flex flex-col gap-1 px-1 mt-0.5 border-l-2 border-pink-100/50 pl-3 py-0.5">
                        {expr.words.map((item, wIdx) => (
                          <div key={wIdx} className="flex items-center gap-2">
                            <span className="text-[11px] text-pink-500 font-bold whitespace-nowrap">• {item.word}</span>
                            <span className="text-[11px] text-gray-400 font-medium">{item.mean}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {expr.tip && (
                      <p className="px-1 text-[11px] text-gray-400 font-medium leading-normal flex gap-1 items-start mt-1">
                        <span className="shrink-0 opacity-60">💡</span> 
                        <span>{expr.tip}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <button 
            className="btn btn-primary mt-6 py-5 rounded-[2rem] text-lg shadow-lg hover:shadow-pink-200 transition-all active:scale-95" 
            onClick={() => {
              if (!dailyProgress.cardsLearned.includes(currentSituation.id)) {
                markCardLearned(currentSituation.id);
              }
              alert('축하합니다! 오늘의 학습을 완료했어요 ✨');
            }}
          >
             학습 완료하기 ✨
          </button>
        </div>
      </div>
    </div>
  );
}
