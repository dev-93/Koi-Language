# 🎏 Koi-Language: AI 기반 일본어 상황별 학습 시스템

이 서비스는 사용자가 특정 상황(비즈니스, 데이트, 여행 등)을 선택하면 AI가 관련 단어와 예문을 생성하고 학습을 돕는 **수익형 언어 학습 플랫폼**입니다.

## 🎯 비즈니스 목표
- **수익화**: 프리미엄 상황 팩 판매 및 AI 맞춤형 피드백 구독 모델.
- **핵심 가치**: 단순 암기가 아닌 '상황(Situations)' 중심의 몰입형 학습 경험 제공.

## 🛠️ 기술 스택
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Next.js API Routes (Vercel)
- **AI**: Google Gemini 2.5+ (상황 생성 및 번역)
- **Data**: Notion API (학습 데이터 및 백로그 관리)

## 📋 에이전트 가이드라인
- **Planner**: 신규 '상황(Situation)' 카테고리 기획 및 학습 로직 고도화 우선순위 설정.
- **Engineer**: `main` 브랜치에서 분기한 `feature/raw-번호` 브랜치 사용 필수.
- **QA**: Playwright를 이용한 상황 생성 및 학습 흐름 전수 검증.
