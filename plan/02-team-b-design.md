# 🅱️ B팀 - 디자인/UI팀 상세 플랜

> **한 줄 역할**: 게임의 "얼굴" — 예쁜 화면, 카드 뒤집기 애니메이션, 반응형 레이아웃 담당
> **담당 파일**: `index.html`, `css/style.css`, `js/ui.js`
> **예상 작업 시간**: Day 1 (4시간) + Day 2 (2시간) = **총 6시간**

---

## 📖 비전공자용 안내

B팀은 게임이 "어떻게 보이는지"를 담당합니다. 사용자가 실제로 **눈으로 보고 손으로 만지는 모든 것**이 B팀의 작품이에요.

- 🎨 카드는 무슨 색인가?
- 🎨 클릭하면 어떻게 뒤집히는가? (부드럽게? 빠르게?)
- 🎨 점수판은 어디에 있는가?
- 🎨 휴대폰에서도 잘 보이는가?
- 🎨 승리 화면은 얼마나 축하스러운가?

A팀이 "엔진"이라면 B팀은 **자동차의 외관과 인테리어**를 담당합니다. 같은 엔진이라도 디자인이 예쁘면 사람들이 훨씬 더 좋아하죠!

---

## 🎯 핵심 책임

1. ✅ HTML 뼈대 구조 작성 (시작/게임/종료 3개 화면)
2. ✅ CSS 디자인 시스템 (색상/폰트/간격 정의)
3. ✅ 카드 3D 뒤집기 애니메이션
4. ✅ 게임 보드 그리드 레이아웃 (난이도별 크기 대응)
5. ✅ 매칭 성공/실패 시각 효과
6. ✅ 반응형 디자인 (PC + 태블릿 + 모바일)
7. ✅ 화면 전환 로직 (`js/ui.js`)
8. ✅ 버튼/헤더/아이콘 스타일링

---

## 📂 담당 파일

### `index.html` - 게임 HTML 뼈대
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>냥냥 메모리 🐱</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app">
    <!-- 시작 화면 -->
    <section id="start-screen" class="screen">
      <h1 class="game-title">🐱 냥냥 메모리</h1>
      <p class="subtitle">같은 그림을 찾아 짝을 맞춰보세요!</p>

      <div class="difficulty-select">
        <h3>난이도 선택</h3>
        <button class="difficulty-btn" data-difficulty="easy">🟢 쉬움 (4×3)</button>
        <button class="difficulty-btn" data-difficulty="medium">🟡 보통 (4×4)</button>
        <button class="difficulty-btn" data-difficulty="hard">🔴 어려움 (6×4)</button>
      </div>

      <button id="start-btn" class="primary-btn">게임 시작</button>
    </section>

    <!-- 게임 화면 -->
    <section id="game-screen" class="screen hidden">
      <header id="game-header">
        <div id="score">점수: <span>0</span></div>
        <div id="moves">움직임: <span>0</span></div>
        <div id="timer">시간: <span>00:00</span></div>
      </header>

      <div id="game-board"></div>

      <button id="restart-btn" class="secondary-btn">🔄 다시하기</button>
    </section>

    <!-- 종료 화면 -->
    <section id="end-screen" class="screen hidden">
      <h2 id="end-message">🎉 클리어!</h2>
      <div class="result-box">
        <div id="final-score">최종 점수: 0</div>
        <div id="best-score">최고 점수: 0</div>
      </div>
      <button id="play-again-btn" class="primary-btn">한번 더! 🔁</button>
    </section>
  </div>

  <!-- 스크립트 로드 순서 중요! -->
  <script src="js/difficulty.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/sound.js"></script>
  <script src="js/cards.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/game.js"></script>
</body>
</html>
```

### `css/style.css` - 디자인 시스템
```css
/* ========== 디자인 토큰 ========== */
:root {
  --color-bg: #FFF5E1;          /* 부드러운 크림색 배경 */
  --color-primary: #FF6B9D;     /* 핑크 (초등학생 친화적) */
  --color-secondary: #6BC5FF;   /* 밝은 하늘색 */
  --color-accent: #FFD93D;      /* 황금 */
  --color-text: #3D3D3D;
  --color-card-back: #FF6B9D;
  --color-card-front: #FFFFFF;
  --color-matched: #81E979;     /* 매칭 성공 초록 */

  --radius-lg: 16px;
  --radius-md: 8px;
  --shadow-card: 0 4px 12px rgba(0,0,0,0.15);
  --font-game: 'Comic Sans MS', 'Malgun Gothic', sans-serif;
}

/* ========== 기본 레이아웃 ========== */
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--font-game);
  background: linear-gradient(135deg, #FFE5F1 0%, #E5F3FF 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-text);
}

#app {
  max-width: 800px;
  width: 95%;
  padding: 20px;
}

.screen { text-align: center; }
.hidden { display: none !important; }

/* ========== 게임 보드 그리드 ========== */
#game-board {
  display: grid;
  gap: 12px;
  justify-content: center;
  padding: 20px;
  margin: 20px auto;
  max-width: 600px;
}

#game-board.grid-easy { grid-template-columns: repeat(4, 1fr); }
#game-board.grid-medium { grid-template-columns: repeat(4, 1fr); }
#game-board.grid-hard { grid-template-columns: repeat(6, 1fr); }

/* ========== 카드 3D 뒤집기 애니메이션 ========== */
.card {
  aspect-ratio: 1;
  perspective: 1000px;
  cursor: pointer;
  min-height: 70px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.card.flipped .card-inner,
.card.matched .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(24px, 6vw, 48px);
  box-shadow: var(--shadow-card);
}

.card-back {
  background: var(--color-card-back);
  color: white;
}

.card-front {
  background: var(--color-card-front);
  transform: rotateY(180deg);
  border: 3px solid var(--color-primary);
}

.card.matched .card-front {
  background: var(--color-matched);
  animation: matched-pulse 0.5s ease;
}

@keyframes matched-pulse {
  0%, 100% { transform: rotateY(180deg) scale(1); }
  50% { transform: rotateY(180deg) scale(1.1); }
}

/* ========== 헤더 (점수/움직임/시간) ========== */
#game-header {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-card);
  font-size: 18px;
  font-weight: bold;
}

/* ========== 버튼 ========== */
.primary-btn, .secondary-btn, .difficulty-btn {
  border: none;
  border-radius: var(--radius-lg);
  padding: 14px 28px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  font-family: var(--font-game);
  transition: transform 0.1s, box-shadow 0.2s;
  margin: 8px;
}

.primary-btn {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 4px 0 #D44B7D;
}

.primary-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 #D44B7D; }

/* ========== 반응형 ========== */
@media (max-width: 600px) {
  #game-header { font-size: 14px; padding: 10px; }
  #game-board { gap: 8px; padding: 10px; }
  .card-back, .card-front { font-size: clamp(20px, 8vw, 36px); }
}
```

### `js/ui.js` - DOM 조작 모듈
```javascript
const UI = (function() {
  function showScreen(name) {
    // 'start' | 'game' | 'end'
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(`${name}-screen`).classList.remove('hidden');
  }

  function updateScore(value) {
    document.querySelector('#score span').textContent = value;
  }

  function updateMoves(value) {
    document.querySelector('#moves span').textContent = value;
  }

  function updateTimer(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    document.querySelector('#timer span').textContent = `${mm}:${ss}`;
  }

  function setBoardClass(difficulty) {
    const board = document.getElementById('game-board');
    board.className = `grid-${difficulty}`;
  }

  function showEndScreen(score, bestScore) {
    document.getElementById('final-score').textContent = `최종 점수: ${score}`;
    document.getElementById('best-score').textContent = `최고 점수: ${bestScore}`;
    showScreen('end');
  }

  // 이벤트 리스너 초기화 (시작 버튼, 재시작 등)
  function bindEvents() {
    // 난이도 버튼 클릭
    // 시작 버튼 → Game.start()
    // 재시작 → Game.reset() + start()
    // 한번 더 → 시작 화면으로
  }

  // 커스텀 이벤트 구독
  function subscribeToGameEvents() {
    document.addEventListener('game:won', (e) => {
      const { score } = e.detail;
      const best = Storage.getBestScore(Game.getState().difficulty);
      showEndScreen(score, best);
    });
  }

  return { showScreen, updateScore, updateMoves, updateTimer,
           setBoardClass, showEndScreen, bindEvents, subscribeToGameEvents };
})();
```

---

## ⏱️ 단계별 작업 순서

### **Day 1 오전 (2시간) - 기초 구조**

#### [B1] HTML 뼈대 작성 (45분)
- `index.html` 생성
- 3개 화면 (start/game/end) 마크업
- 시맨틱 태그 사용
- 모든 공유 규약 ID 적용

**결과물**: 스타일 없는 상태이지만 구조는 완성

#### [B2] CSS 기본 세팅 + 디자인 토큰 (1시간 15분)
- `style.css` 생성
- 디자인 토큰 (CSS 변수) 정의
- 기본 레이아웃 + 배경
- 버튼 스타일
- 헤더 스타일

**결과물**: 시작 화면이 예쁘게 보임

---

### **Day 1 오후 (2시간) - 카드 비주얼**

#### [B3] 게임 보드 그리드 (30분)
- 난이도별 그리드 클래스 (`.grid-easy/medium/hard`)
- `#game-board`에 카드 배치
- 반응형 기본

**결과물**: 카드들이 격자로 잘 배치됨

#### [B4] 카드 3D 뒤집기 애니메이션 (1시간)
- `perspective`, `transform-style: preserve-3d` 적용
- `rotateY(180deg)` + `backface-visibility: hidden`
- `.flipped`, `.matched` 클래스에 따른 전환
- 매칭 성공 시 `matched-pulse` 애니메이션

**결과물**: 카드가 부드럽게 뒤집힘, 매칭 시 반짝임

#### [B5] `ui.js` 기본 구현 (30분)
- `showScreen()`, `updateScore/Moves/Timer()`
- 이벤트 리스너 바인딩

**결과물**: 화면 전환 및 HUD 업데이트 작동

---

### **Day 2 오전 (1.5시간) - 폴리시**

#### [B6] 매칭 성공/실패 시각 효과 (45분)
- 매칭 성공: 펄스 + 초록 배경
- 매칭 실패: 빨간 테두리 깜빡임 (shake 애니메이션)
- CSS 애니메이션 `@keyframes shake`

#### [B7] 반응형 + 모바일 최적화 (45분)
- 미디어 쿼리 세분화
- 태블릿/모바일에서 카드 크기 조정
- 터치 타겟 최소 44px 확보
- 폰트 크기 `clamp()` 사용

---

### **Day 2 오후 (0.5시간) - 통합**

#### [B8] 다른 팀과 통합 (30분)
- A팀 카드 생성 결과가 예쁘게 보이는지 확인
- C팀 컨페티가 깨지지 않는지 확인
- 마지막 색상/간격 미세 조정

---

## 🧪 B팀 자체 테스트 체크리스트

### 시각 테스트
- [ ] 시작 화면이 예쁘게 보임
- [ ] 카드가 난이도별로 올바른 그리드로 배치됨
- [ ] 카드 뒤집기 애니메이션이 부드러움 (0.6초)
- [ ] 매칭 성공 시 초록색 + 펄스 효과
- [ ] 매칭 실패 시 빨간 테두리 + shake
- [ ] 헤더 (점수/움직임/시간)가 잘 정렬됨
- [ ] 종료 화면에 최종 점수가 잘 표시됨

### 반응형 테스트
- [ ] 1920×1080 (PC) 정상
- [ ] 768×1024 (태블릿) 정상
- [ ] 375×667 (iPhone SE) 정상
- [ ] 가로/세로 모드 둘 다 정상

---

## 🔗 다른 팀과의 연결점

| 항목 | 상대팀 | 내용 |
|:---|:---:|:---|
| HTML 셀렉터 제공 | 🅰️ A팀 | 규약에 명시된 ID/클래스 그대로 사용 |
| 카드 DOM 클래스 | 🅰️ A팀 | `.flipped`, `.matched` 클래스 토글에 따라 애니메이션 |
| UI API 제공 | 🅰️ A팀 | `UI.updateScore()` 등을 A팀이 호출 |
| 난이도 버튼 클릭 | 🅲 C팀 | `Difficulty.getConfig()` 호출해서 설정 받기 |
| 컨페티 공간 | 🅲 C팀 | C팀이 DOM에 캔버스 추가할 때 방해 안 되도록 |

---

## 💡 B팀 기술 팁

### CSS 3D 카드 뒤집기 핵심
```css
/* 부모에 perspective */
.card { perspective: 1000px; }

/* 자식에 preserve-3d */
.card-inner { transform-style: preserve-3d; transition: transform 0.6s; }

/* 앞면/뒷면에 backface-visibility */
.card-front, .card-back { backface-visibility: hidden; }

/* 앞면은 미리 180도 회전해놓고 시작 */
.card-front { transform: rotateY(180deg); }

/* flipped 상태에서 부모를 회전 */
.card.flipped .card-inner { transform: rotateY(180deg); }
```

### shake 애니메이션 (실패 시)
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
.card.mismatched { animation: shake 0.4s; }
```

### 반응형 폰트
```css
font-size: clamp(20px, 6vw, 48px);
/* 최소 20px, 화면 6%, 최대 48px */
```
