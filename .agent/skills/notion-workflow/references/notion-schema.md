# Notion 데이터베이스 스키마

이 프로젝트는 Notion에 2개의 데이터베이스를 사용한다.

## 1. Situations DB (`NOTION_SITUATIONS_DB_ID`)

하루 1개씩 생성되는 "상황(시츄에이션)" 단위 데이터.

| 컬럼       | 타입      | 설명                                               |
| ---------- | --------- | -------------------------------------------------- |
| `Title_KR` | title     | 상황 제목 (한국어). 예: "카페에서 첫 만남"         |
| `Title_JP` | rich_text | 상황 제목 (일본어). 예: "カフェでの初めての出会い" |
| `Desc_KR`  | rich_text | 상황 설명 (한국어)                                 |
| `Desc_JP`  | rich_text | 상황 설명 (일본어)                                 |
| `Date`     | date      | 생성 날짜 (YYYY-MM-DD). 크론 기준 KST              |
| `URL`      | rich_text | 상황 썸네일 이미지 URL (Vercel Blob)               |

- 크론(`/api/cron`)이 매일 1회 Gemini로 생성 → 이 DB에 저장한다.
- `Date`가 중복되면 크론이 skip한다 (하루 1개 보장).
- `URL`은 Gemini 이미지 생성 성공 시에만 채워진다.

## 2. Expressions DB (`NOTION_EXPRESSIONS_DB_ID`)

각 상황에 속하는 개별 표현(문장) 데이터. 상황 1개당 3~6개.

| 컬럼        | 타입      | 설명                                                                                                             |
| ----------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| `Title_KR`  | title     | 한국어 표현. 예: "책 제목이 재미있어 보이네요."                                                                  |
| `Text_JP`   | rich_text | 일본어 표현. 예: "本のタイトルが面白そうですね。"                                                                |
| `Reading`   | rich_text | 발음 (JSON 문자열). `{"kr":"혼노 타이토루가 오모시로소우데스네.","jp":"チェク ジェモギ ジェミイッソ ボイネヨ."}` |
| `Tip`       | rich_text | 학습 팁 (JSON 문자열). `{"kr":"...", "jp":"..."}` 형태                                                           |
| `Words`     | rich_text | 핵심 단어 목록 (JSON 문자열). `[{"kr":"책","jp":"本(ほん)","reading_kr":"혼","reading_jp":"チェク"}]`            |
| `Situation` | relation  | Situations DB와의 관계 (어떤 상황에 속하는지)                                                                    |
| `Date`      | date      | 생성 날짜 (상황과 동일)                                                                                          |

- `Situation` relation으로 Situations DB의 페이지와 연결된다.
- `Reading`은 Tip과 동일한 JSON 패턴. `kr`은 일본어→한글 발음, `jp`는 한국어→카타카나 발음.
- `Words`는 표현당 최대 3개의 핵심 단어를 JSON 배열로 저장한다.
- `Tip`은 한국어/일본어 양쪽 팁을 JSON 객체로 저장한다.

## 데이터 흐름

```
크론 (매일 KST 00:00)
  → Gemini 텍스트 생성 (상황 1개 + 표현 3~6개)
  → Gemini 이미지 생성 → Vercel Blob 업로드
  → Situations DB에 상황 저장
  → Expressions DB에 표현들 저장 (Situation relation 연결)

API (/api/situations)
  → Situations DB + Expressions DB 조회
  → relation 기반으로 조인하여 클라이언트에 전달
```

## 데이터 검증 시 확인 사항

- 모든 Expression에 `Situation` relation이 연결되어 있는지
- `Date`가 비어있는 레코드가 없는지
- `Title_KR`, `Text_JP`가 비어있는 표현이 없는지
- `Reading` JSON이 유효한 객체인지 (`kr`, `jp` 키 존재 여부)
- `Reading.kr`이 한글로만 구성되어 있는지 (로마자/일본어 혼입 여부)
- `Reading.jp`가 카타카나로만 구성되어 있는지
- `Words` JSON이 유효한 배열인지
- `Tip` JSON이 유효한 객체인지 (`kr`, `jp` 키 존재 여부)
- 하루에 Situation이 2개 이상 중복 생성되지 않았는지
- Situation에 연결된 Expression이 0개인 경우가 없는지
