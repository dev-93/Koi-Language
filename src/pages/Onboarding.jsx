import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ myNationality: 'KR', myGender: 'M', targetGender: 'F' });
  const setUserProfile = useStore(state => state.setUserProfile);
  const navigate = useNavigate();

  const handleComplete = () => {
    setUserProfile(profile);
    navigate('/home');
  };

  return (
    <div className="p-6 flex flex-col justify-center min-h-[100vh]">
      <h1 className="title-cute">Koi Language 💝</h1>
      
      {step === 1 && (
        <div className="card text-center">
          <h2 className="mb-4">너는 누구니? / あなたは誰？</h2>
          <div className="flex flex-col gap-4">
            <button className={`btn ${profile.myNationality === 'KR' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setProfile({...profile, myNationality: 'KR'})}>
              🇰🇷 한국인 (Korean)
            </button>
            <button className={`btn ${profile.myNationality === 'JP' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setProfile({...profile, myNationality: 'JP'})}>
              🇯🇵 일본인 (Japanese)
            </button>
          </div>
          <button className="btn btn-secondary mt-4" onClick={() => setStep(2)}>다음으로</button>
        </div>
      )}

      {step === 2 && (
        <div className="card text-center">
          <h2 className="mb-4">당신의 성별은? / 性別は？</h2>
          <div className="flex gap-4">
            <button className={`btn ${profile.myGender === 'M' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setProfile({...profile, myGender: 'M'})}>
              👨 남자
            </button>
            <button className={`btn ${profile.myGender === 'F' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setProfile({...profile, myGender: 'F'})}>
              👩 여자
            </button>
          </div>
          <div className="flex gap-4 mt-4">
             <button className="btn btn-outline" onClick={() => setStep(1)}>이전</button>
             <button className="btn btn-secondary" onClick={() => setStep(3)}>다음으로</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card text-center">
          <h2 className="mb-4">찾고 있는 상대방은? / お相手は？</h2>
          <div className="flex gap-4">
            <button className={`btn ${profile.targetGender === 'M' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setProfile({...profile, targetGender: 'M'})}>
              👨 남자
            </button>
            <button className={`btn ${profile.targetGender === 'F' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setProfile({...profile, targetGender: 'F'})}>
              👩 여자
            </button>
          </div>
          <div className="flex gap-4 mt-4">
             <button className="btn btn-outline" onClick={() => setStep(2)}>이전</button>
             <button className="btn btn-primary" onClick={handleComplete}>시작하기 ✨</button>
          </div>
        </div>
      )}
    </div>
  );
}
