# UI System Guide - Koi-Language

## Colors
- **Primary (Main)**: `--primary-peach` (`#d4537e`) - 메인 브랜드 색상 (버튼, 강조, 사용자 버블 등 전체 UI 기준색)
- **Primary Light**: `--primary-peach-light` (`#fce8ef`) - 배경색 (진행 바, 카드 배경 등)
- **Primary Soft**: `--primary-peach-soft` (`#fdf2f6`) - 매우 연한 배경
- **Primary Lavender**: `--primary-lavender` (`#dde2ff`) - 보조 강조색 (보조 버튼)
- **Text Dark**: `--text-dark` (`#2d2d2d`) - 기본 텍스트 색상
- **Text Gray**: `--text-gray` (`#757575`) - 부가 설명 텍스트
- **Background Gradient**: `linear-gradient(180deg, #ffffff 0%, #fff5f4 100%)`

> ⚠️ 색상은 반드시 CSS 변수(`var(--primary-peach)` 등)를 사용하고, 하드코딩 금지. rgba 그림자는 `rgba(212, 83, 126, ...)` 기준.

## Typography
- **Default**: `'Noto Sans KR'`, sans-serif
- **Point Title**: `'Nanum Pen Script'`, cursive
  - 클래스 `.title-cute`를 사용하여 귀엽고 친근한 제목 표현 (약 2.5rem)

## Layout (Mobile First)
- **Max Width**: 480px
- **Centered Root**: `#root` 컨테이너 내에서 `margin: 0 auto` 적용
- **Card Radius**: 28px (`--card-radius`)
- **Card Shadow**: `0 12px 30px rgba(255, 138, 138, 0.12)` (`--card-shadow`)

## Navigation Footer
- **nav-footer**: 하단 고정 네비게이션 영역. `text-align: center`, 하단 패딩 충분히.
- **nav-progress**: `color: var(--text-gray)`, `font-size: 0.75rem`, `letter-spacing: 2px`, 대문자.
- **nav-progress-count**: `font-size: 1.25rem`, `font-weight: 700`, `color: var(--text-dark)`.
- **nav-buttons**: `display: flex`, `gap: 12px`, 양쪽 버튼 동일 너비 (`flex: 1`).
- **btn-outline**: `background: transparent`, `border: 1.5px solid var(--primary-peach)`, `color: var(--primary-peach)`, `border-radius: 999px`.

## Utility Classes
- **Spacing**: `.mb-1`, `.mb-2`, `.mb-4`, `.mt-2`, `.mt-4` 등
- **Flexbox**: `.flex`, `.flex-col`, `.items-center`, `.justify-center`, `.gap-2`, `.gap-4` 등
- **Visibility**: `.u-invisible`, `.u-backdrop-blur`

## Favorite (즐겨찾기) Styles
- **fav-btn**: 40x40 원형 버튼, `--primary-peach-soft` 배경, `--primary-peach-light` 보더, `:active` 시 `scale(0.85)`
- **fav-badge**: 절대 위치 카운트 배지, 16px 높이, `--primary-peach` 배경, 흰색 10px 폰트
