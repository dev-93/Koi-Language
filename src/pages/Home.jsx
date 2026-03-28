import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import { situations } from '../data/situations';
import { BookOpen, MessageCircleHeart } from 'lucide-react';

export default function Home() {
  const { userProfile, dailyProgress } = useStore();
  const navigate = useNavigate();

  const isKr = userProfile.myNationality === 'KR';
  const myIcon = isKr ? '🇰🇷' : '🇯🇵';
  const targetIcon = isKr ? '🇯🇵' : '🇰🇷';
  const targetGenderAvatar = userProfile.targetGender === 'M' ? '👨' : '👩';

  const completedCount = dailyProgress.cardsLearned.length;
  const targetCards = 10;
  const progressRatio = Math.min((completedCount / targetCards) * 100, 100);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="title-cute m-0 text-3xl">Koi Language</h1>
        <div className="text-xl">{myIcon} ✨ {targetIcon}{targetGenderAvatar}</div>
      </div>

      <div className="card text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-pink-100" />
        <h2 className="mb-2">오늘의 데이트 학습</h2>
        <p className="text-sm text-gray-500 mb-4">하루 10개의 상황을 마스터해보세요!</p>
        
        <div className="flex justify-between mb-1 mt-4 text-sm font-bold">
          <span>진행도</span>
          <span>{completedCount} / {targetCards}</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressRatio}%` }} />
        </div>
      </div>

      <h3 className="mb-4 mt-6 flex items-center gap-2">
        <BookOpen size={20} className="text-pink-400" /> 상황 리스트
      </h3>
      
      <div className="flex flex-col gap-4">
        {situations.map(sit => {
          const isLearned = dailyProgress.cardsLearned.includes(sit.id);
          return (
            <div key={sit.id} className="card flex flex-col gap-3 relative cursor-pointer hover:shadow-lg transition-transform" onClick={() => navigate(`/learn/${sit.id}`)}>
              {isLearned && <div className="absolute top-4 right-4 text-green-500 font-bold text-sm">✓ 완료</div>}
              <div>
                <span className="text-xs font-bold text-pink-400 bg-pink-50 px-2 py-1 rounded-full mb-2 inline-block">
                  {sit.difficulty}
                </span>
                <h4 className="text-lg m-0">{isKr ? sit.title.kr : sit.title.jp}</h4>
                <p className="text-sm text-gray-500 mt-1">{isKr ? sit.desc.kr : sit.desc.jp}</p>
              </div>
              <div className="flex gap-2 mt-2">
                <button className="btn btn-outline flex-1 py-2 text-sm" onClick={(e) => { e.stopPropagation(); navigate(`/learn/${sit.id}`); }}>
                  <BookOpen size={16} /> 학습하기
                </button>
                <button className="btn btn-primary flex-1 py-2 text-sm" onClick={(e) => { e.stopPropagation(); navigate(`/practice/${sit.id}`); }}>
                  <MessageCircleHeart size={16} /> 연습하기
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
