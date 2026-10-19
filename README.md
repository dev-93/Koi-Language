# Koi Language

연애 상황별 일본어(한국어) 표현을 AI로 생성해 카드로 보여주는 학습 앱입니다.
일본어 공부용으로 만든 개인 프로젝트이며, 안정적인 서비스는 아닙니다.

**[데모](https://koi-language.vercel.app)**

## 무엇을 하나

- 소개팅, 썸, 이자카야, 여행 같은 **상황**을 고르면 그 상황에서 쓰는 표현 카드를 넘겨 볼 수 있습니다.
- 카드마다 한국어·일본어 문장, 읽는 법, 팁을 보여주고 브라우저 음성(Web Speech API)으로 발음을 들려줍니다.
- 표현 저장(즐겨찾기), 학습 완료 표시, 지난 상황 검색을 지원합니다.
- 사용자가 한국인인지 일본인인지에 따라 표시 언어를 바꿉니다.

## 어떻게 만들었나

```
/api/cron 호출 → Gemini로 상황·표현 생성 → Notion DB에 저장
                                        → 화면 재생성(ISR) · 텔레그램 알림
```

- 상황과 표현 데이터는 Notion 데이터베이스에 저장하고, 화면은 이를 읽어 1시간 단위로 재생성합니다.
- `/api/cron`을 호출하면 그날의 상황을 생성합니다. 이미 오늘 데이터가 있으면 건너뜁니다. 호출 주기는 저장소 밖에서 설정합니다.
- 월초(1~3일)와 월중(15~17일)에는 같은 주제로 이어지는 시리즈로 생성합니다.

## 기술 스택

Next.js 16 (App Router) · React 19 · Zustand · Framer Motion · Swiper · Google Gemini · Notion API · Vercel

## 실행

```bash
npm install
npm run dev   # http://localhost:4000
```

`.env`에 아래 값이 필요합니다.

| 변수 | 용도 |
| --- | --- |
| `GEMINI_API_KEY` | 표현 생성 |
| `NOTION_TOKEN`, `NOTION_SITUATION_DB_ID`, `NOTION_EXPRESSION_DB_ID` | 데이터 저장·조회 |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | 생성 결과 알림 (선택) |
| `CRON_SECRET` | `/api/cron` 호출 인증 (선택) |

## 상태

2026년 4월 이후 업데이트하지 않았습니다.
