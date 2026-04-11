# 🃏 냥냥 메모리 (Memo Cats) - 전체 개발 플랜

> **게임**: 초등학생 대상 메모리 카드 매칭 웹게임
> **개발 기간**: 1~2일
> **개발 방식**: 3개 팀(A/B/C) 병렬 작업

---

## 📖 이 문서를 읽는 분께 (비전공자용 안내)

이 폴더의 파일들은 **게임을 만들기 위한 설계도**입니다. 집을 짓기 전에 건축 도면을 그리는 것과 같아요. 3개의 개발팀이 동시에 일할 수 있도록 **누가 무엇을 만들지 명확하게 나눠놓은 문서**입니다.

- **00-overview.md** ← 지금 이 파일. 전체 그림
- **01-team-a-core-logic.md** ← A팀(게임 두뇌) 상세 작업
- **02-team-b-design.md** ← B팀(게임 외모) 상세 작업
- **03-team-c-features.md** ← C팀(꾸미기/배포) 상세 작업

---

## 🎮 게임 개요

| 항목 | 내용 |
|:---|:---|
| **게임 이름** | 냥냥 메모리 (Memo Cats) |
| **장르** | 카드 매칭 퍼즐 |
| **타겟** | 초등학생 (7~13세) |
| **플랫폼** | 웹 브라우저 (PC + 모바일) |
| **기술 스택** | HTML5 + CSS3 + Vanilla JavaScript |
| **저장 방식** | LocalStorage (서버 없음) |
| **배포** | GitHub Pages (무료) |

---

## 🎯 게임 규칙

### 기본 플레이 흐름
1. 게임 시작 시 카드가 뒷면으로 **섞여서** 배치됩니다
2. 플레이어가 카드 **2장**을 차례로 클릭하여 뒤집습니다
3. 두 카드의 그림이 **같으면** ✨
   - 매칭 성공! 카드가 앞면으로 고정됨
   - 점수 +100점 획득
4. 두 카드의 그림이 **다르면** ❌
   - 1초 후 자동으로 다시 뒤집힘
   - 점수 -10점 (최소 0)
5. 모든 카드를 매칭하면 **🏆 승리!**

### 난이도
| 난이도 | 보드 크기 | 카드 수 | 짝 수 | 예상 플레이 시간 |
|:---:|:---:|:---:|:---:|:---:|
| 🟢 쉬움 | 4×3 | 12장 | 6쌍 | 1~2분 |
| 🟡 보통 | 4×4 | 16장 | 8쌍 | 2~4분 |
| 🔴 어려움 | 6×4 | 24장 | 12쌍 | 4~7분 |

### 점수 계산
- 매칭 성공: **+100점**
- 매칭 실패: **-10점** (최소 0점 유지)
- 시간 보너스: 게임 클리어 시 `남은 제한시간 × 2점`
- **최고 점수**는 브라우저 로컬에 자동 저장

---

## 👥 팀 구성 (한눈에 보기)

### 🅰️ A팀 — 게임 엔진팀 (두뇌 역할)
**한 줄 요약**: "게임의 두뇌" - 카드 섞고, 뒤집고, 매칭 판정하는 로직 담당

**주요 산출물**:
- `js/game.js` (메인 컨트롤러)
- `js/cards.js` (카드 생성/관리)

**상세 플랜**: [`01-team-a-core-logic.md`](./01-team-a-core-logic.md)

---

### 🅱️ B팀 — 디자인/UI팀 (얼굴 역할)
**한 줄 요약**: "게임의 얼굴" - 예쁜 화면, 애니메이션, 반응형 레이아웃 담당

**주요 산출물**:
- `index.html` (게임 화면 구조)
- `css/style.css` (디자인 스타일)
- `js/ui.js` (화면 전환)

**상세 플랜**: [`02-team-b-design.md`](./02-team-b-design.md)

---

### 🅲 C팀 — 기능/배포팀 (양념 역할)
**한 줄 요약**: "게임의 양념" - 사운드, 저장, 축하 효과, 배포 담당

**주요 산출물**:
- `js/sound.js` (효과음)
- `js/storage.js` (최고점 저장)
- `js/difficulty.js` (난이도 설정)
- `README.md` + 배포 설정

**상세 플랜**: [`03-team-c-features.md`](./03-team-c-features.md)

---

## 📁 전체 파일 구조

```
web_game/
├── index.html              ← 🅱️ B팀
├── css/
│   └── style.css           ← 🅱️ B팀
├── js/
│   ├── game.js             ← 🅰️ A팀 (메인 컨트롤러)
│   ├── cards.js            ← 🅰️ A팀 (카드 로직)
│   ├── ui.js               ← 🅱️ B팀 (DOM 조작)
│   ├── sound.js            ← 🅲 C팀
│   ├── storage.js          ← 🅲 C팀
│   └── difficulty.js       ← 🅲 C팀
├── assets/
│   └── sounds/             ← 🅲 C팀
├── plan/                   ← 📄 기획 문서 (이 폴더)
│   ├── 00-overview.md
│   ├── 01-team-a-core-logic.md
│   ├── 02-team-b-design.md
│   └── 03-team-c-features.md
└── README.md               ← 🅲 C팀
```

---

## 🔗 공유 규약 (⚠️ 모든 팀 필독)

> **왜 필요한가요?** 3팀이 동시에 다른 파일을 작업하기 때문에, **서로 약속한 규격**이 있어야 나중에 합쳤을 때 잘 맞물립니다. 요리에 비유하면 "공통 레시피 규격"입니다.

### 1️⃣ HTML 요소 ID/클래스 (B팀이 만듦 → A/C팀이 참조)

```html
<div id="app">
  <!-- 시작 화면 -->
  <section id="start-screen" class="screen">
    <h1>냥냥 메모리</h1>
    <div class="difficulty-select">
      <button class="difficulty-btn" data-difficulty="easy">쉬움</button>
      <button class="difficulty-btn" data-difficulty="medium">보통</button>
      <button class="difficulty-btn" data-difficulty="hard">어려움</button>
    </div>
    <button id="start-btn">게임 시작</button>
  </section>

  <!-- 게임 화면 -->
  <section id="game-screen" class="screen hidden">
    <header id="game-header">
      <div id="score">점수: <span>0</span></div>
      <div id="moves">움직임: <span>0</span></div>
      <div id="timer">시간: <span>00:00</span></div>
    </header>
    <div id="game-board"></div>
    <button id="restart-btn">다시하기</button>
  </section>

  <!-- 종료 화면 -->
  <section id="end-screen" class="screen hidden">
    <h2 id="end-message">클리어!</h2>
    <div id="final-score">최종 점수: 0</div>
    <div id="best-score">최고 점수: 0</div>
    <button id="play-again-btn">한번 더!</button>
  </section>
</div>
```

### 2️⃣ 카드 데이터 구조 (A팀이 정의)

```javascript
const card = {
  id: 0,              // 고유 ID (0부터 시작)
  emoji: '🐱',         // 카드 앞면 이모지
  isFlipped: false,   // 현재 뒤집혀 있는지
  isMatched: false,   // 매칭되어 고정되었는지
  element: null       // DOM 요소 참조
};
```

### 3️⃣ 카드 DOM 구조 (A팀이 생성 → B팀이 스타일링)

```html
<div class="card" data-card-id="0">
  <div class="card-inner">
    <div class="card-front">🐱</div>
    <div class="card-back">?</div>
  </div>
</div>
```

**클래스 상태 변화**:
- `.card` → 기본 (뒷면 표시)
- `.card.flipped` → 뒤집힌 상태 (앞면 표시)
- `.card.matched` → 매칭 완료 (앞면 고정, 특수 효과)

### 4️⃣ 커스텀 이벤트 (팀 간 통신)

```javascript
// 🅰️ A팀이 발행 → 🅱️🅲 다른 팀이 수신
document.dispatchEvent(new CustomEvent('game:started', {
  detail: { difficulty: 'medium' }
}));

document.dispatchEvent(new CustomEvent('card:flipped', {
  detail: { cardId: 3 }
}));

document.dispatchEvent(new CustomEvent('card:matched', {
  detail: { cardIds: [3, 7] }
}));

document.dispatchEvent(new CustomEvent('card:mismatched', {
  detail: { cardIds: [3, 7] }
}));

document.dispatchEvent(new CustomEvent('game:won', {
  detail: { score: 850, moves: 12, time: 45 }
}));
```

### 5️⃣ 공개 API (다른 팀이 호출 가능한 함수)

```javascript
// 🅰️ A팀 제공
Game.start(difficulty);        // 'easy' | 'medium' | 'hard'
Game.reset();
Game.getState();               // { score, moves, time, matched, total }

// 🅲 C팀 제공
Storage.saveBestScore(difficulty, score);
Storage.getBestScore(difficulty);
Sound.play(type);              // 'flip' | 'match' | 'mismatch' | 'win' | 'bgm'
Sound.toggleMute();
Difficulty.getConfig(level);   // { rows, cols, emojis[], timeLimit }

// 🅱️ B팀 제공
UI.showScreen(name);           // 'start' | 'game' | 'end'
UI.updateScore(value);
UI.updateMoves(value);
UI.updateTimer(seconds);
```

---

## ⏱️ 개발 타임라인 (1~2일)

### 📅 Day 1 (약 6시간)
```
09:00 ─┬─ 🔔 킥오프: 플랜 회의 + 규약 숙지 (30분)
09:30 ─┤
       │  🅰️ A팀: 카드 섞기/배치 로직 시작
       │  🅱️ B팀: HTML 뼈대 + CSS 기본 레이아웃
       │  🅲 C팀: difficulty.js + storage.js 구현
12:00 ─┤  🍜 점심
13:00 ─┤
       │  🅰️ A팀: 클릭/매칭 로직 + 이벤트 발행
       │  🅱️ B팀: 카드 뒤집기 3D 애니메이션
       │  🅲 C팀: sound.js + 효과음 수집
16:00 ─┤
       │  🔗 1차 통합 테스트 (모두 함께)
17:00 ─┴─ ✅ Day 1 종료: 기본 플레이 가능 버전 완성
```

### 📅 Day 2 (약 4시간)
```
09:00 ─┬─ 🅰️ A팀: 버그 수정 + 점수 계산 고도화
       │  🅱️ B팀: 시각 효과 + 반응형 + 종료 화면
       │  🅲 C팀: 컨페티 효과 + 최고점 표시
12:00 ─┤  🍜 점심
13:00 ─┤
       │  🔗 최종 통합 + QA
       │  🚀 GitHub Pages 배포 (C팀)
       │  📝 README 작성 (C팀)
15:00 ─┴─ 🎉 완성 & 공유!
```

---

## 🧪 통합 및 테스트 체크리스트

### 1차 통합 (Day 1 오후)
- [ ] 3팀 코드 합쳐서 브라우저에서 실행
- [ ] 기본 플레이(뒤집기/매칭) 동작 확인
- [ ] 충돌(ID 중복, 이벤트 오류 등) 정리

### 2차 통합 (Day 2 오후)
- [ ] 모든 난이도에서 정상 작동
- [ ] 최고 점수 저장/표시 정상
- [ ] 사운드 정상 재생
- [ ] 모바일 터치 동작 확인
- [ ] Chrome / Edge / Safari 호환성 확인
- [ ] 콘솔 에러 없음

### 배포 체크
- [ ] GitHub 저장소 푸시
- [ ] GitHub Pages 활성화
- [ ] 공개 URL에서 정상 동작
- [ ] README에 게임 설명 + URL 포함

---

## 🆘 팀 간 커뮤니케이션 규칙

- **막히는 부분**이 있으면 다른 팀 코드를 수정하지 말고 **공유 규약만 참고**해서 본인 파일에서 해결
- **규약을 바꿔야 할 일**이 생기면 즉시 전체 팀에 공유 후 수정
- 각 팀은 **본인 담당 파일**만 수정 (다른 팀 파일은 읽기만)
- 커밋 메시지는 `[A팀] 카드 섞기 구현` 처럼 담당 팀 명시
