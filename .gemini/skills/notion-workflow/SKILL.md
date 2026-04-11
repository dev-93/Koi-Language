---
name: notion-workflow
description: Koi-Language 프로젝트의 Notion 데이터 동기화 및 검증을 관리하는 스킬입니다. Notion에서 데이터를 가져오거나(Fetch), 시딩(Seed)하거나, 데이터 정합성을 체크할 때 사용합니다.
---

# 📊 Notion Workflow Guide

이 스킬은 `Koi-Language` 프로젝트의 `scripts/` 디렉토리에 있는 노션 관련 도구들을 효과적으로 사용하기 위한 지침입니다.

## 🚀 핵심 명령어 (Scripts)

| 작업                | 명령어                 | 설명                                                                                 |
| :------------------ | :--------------------- | :----------------------------------------------------------------------------------- |
| **데이터 가져오기** | `npm run get:notion`   | Notion DB에서 최신 데이터를 로컬로 가져옵니다. (`fetchFromNotion.js`)                |
| **데이터 업로드**   | `npm run post:notion`  | 로컬 데이터를 Notion DB로 업로드(시딩)합니다. (`seed-notion.js`)                     |
| **데이터 검증**     | `npm run check:notion` | Notion 데이터의 정합성과 타이틀 등을 검증합니다. (`tests/notion-validation.test.js`) |
| **크론 실행**       | `npm run cron:run`     | 주기적인 동기화 작업을 즉시 실행합니다. (`run-cron-now.js`)                          |

## 🛠️ 보조 스크립트 활용 (`scripts/`)

특수한 상황에서 다음 스크립트들을 활용하십시오:

- **데이터 정리:** `cleanupNotion.js`, `cleanup-duplicates.js` (중복 데이터 제거 및 정리)
- **데이터 수정:** `fix-reading.js`, `fix-defects.js` (특정 필드 오류나 데이터 결함 수정)
- **리포트:** `report-business.js` (비즈니스 로직 관련 데이터 리포트 생성)
- **마이그레이션:** `migrateToNotion.js` (데이터 구조 변경 시 노션으로 마이그레이션)

## 💡 작업 원칙

1. **검증 우선:** Notion에 데이터를 업로드하거나 변경하기 전, 항상 `check-title.js`나 `notion-validation.test.js`를 통해 데이터 형식을 확인하십시오.
2. **백업 고려:** 대규모 데이터 수정(`fix-*` 스크립트) 시에는 실행 전후의 데이터 상태를 로그로 남기거나 확인하십시오.
3. **토큰 효율:** MCP를 직접 설치하지 않고 프로젝트 내의 완성된 JS 스크립트를 호출하여 작업을 수행하십시오.
