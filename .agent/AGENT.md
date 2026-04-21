# Koi Language — 프로젝트 가이드

## 프로젝트 개요

한일 커플을 위한 연애 일본어/한국어 학습 웹앱. 매일 크론으로 Gemini가 상황별 표현을 생성하고, Notion DB에 저장하며, Next.js 프론트에서 카드 형태로 학습한다.

## 기술 스택

- **프레임워크**: Next.js 16 (App Router, JavaScript)
- **배포**: Vercel (ISR + Cron)
- **데이터**: Notion API (DB 2개: Situations, Expressions)
- **AI**: Google Gemini API (텍스트 생성 + 이미지 생성)
- **이미지 저장**: Vercel Blob
- **상태 관리**: Zustand (persist 미들웨어, localStorage)
- **UI**: React 19, Swiper, Framer Motion, Lucide Icons
- **스타일**: `<style jsx>` + globals.css (CSS 변수)
- **알림**: Telegram Bot API

## 폴더 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/cron/           # 매일 KST 00:00 크론 (Gemini → Notion)
│   ├── api/situations/     # 클라이언트용 API (Notion 조회)
│   ├── learn/[id]/         # 학습 페이지 (ISR)
│   ├── onboarding/         # 온보딩
│   ├── page.js             # 홈 (ISR, 1시간)
│   └── globals.css         # 전역 CSS 변수, 리셋, 폰트
├── components/             # React 컴포넌트 (JSX)
├── data/                   # 로컬 데이터 (fetchFromNotion 결과)
├── hooks/                  # 커스텀 훅
├── lib/                    # 서버 유틸 (Notion, Gemini, Telegram, Date)
├── store.js                # Zustand 스토어
└── utils/                  # 클라이언트 유틸 (Gemini 채팅)
scripts/                    # Notion 동기화, 마이그레이션, 검증 스크립트
```

## 코딩 컨벤션

### 스타일

- 컴포넌트 스타일은 `<style jsx>`로 관리한다.
- Tailwind 유틸리티 클래스를 직접 사용하지 않는다.
- 인라인 `style={{ }}` 어트리뷰트를 사용하지 않는다.
- `globals.css`는 리셋, 폰트, CSS 변수 등 전역 설정만 담는다.
- className은 의미 있는 이름을 사용한다 (예: `nav-divider`, `card-title`).

### 코드

- JavaScript (TypeScript 아님). `.js` / `.jsx` 확장자.
- `@/*` 경로 별칭 사용 (`jsconfig.json` 설정).
- Prettier: 4칸 들여쓰기, 싱글 쿼트, trailing comma (es5).
- ESLint: react-hooks, prettier 플러그인 적용.
- 커밋 메시지는 한글로 작성. 형식: `feat:`, `fix:`, `refactor:`, `style:`, `chore:`.

### 데이터 패턴

- Notion rich_text에 다국어 데이터는 JSON 문자열로 저장: `{"kr":"...", "jp":"..."}`
- 이 패턴은 `Reading`, `Tip`, `Words` 컬럼에 공통 적용.
- 프론트에서 `parseValue(val, lang)` 함수로 JSON/평문 모두 대응.

## 절대 하면 안 되는 것

### API 키

- `GEMINI_IMAGE_API_KEY`를 텍스트 생성에 사용하지 않는다. 이미지 전용이다.
- 테스트/디버깅 시 이미지 API를 반복 호출하지 않는다.
- `.env` 파일을 커밋하지 않는다.

### Notion

- Notion DB 컬럼을 임의로 추가/삭제하지 않는다. 스키마는 `notion-schema.md` 참조.
- 크론 외에 Situations DB에 직접 데이터를 넣지 않는다 (중복 방지 로직이 크론에만 있음).
- Notion API rate limit: 초당 3회. 배치 스크립트에서 반드시 sleep을 넣는다.

### 프론트엔드

- `globals.css`에 컴포넌트 전용 스타일을 넣지 않는다.
- 모바일(480px) 기준 설계. PC 레이아웃은 고려하지 않는다.
- `position: fixed` 하단 영역은 최대한 얇게 유지한다.

### 배포

- `vercel.json`의 크론 스케줄(`0 15 * * *` = KST 00:00)을 변경하지 않는다.
- ISR revalidate 값을 0으로 설정하지 않는다 (Notion rate limit 초과 위험).
