const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

export const generateChatResponse = async (history, userProfile, situation, recentKeywords = []) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return '환경 변수(GEMINI_API_KEY)가 설정되지 않았습니다. Vercel 설정에서 API Key를 등록해주세요.';
    }

    const myLang = userProfile.myNationality === 'KR' ? '한국인' : '일본인';
    const targetLang = userProfile.myNationality === 'KR' ? '일본인' : '한국어';
    const targetLangCode = userProfile.myNationality === 'KR' ? '일본어' : '한국어';
    const targetGenderStr = userProfile.targetGender === 'M' ? '남자' : '여자';

    // 중복 방지 힌트 (비용 효율적)
    const avoidHint =
        recentKeywords.length > 0
            ? `\n\n[제약 사항] 다음 단어나 표현은 방금 사용했으므로 가급적 피해서 신선하게 답변하세요: ${recentKeywords.join(', ')}`
            : '';

    const systemInstruction = `당신은 ${targetLang} ${targetGenderStr}입니다. 상대방은 ${myLang}이며 당신과 썸을 타거나 데이트를 목적으로 대화 중입니다.
상황: ${userProfile.myNationality === 'KR' ? situation.title.kr : situation.title.jp} (${userProfile.myNationality === 'KR' ? situation.desc.kr : situation.desc.jp})

규칙:
1. 답변은 반드시 ${targetLangCode}로만 짧고 자연스럽게 작성하세요 (1-2문장).
2. 성격은 다정하고 친근하며, 상황에 맞는 센스 넘치는 "위트"와 "귀여운 농담"을 즐기는 스타일입니다. (살짝 킹받게(?) 혹은 설레게 장난쳐도 좋아요!)
3. 상대방(유저)의 ${targetLangCode} 문법이나 표현이 어색하다면, 답변 가장 마지막 줄에 "💡 Tip: [올바른 표현]" 형식으로 부드럽게 한글로(혹은 유저의 모국어로) 피드백해주세요.
4. 절대 AI 봇처럼 말하지 말고 진짜 사람처럼 말하세요.${avoidHint}`;

    const formattedHistory = history.map((h) => ({
        role: h.role,
        parts: [{ text: h.content }],
    }));

    const payload = {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: formattedHistory,
        generationConfig: {
            temperature: 0.8, // 다양성 증가
            topP: 0.95,
            maxOutputTokens: 200, // 토큰 비용 최적화
        },
    };

    // Try models one by one
    for (const model of MODELS) {
        try {
            console.log(`[Gemini] Attempting with model: ${model}`);
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();
            if (data.error) {
                console.warn(`[Gemini] Model ${model} failed:`, data.error.message);
                continue;
            }

            if (data.candidates && data.candidates[0].content.parts[0].text) {
                return data.candidates[0].content.parts[0].text;
            }
        } catch (error) {
            console.error(`[Gemini] Error with model ${model}:`, error);
            continue;
        }
    }

    return '죄송합니다. 모든 AI 모델 호출에 실패했습니다.';
};
