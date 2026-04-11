# 🅰️ A팀 - 게임 엔진팀 상세 플랜

> **한 줄 역할**: 게임의 "두뇌" — 카드를 섞고, 뒤집고, 매칭을 판정하는 로직 담당
> **담당 파일**: `js/game.js`, `js/cards.js`
> **예상 작업 시간**: Day 1 (4시간) + Day 2 (2시간) = **총 6시간**

---

## 📖 비전공자용 안내

A팀은 게임이 "어떻게 작동하는지"를 담당합니다. 아래와 같은 질문에 답을 만드는 팀이라고 생각하시면 됩니다:

- 🤔 카드를 어떻게 섞지?
- 🤔 카드를 클릭했을 때 뭐가 일어나야 하지?
- 🤔 두 카드가 같은지 어떻게 알지?
- 🤔 점수는 언제 올라가고 언제 내려가지?
- 🤔 게임이 끝났는지 어떻게 알지?

A팀이 만드는 코드는 **눈에 보이지 않지만**, 게임이 정상 작동하게 만드는 가장 중요한 부분입니다. 자동차로 치면 **엔진** 같은 역할이에요.

---

## 🎯 핵심 책임

1. ✅ 카드 데이터 생성 (난이도에 맞게 이모지 짝 만들기)
2. ✅ 카드 섞기 (Fisher-Yates 알고리즘)
3. ✅ 카드 클릭 이벤트 감지
4. ✅ 뒤집기 로직 (한 번에 최대 2장)
5. ✅ 매칭 판정 (같으면 고정, 다르면 1초 후 원상복구)
6. ✅ 점수/움직임/시간 계산
7. ✅ 승리 조건 체크 (모든 카드 매칭 완료)
8. ✅ 게임 상태 관리 (시작/진행/종료)
9. ✅ 커스텀 이벤트 발행 (다른 팀에게 알림)

---

## 📂 담당 파일

### `js/cards.js` - 카드 관리 모듈

```javascript
// 역할: 카드 생성, 섞기, 상태 관리
const Cards = (function() {
  let cardList = [];

  // 난이도별 카드 배열 생성
  function create(config) {
    // config = { rows, cols, emojis }
    // - emojis 배열에서 필요한 개수만큼 선택
    // - 각 이모지를 2장씩 복제 (짝 만들기)
    // - Fisher-Yates로 섞기
    // - 카드 객체 배열 반환
  }

  // 카드 섞기 (Fisher-Yates 알고리즘)
  function shuffle(array) { /* ... */ }

  // 카드 DOM 요소 생성
  function createElement(card) {
    // <div class="card" data-card-id="..."> 생성
    // card-inner, card-front, card-back 자식 요소 포함
  }

  // 카드 뒤집기 (시각적)
  function flip(cardId) { /* ... */ }

  // 카드 원상복구 (뒷면으로)
  function unflip(cardId) { /* ... */ }

  // 매칭 표시 (고정)
  function markMatched(cardId) { /* ... */ }

  return { create, createElement, flip, unflip, markMatched };
})();
```

### `js/game.js` - 게임 메인 컨트롤러

```javascript
// 역할: 전체 게임 흐름 제어, 점수/시간 관리, 이벤트 발행
const Game = (function() {
  let state = {
    difficulty: 'medium',
    score: 0,
    moves: 0,
    time: 0,
    matched: 0,
    total: 0,
    isPlaying: false,
    flippedCards: [],    // 현재 뒤집혀있는 카드 (최대 2장)
    isLocked: false      // 카드 비교 중 클릭 방지
  };

  let timerInterval = null;

  function start(difficulty) {
    // 1. 난이도 설정 받기 (C팀 Difficulty.getConfig 호출)
    // 2. 상태 초기화
    // 3. Cards.create(config) 호출해서 카드 생성
    // 4. 카드를 game-board에 배치
    // 5. 타이머 시작
    // 6. 'game:started' 이벤트 발행
  }

  function handleCardClick(cardId) {
    // 1. isLocked이면 무시
    // 2. 이미 뒤집혀있거나 매칭된 카드면 무시
    // 3. Cards.flip(cardId) 호출
    // 4. flippedCards에 추가
    // 5. 'card:flipped' 이벤트 발행
    // 6. flippedCards가 2개면 checkMatch() 호출
  }

  function checkMatch() {
    // 1. isLocked = true (추가 클릭 방지)
    // 2. moves 증가
    // 3. 두 카드의 emoji 비교
    //    - 같으면: markMatched, matched++, score += 100, 'card:matched' 발행
    //    - 다르면: 1초 대기 후 unflip, score -= 10, 'card:mismatched' 발행
    // 4. flippedCards 초기화
    // 5. isLocked = false
    // 6. checkWin() 호출
  }

  function checkWin() {
    // matched === total 이면 win() 호출
  }

  function win() {
    // 1. 타이머 정지
    // 2. 시간 보너스 계산
    // 3. 'game:won' 이벤트 발행 (score, moves, time 포함)
    // 4. isPlaying = false
  }

  function reset() {
    // 상태 초기화, 타이머 정리
  }

  function getState() {
    return { ...state };
  }

  // 타이머 관련
  function startTimer() { /* setInterval */ }
  function stopTimer() { /* clearInterval */ }

  return { start, reset, getState };
})();
```

---

## ⏱️ 단계별 작업 순서

### **Day 1 오전 (2시간) - 카드 기초**

#### [A1] 카드 모듈 뼈대 작성 (30분)
- `cards.js` 파일 생성
- `Cards` 모듈 구조 잡기
- `create()`, `shuffle()` 함수 구현

**결과물**: 콘솔에서 `Cards.create({rows:4, cols:4, emojis:['🐱','🐶'...]})` 호출하면 섞인 카드 배열 반환

#### [A2] 카드 DOM 생성 (1시간)
- `createElement()` 구현
- 카드를 실제 `<div>` 요소로 변환
- `data-card-id` 속성 부여
- `card-inner`, `card-front`, `card-back` 구조

**결과물**: 게임 보드에 카드들이 배치됨 (스타일은 B팀 책임이지만 구조는 A팀)

#### [A3] 게임 컨트롤러 뼈대 (30분)
- `game.js` 파일 생성
- `Game` 모듈 구조 + state 객체
- `start()`, `reset()` 스켈레톤

**결과물**: `Game.start('medium')` 호출 시 보드에 카드들이 나타남

---

### **Day 1 오후 (2시간) - 핵심 로직**

#### [A4] 카드 클릭 처리 (1시간)
- `handleCardClick()` 구현
- 이벤트 위임(delegation) 방식으로 `game-board`에 클릭 리스너 등록
- 잘못된 클릭 방어 (이미 뒤집힘/매칭/잠금)
- `Cards.flip()` 호출 + `card:flipped` 이벤트 발행

**결과물**: 카드를 클릭하면 앞면이 보임 (애니메이션은 B팀)

#### [A5] 매칭 판정 + 점수 (1시간)
- `checkMatch()` 구현
- 두 카드 비교 → 성공/실패 분기
- 성공: `Cards.markMatched()`, 점수 +100, 이벤트 발행
- 실패: 1초 후 `Cards.unflip()`, 점수 -10, 이벤트 발행
- 타이머 (setInterval) 연동

**결과물**: 완전한 메모리 게임 플레이 가능 (시각 효과 제외)

---

### **Day 2 오전 (1.5시간) - 고도화**

#### [A6] 승리 조건 + 게임 종료 (45분)
- `checkWin()` 구현
- 시간 보너스 계산: `max(0, 제한시간 - 경과시간) × 2`
- `game:won` 이벤트 발행 (score, moves, time detail 포함)

#### [A7] 버그 수정 + 엣지 케이스 (45분)
- 연속 더블 클릭 방지
- 같은 카드 두 번 클릭 방지
- 타이머 초기화 정확성
- 재시작 시 상태 깨끗하게 리셋

---

### **Day 2 오후 (0.5시간) - 통합 지원**

#### [A8] 다른 팀과 통합 (30분)
- B팀 HTML 구조에 맞춰 셀렉터 확인
- C팀 `Difficulty.getConfig()` 연동 확인
- 발행 이벤트가 제대로 수신되는지 확인

---

## 🧪 A팀 자체 테스트 체크리스트

### 기능 테스트
- [ ] 쉬움/보통/어려움 모두 정상 카드 생성
- [ ] 카드 섞기가 실제로 무작위로 작동 (여러 번 해서 확인)
- [ ] 두 카드 뒤집기까지는 정상, 세 번째 클릭은 무시
- [ ] 매칭 성공 시 카드가 고정되고 점수 +100
- [ ] 매칭 실패 시 1초 후 다시 뒤집히고 점수 -10
- [ ] 점수가 0 미만으로 내려가지 않음
- [ ] 모든 카드 매칭 시 승리 이벤트 발행
- [ ] 재시작 시 완전 초기화

### 이벤트 발행 확인 (브라우저 콘솔)
```javascript
// 콘솔에 붙여넣고 이벤트가 제대로 오는지 확인
['game:started', 'card:flipped', 'card:matched',
 'card:mismatched', 'game:won'].forEach(name => {
  document.addEventListener(name, e => console.log(name, e.detail));
});
```

---

## 🔗 다른 팀과의 연결점

| 항목 | 상대팀 | 내용 |
|:---|:---:|:---|
| HTML 셀렉터 | 🅱️ B팀 | `#game-board`, `#score span`, `#moves span`, `#timer span` |
| 카드 DOM 클래스 | 🅱️ B팀 | `.card`, `.card.flipped`, `.card.matched` |
| 난이도 설정 받기 | 🅲 C팀 | `Difficulty.getConfig(level)` |
| 최고점 저장 | 🅲 C팀 | `Storage.saveBestScore(diff, score)` (game:won 시 C팀이 수신) |
| 사운드 트리거 | 🅲 C팀 | C팀이 `card:flipped` 등 수신해서 재생 |

---

## 💡 A팀 기술 팁

### Fisher-Yates 섞기 알고리즘
```javascript
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

### 이벤트 위임(Delegation) 패턴
```javascript
// 카드마다 리스너를 달지 말고 부모에 하나만
document.getElementById('game-board').addEventListener('click', (e) => {
  const cardEl = e.target.closest('.card');
  if (!cardEl) return;
  handleCardClick(Number(cardEl.dataset.cardId));
});
```

### 매칭 판정 비동기 처리
```javascript
// setTimeout으로 실패 시 1초 대기 (시각적 피드백 시간)
if (isMatch) {
  // 즉시 처리
} else {
  state.isLocked = true;
  setTimeout(() => {
    // 뒤집기 원상복구
    state.isLocked = false;
  }, 1000);
}
```
