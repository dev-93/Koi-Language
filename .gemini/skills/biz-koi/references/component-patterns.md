# Component Patterns - Koi-Language

이 문서는 프로젝트에서 반복적으로 사용되는 UI 컴포넌트의 표준 코드를 제공합니다.

## Buttons (공통 Pill 버튼)

프로젝트 전체에서 사용하는 공통 버튼 스타일입니다. 모든 버튼은 pill 형태(`border-radius: 999px`)를 기본으로 합니다.

### Primary Button (채워진 버튼)

```jsx
<button className="btn btn-primary">NEXT →</button>
```

- `--primary-peach` 배경 + 흰색 텍스트
- `border-radius: 999px` (pill)
- `box-shadow: 0 4px 12px rgba(212, 83, 126, 0.3)`

### Outline Button (테두리 버튼)

```jsx
<button className="btn btn-outline">← PREV</button>
```

- 투명 배경 + `--primary-peach` 보더 (1.5px solid) + 핑크 텍스트
- `border-radius: 999px` (pill)
- disabled 시: `opacity: 0.4`, `pointer-events: none`

### Secondary Button

```jsx
<button className="btn btn-secondary">
    <span>뒤로가기</span>
</button>
```

## Navigation Buttons (PREV / NEXT)

학습 카드 간 이동에 사용되는 네비게이션 버튼 세트입니다. 프로그레스 카운터와 함께 사용합니다.

### 전체 구조

```jsx
<div className="nav-footer">
    <p className="nav-progress">PROGRESS</p>
    <p className="nav-progress-count">
        {current}/{total}
    </p>
    <div className="nav-progress-bar">
        <div className="nav-progress-bar-fill" style={{ width: `${(current / total) * 100}%` }} />
    </div>
    <div className="nav-buttons">
        <button className="btn btn-outline" onClick={onPrev} disabled={current <= 1}>
            ← PREV
        </button>
        <button className="btn btn-primary" onClick={onNext} disabled={current >= total}>
            NEXT →
        </button>
    </div>
</div>
```

### 스타일 규칙

- **PREV (btn-outline)**: 투명 배경 + `--primary-peach` 보더 (1.5px solid) + 핑크 텍스트. 라운드 pill 형태 (`border-radius: 999px`).
- **NEXT (btn-primary)**: `--primary-peach` 배경 + 흰색 텍스트. 라운드 pill 형태.
- **레이아웃**: 두 버튼은 동일 너비로 `flex: 1`, `gap: 12px`으로 나란히 배치.
- **disabled 상태**: `opacity: 0.4`, `pointer-events: none`.
- **프로그레스 텍스트**: 중앙 정렬, `--text-gray` 색상, 작은 사이즈.

## Cards

기본 컨텐츠를 담는 카드 컨테이너입니다.

```jsx
<div className="card">
    <h2 className="title-cute mb-2">오늘의 표현</h2>
    <div className="card-content">{/* 컨텐츠 내용 */}</div>
</div>
```

## Chat Bubbles

상황 대화 시 사용되는 말풍선입니다.

### AI (Left)

```jsx
<div className="chat-bubble ai">
    <span>안녕하세요! 무엇을 도와드릴까요?</span>
</div>
```

### User (Right)

```jsx
<div className="chat-bubble user">
    <span>한국어를 공부하고 싶어요.</span>
</div>
```

## Progress Bar

학습 진행도를 나타내는 바입니다.

```jsx
<div className="progress-bar-bg">
    <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
</div>
```

## Icons

아이콘은 항상 `lucide-react`를 사용하며, 크기는 기본 `20` 또는 `24`를 권장합니다.

## Favorite Button (즐겨찾기 하트 버튼)

학습 카드에서 마음에 드는 표현을 저장하는 버튼입니다.

```jsx
import useStore from '@/store';
import { Heart } from 'lucide-react';

const { toggleFavorite, isFavorite } = useStore();

<button
    onClick={() => toggleFavorite({ exprId, jp, kr, reading, tip, situationTitle, situationId })}
    className="fav-btn"
    aria-label="즐겨찾기"
>
    <Heart size={20} fill={isFavorite(exprId) ? '#d4537e' : 'none'} color="#d4537e" />
</button>;
```

- `.fav-btn`: 40x40 원형, `--primary-peach-soft` 배경, `--primary-peach-light` 보더
- 활성 시 하트가 `#d4537e`로 채워짐
- `:active` 시 `scale(0.85)` 축소 애니메이션

## Favorite Badge (즐겨찾기 카운트 배지)

하단 네비게이션의 즐겨찾기 아이콘 위에 표시되는 카운트 배지입니다.

```jsx
{
    favorites.length > 0 && <span className="fav-badge">{favorites.length}</span>;
}
```

- `.fav-badge`: 절대 위치, 16px 원형, `--primary-peach` 배경, 흰색 텍스트, 10px 폰트
