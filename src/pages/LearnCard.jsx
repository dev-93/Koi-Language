import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store';
import { situations } from '../data/situations';
import { ChevronLeft, RotateCcw } from 'lucide-react';

export default function LearnCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, markCardLearned } = useStore();
  const [flipped, setFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const sitId = parseInt(id, 10);
  const situation = situations.find(s => s.id === sitId);

  if (!situation) return <div>상황을 찾을 수 없습니다.</div>;

  const isKr = userProfile.myNationality === 'KR';
  const myPerspective = isKr ? 'kr_wants_jp' : 'jp_wants_kr';
  const expressions = situation.expressions[myPerspective];
  
  if (!expressions || expressions.length === 0) return <div>표현 데이터가 없습니다.</div>;

  const currentExpr = expressions[currentIndex];

  const handleNext = () => {
    setFlipped(false);
    if (currentIndex < expressions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      markCardLearned(sitId);
      navigate('/home');
    }
  };

  return (
    <div className="p-6 flex flex-col h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/home')} className="p-2 border-none bg-transparent">
          <ChevronLeft size={24} />
        </button>
        <h2 className="m-0 flex-1 text-center pr-8">{isKr ? situation.title.kr : situation.title.jp}</h2>
      </div>
      
      <div className="text-center mb-4 text-sm font-bold text-gray-400">
        {currentIndex + 1} / {expressions.length}
      </div>

      <div className="flex-1 perspective-1000 relative w-full preser">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex + (flipped ? '-back' : '-front')}
            initial={{ opacity: 0, rotateY: flipped ? -90 : 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: flipped ? 90 : -90 }}
            transition={{ duration: 0.3 }}
            className={`card absolute inset-0 flex flex-col items-center justify-center p-8 text-center cursor-pointer min-h-[400px] border-4 ${flipped ? 'border-primary-lavender' : 'border-primary-peach-light'}`}
            onClick={() => setFlipped(!flipped)}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {!flipped ? (
               <div className="flex flex-col items-center gap-6">
                 <p className="text-sm font-bold text-gray-400">상대방 언어</p>
                 <h2 className="text-3xl font-bold">{isKr ? currentExpr.jp : currentExpr.kr}</h2>
                 <p className="text-gray-500 mt-2">{currentExpr.romaji}</p>
                 <div className="mt-8 flex items-center gap-2 text-pink-400 font-bold">
                   <RotateCcw size={16} /> <span>탭해서 번역 보기</span>
                 </div>
               </div>
            ) : (
               <div className="flex flex-col items-center gap-6">
                 <p className="text-sm font-bold text-gray-400">모국어 뜻</p>
                 <h2 className="text-2xl">{isKr ? currentExpr.kr : currentExpr.jp}</h2>
                 {currentExpr.tip && (
                   <div className="bg-blue-50 p-4 rounded-xl mt-4 text-sm text-left">
                     💡 <b>Tip:</b> {currentExpr.tip}
                   </div>
                 )}
               </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-auto pt-6 flex gap-4">
        {flipped && (
          <button className="btn btn-primary" onClick={handleNext}>
            {currentIndex < expressions.length - 1 ? '다음 표현' : '완료 및 홈으로'}
          </button>
        )}
      </div>
    </div>
  );
}
