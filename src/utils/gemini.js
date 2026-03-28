export const generateChatResponse = async (history, userProfile, situation) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return '환경 변수(VITE_GEMINI_API_KEY)가 설정되지 않았습니다. Vercel 설정에서 API Key를 등록해주세요.';
  }

  const myLang = userProfile.myNationality === 'KR' ? '한국인' : '일본인';
  const targetLang = userProfile.myNationality === 'KR' ? '일본인' : '한국인';
  const targetLangCode = userProfile.myNationality === 'KR' ? '일본어' : '한국어';
  const targetGenderStr = userProfile.targetGender === 'M' ? '남자' : '여자';

  const systemInstruction = `당신은 ${targetLang} ${targetGenderStr}입니다. 상대방은 ${myLang}이며 당신과 썸을 타거나 데이트를 목적으로 대화 중입니다.
상황: ${userProfile.myNationality === 'KR' ? situation.title.kr : situation.title.jp} (${userProfile.myNationality === 'KR' ? situation.desc.kr : situation.desc.jp})

규칙:
1. 답변은 반드시 ${targetLangCode}로만 짧고 자연스럽게 작성하세요 (1-2문장).
2. 성격은 다정하고 친근한 스타일입니다.
3. 상대방(유저)의 ${targetLangCode} 문법이나 표현이 어색하다면, 답변 가장 마지막 줄에 "💡 Tip: [올바른 표현]" 형식으로 부드럽게 한글로(혹은 유저의 모국어로) 피드백해주세요.
4. 절대 AI 봇처럼 말하지 말고 진짜 사람처럼 말하세요.`;

  try {
    const formattedHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }));

    // Insert system instruction at the beginning
    const payload = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: formattedHistory
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini error:', error);
    return '죄송합니다. 오류가 발생했습니다. (API Key 확인 필요)';
  }
};
