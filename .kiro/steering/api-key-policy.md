# API 키 사용 정책

## Gemini API 키 구분

- `GEMINI_API_KEY` — 텍스트 콘텐츠 생성 전용 (gemini-2.5-flash)
- `GEMINI_API_KEY_FALLBACK` — 텍스트 생성 실패 시 fallback 전용
- `GEMINI_IMAGE_API_KEY` — 이미지 생성 전용 (gemini-3.1-flash-image-preview). 이 키는 절대 텍스트 생성에 사용하지 않는다.

## 비용 관리 규칙

- `GEMINI_IMAGE_API_KEY`는 cron에서 하루 1회 이미지 생성 시에만 호출한다.
- 테스트/디버깅 시 이미지 API를 반복 호출하지 않는다. 한 번에 확인한다.
- 이미지 생성 실패 시 재시도는 최대 1회로 제한한다.
- 불필요한 이미지 재생성을 방지하기 위해, 이미 URL이 있는 상황은 건너뛴다.
