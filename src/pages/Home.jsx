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
  const targetCards = 10;
  const progressRatio = Math.min((completedCount / targetCards) * 100, 100);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="title-cute m-0 text-3xl">Koi Language</h1>
        <div className="text-xl">{myIcon} ✨ {targetIcon}{targetGenderAvatar}</div>
      </div>

      <div className="card text-center relative overflow-hidden bg-primary-peach-light/20">
        <h2 className="mb-2 text-xl font-bold">오늘의 한마디 ✨</h2>
        <p className="text-sm text-gray-600 mb-4">부담 없이, 하루에 한 상황만 완벽하게!</p>
        
        <div className="flex justify-between mb-1 mt-4 text-xs font-bold text-gray-500">
          <span>마스터한 상황</span>
          <span>{completedCount} / {targetCards}</span>
        </div>
        <div className="progress-bar-bg h-2">
          <div className="progress-bar-fill" style={{ width: `${progressRatio}%` }} />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-col gap-1 mb-6">
          <h3 className="text-2xl font-bold m-0">오늘의 상황:</h3>
          <p className="text-pink-500 font-bold text-lg">{isKr ? currentSituation.title.kr : currentSituation.title.jp}</p>
          <p className="text-sm text-gray-500">{isKr ? currentSituation.desc.kr : currentSituation.desc.jp}</p>
        </div>
        
        <div className="flex flex-col gap-3">
          {(isKr ? currentSituation.expressions.kr_wants_jp : currentSituation.expressions.jp_wants_kr).map((expr, idx) => (
            <div key={idx} className="card p-5 border-none shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-gray-400"># 표현 {idx + 1}</span>
                  <span className="text-[10px] bg-pink-100 text-pink-500 px-2 py-0.5 rounded-full">상대방 언어</span>
                </div>
                <h4 className="text-xl font-bold m-0">{isKr ? expr.jp : expr.kr}</h4>
                <div className="flex flex-col gap-1 mt-1">
                   <p className="text-sm text-blue-500 font-bold">{isKr ? expr.reading : expr.jp}</p>
                   <p className="text-xs text-gray-400 italic">{expr.romaji}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-400 mr-2">뜻:</span>{isKr ? expr.kr : expr.jp}</p>
                  {expr.tip && <p className="text-[11px] text-gray-400 mt-2">💡 {expr.tip}</p>}
                </div>
              </div>
            </div>
          ))}
          
          <button 
            className="btn btn-primary mt-4 py-4" 
            onClick={() => {
              if (!dailyProgress.cardsLearned.includes(currentSituation.id)) {
                markCardLearned(currentSituation.id);
              }
              alert('오늘의 학습이 완료되었습니다! 내일 또 만나요 ✨');
            }}
          >
             학습 완료하기 ✨
          </button>
        </div>
      </div>
    </div>
  );
}
