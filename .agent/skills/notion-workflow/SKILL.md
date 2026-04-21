---
name: notion-workflow
description: Koi-Language 프로젝트의 2개 Notion DB(Situations, Expressions) 연동 및 자동화 워크플로우를 관리합니다.
---

# 📊 Notion Workflow & Data Architecture

이 지침은 `Koi-Language` 프로젝트의 핵심 자산인 Notion 데이터베이스의 구조와, 제미나이를 통한 자동 동기화 프로세스를 관리하기 위한 것입니다.

## 🏗️ 1. 데이터베이스 구조 (Two-DB System)

이 프로젝트는 연동된 2개의 데이터베이스를 통해 학습 콘텐츠를 관리합니다.

### 📁 A. Situations DB (상황 정보)
*   **역할**: 하루 1개씩 생성되는 학습의 테마(상황) 단위 데이터.
*   **주요 컬럼**: 
    *   `Title_KR` / `Title_JP`: 상황 제목 (한국어/일본어)
    *   `Desc_KR` / `Desc_JP`: 상황에 대한 상세 설명
    *   `Date`: 생성 날짜 (YYYY-MM-DD, 중복 방지 Key 역할을 겸함)
    *   `URL`: Vercel Blob에 업로드된 상황별 썸네일 이미지 주소
*   **특징**: `Expressions DB`와 **1:N Relation**으로 연결되어 있습니다.

### 📝 B. Expressions DB (표현 및 단어)
*   **역할**: 각 상황에 포함된 구체적인 문장과 실전 학습 데이터 관리. (상황당 3~6개)
*   **주요 컬럼**:
    *   `Title_KR`: 한국어 표현 / `Text_JP`: 일본어 표현
    *   `Reading`: **JSON 형태**의 발음 데이터 (`{"kr": "...", "jp": "..."}`)
    *   `Tip`: **JSON 형태**의 상세 학습 팁 및 뉘앙스 설명
    *   `Words`: **JSON 배열** 형태의 핵심 단어 목록 (최대 3개)
    *   `Situation`: `Situations DB`와 연결된 **Relation 필드**

---

## 🤖 2. 자동화 파이프라인 (The Cron Loop)

매일 새벽 00:05(KST)에 자동으로 수행되는 데이터 공급 사이클입니다.

1.  **Gemini 생성**: `gemini-2.5-flash` 모델이 `Date` 기반으로 중복되지 않는 상황과 표현(3~6개)을 생성합니다.
2.  **이미지 생성**: 상황 묘사 프롬프트를 바탕으로 `gemini-3.1-flash`가 일러스트 스타일의 썸네일을 생성합니다.
3.  **Blob 업로드**: 생성된 이미지를 Vercel Blob 저장소에 업로드하고 영구 URL을 획득합니다.
4.  **Notion Push**: 위 데이터를 취합하여 노션 API를 통해 두 DB에 각각 저장하며, Relation을 자동으로 연결합니다.

---

## 🚀 3. 핵심 명령어 (Scripts)

| 작업 | 명령어 | 관련된 실질적 파일 |
| :--- | :--- | :--- |
| **자동화 즉시 실행** | `npm run cron:run` | `run-cron-now.js` → `gemini-content.js` |
| **데이터 검증** | `npm run check:notion` | `tests/notion-validation.test.js` |
| **데이터 동기화/백업** | `npm run get:notion` | `fetchFromNotion.js` |

---

## 💡 유지보수 가이드 (회장님 전용)

1.  **JSON 포맷 유지**: `Reading`, `Tip`, `Words` 컬럼은 단순 텍스트가 아닌 JSON 포맷입니다. 수동 수정 시 따옴표와 구조를 깨뜨리지 않도록 주의하십시오.
2.  **수동 강제 생성**: 특정 날짜의 데이터를 다시 만들고 싶다면 노션에서 해당 `Date` 행을 삭제한 뒤 `npm run cron:run`을 실행하면 됩니다.
3.  **환경 변수**: 동기화 문제가 발생하면 `.env`의 `NOTION_TOKEN` 및 DB ID가 최신인지 가장 먼저 확인하십시오.
