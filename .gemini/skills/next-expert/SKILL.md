---
name: next-expert
description: Next.js 16, React 19, Framer Motion, Zustand 환경의 Koi-Language 프로젝트 개발을 위한 전문 가이드입니다. 컴포넌트 생성, 성능 최적화, 상태 관리 및 애니메이션 구현 시 사용하십시오.
---

# 🚀 Next.js & React Expert Guide

이 스킬은 `Koi-Language` 프로젝트의 최신 스택(Next 16, React 19)을 효과적으로 활용하기 위한 지침입니다.

## 🏗️ 아키텍처 및 스택 가이드

- **Framework:** Next.js 16 (App Router 기반)
- **State Management:** Zustand (`src/store.js`)
- **Animation:** Framer Motion
- **UI:** React 19 (Server/Client Components 구분 필수)
- **Port:** 로컬 개발 시 `4000` 포트 사용 (`npm run dev`)

## 💡 개발 원칙

1. **Server Components 우선:** `src/app` 내의 페이지와 레이아웃은 기본적으로 서버 컴포넌트로 작성하십시오. 클라이언트 사이드 로직(이벤트 핸들러, Hook 등)이 필요한 경우에만 `'use client'`를 사용하십시오.
2. **상태 관리 (`useStore`):** 글로벌 상태는 `src/store.js`의 `useStore`를 통해 관리합니다. `userProfile`, `dailyProgress` 등의 상태를 조회하거나 업데이트할 때 활용하십시오.
3. **애니메이션 (Framer Motion):** `HomeView`, `LearnView`, `OnboardingView` 간의 전환 및 사용자 인터랙션에 Framer Motion의 `motion` 컴포넌트와 `AnimatePresence`를 활용하여 매끄러운 UX를 구현하십시오.
4. **성능 최적화:** React 19의 새로운 기능을 활용하고, 불필요한 리렌더링을 방지하기 위해 `useMemo`, `useCallback`을 적절히 사용하십시오. (특히 대규모 리스트나 복잡한 애니메이션이 포함된 뷰)

## 📂 주요 디렉토리 구조

- `src/app`: 라우팅 및 페이지 레이아웃 (Next.js App Router)
- `src/components`: 재사용 가능한 UI 뷰 컴포넌트 (`HomeView`, `LearnView` 등)
- `src/store.js`: Zustand를 이용한 전역 상태 정의 및 로컬 스토리지 퍼시스트
- `public/situations`: 학습 데이터(JSON 등) 및 에셋 관리

## 🛠️ 작업 도우미

- **컴포넌트 생성 시:** 최신 ES6+ 문법과 화살표 함수(`const MyComponent = () => ...`)를 사용하십시오.
- **포트 주의:** `next dev` 실행 시 기본 3000번이 아닌 **4000번** 포트를 사용하도록 설정되어 있음을 유의하십시오.
