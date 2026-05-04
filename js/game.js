/**
 * Game Module - IIFE
 * Main game controller managing game state, flow, and event coordination
 *
 * Team A: Core Logic (Phase 1)
 */
const Game = (() => {
  // ==================== Private State ====================
  let state = {
    difficulty: 'medium',
    score: 0,
    moves: 0,
    time: 0,
    matched: 0,
    total: 0,
    isPlaying: false,
    isPaused: false,
    flippedCards: [],    // 현재 뒤집혀있는 카드 (최대 2장)
    isLocked: false      // 카드 비교 중 클릭 방지
  };

  let timerInterval = null;
  let cardsArray = [];  // Reference to created cards
  let boardClickHandler = null; // 중복 등록 방지용 참조

  // ==================== 막누름(button mash) 감지 ====================
  // 디자인 의도: "정말 머리 좋은 친구"는 발동 안 되고, 무지성 연타만 잡는다.
  //   - 처음 2 페어는 정보가 없으니 그냥 통과 (가드)
  //   - 최근 3 페어 시도가 모두 미스매치이면서 클릭 간격이 너무 짧으면 발동
  //     → "기억을 거의 안 쓰고 빠르게만 누르는" 패턴
  //   - 매칭이 한 번이라도 섞이면 휴리스틱 점수 리셋
  let cooldownUntil = 0;            // performance.now() 기준, 이 시각까지 클릭 lock
  let recentClickTimes = [];        // 최근 카드 클릭 시각들 (디버그용/일반 추적)
  let recentPairIntraTimes = [];    // 각 페어의 "두 클릭 사이" 시간 (intra-pair interval)
  let recentMatchOutcomes = [];     // 최근 페어 시도 결과 (true=match, false=mismatch)
  const MASH_RECENT_PAIRS = 3;      // 최근 N 페어를 본다
  const MASH_INTRA_MS = 320;        // 페어 안 두 클릭 간격 평균이 이 값보다 짧으면 무지성 연타 의심
  const MASH_GUARD_MOVES = 2;       // 처음 2 페어는 발동 안 함 (정보 부족)
  const MASH_LOCK_MS = 1200;        // 발동 시 1.2초 lock
  let lastMashWarnAt = 0;


  // ==================== Private Functions ====================

  /**
   * startTimer() - Start the game timer using setInterval
   * Phase 1: Just initialize the structure, timer increments every second
   */
  function startTimer() {
    // Clear any existing interval first
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
      state.time++;
    }, 1000);
  }

  /**
   * stopTimer() - Stop the game timer using clearInterval
   */
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /**
   * initializeCards() - Helper to populate game-board with card elements
   * Phase 1: Just places cards, click handling to be added
   */
  function initializeCards() {
    const gameBoard = document.getElementById('game-board');

    // Clear any existing cards
    gameBoard.innerHTML = '';

    // Create and append card elements
    cardsArray.forEach(card => {
      const cardElement = Cards.createElement(card);
      gameBoard.appendChild(cardElement);
    });
  }

  /**
   * handleCardClick(cardId) - Handle card click event
   * Phase 2: Implemented
   * Processes card flipping, matching logic, and event emission
   */
  function handleCardClick(cardId) {
    // 0. Pause 중에는 클릭 무시
    if (state.isPaused) return;

    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    // 0.5. 막누름 cooldown 중이면 무시 (자동으로 풀림)
    if (now < cooldownUntil) return;

    // 1. Check if game is locked (cards are being compared)
    if (state.isLocked) return;

    // 셔플 이후 cardsArray의 인덱스와 카드의 id는 일치하지 않으므로
    // 반드시 id로 조회해야 한다 (예전엔 cardsArray[cardId]로 잘못 접근).
    const card = cardsArray.find(c => c.id === cardId);
    if (!card) return;

    // 2. Check if card is already flipped
    if (card.isFlipped) return;

    // 3. Check if card is already matched
    if (card.isMatched) return;

    // 4. Flip the card using Cards module
    Cards.flip(cardId);

    // 4.5 막누름 감지용 클릭 시각 기록 (최근 6번만 유지)
    recentClickTimes.push(now);
    if (recentClickTimes.length > 6) recentClickTimes.shift();

    // 5. Add cardId to flippedCards array
    state.flippedCards.push(cardId);

    // 5.5 페어 두 번째 클릭이면 intra-pair interval 기록
    //     (lock 해제 대기 시간과 무관한 "사고 시간" 측정)
    if (state.flippedCards.length === 2 && recentClickTimes.length >= 2) {
      const last = recentClickTimes[recentClickTimes.length - 1];
      const prev = recentClickTimes[recentClickTimes.length - 2];
      recentPairIntraTimes.push(last - prev);
      if (recentPairIntraTimes.length > MASH_RECENT_PAIRS) {
        recentPairIntraTimes.shift();
      }
    }

    // 6. Emit 'card:flipped' custom event
    document.dispatchEvent(new CustomEvent('card:flipped', {
      detail: { cardId: cardId }
    }));

    // 7. If 2 cards are flipped, check for match
    if (state.flippedCards.length === 2) {
      checkMatch();
    }
  }

  /**
   * checkMatch() - Check if two flipped cards match
   * Phase 2: Implemented
   * Compares two flipped cards and handles match/mismatch logic
   */
  function checkMatch() {
    // 1. Lock the game to prevent additional clicks
    state.isLocked = true;

    // 2. Increment moves
    state.moves++;

    // 3. Get the two flipped card objects by ID (not by array index)
    const card1 = cardsArray.find(c => c.id === state.flippedCards[0]);
    const card2 = cardsArray.find(c => c.id === state.flippedCards[1]);

    // 4. Compare emojis
    if (card1.emoji === card2.emoji) {
      // === MATCH SUCCESS ===
      Cards.markMatched(state.flippedCards[0]);
      Cards.markMatched(state.flippedCards[1]);

      state.matched += 2;
      state.score += 100;

      // 막누름 추적: 매칭 성공 → 휴리스틱 윈도우에 true 기록
      pushMatchOutcome(true);

      // Emit 'card:matched' event
      document.dispatchEvent(new CustomEvent('card:matched', {
        detail: { cardIds: state.flippedCards }
      }));

      state.flippedCards = [];
      state.isLocked = false;

      // Check if all cards are matched
      checkWin();
    } else {
      // === MATCH FAILURE ===
      // 막누름 추적: 미스매치 기록 + mash 휴리스틱 평가
      pushMatchOutcome(false);
      maybeTriggerMashWarning();

      // Wait 1 second, then unflip both cards
      setTimeout(() => {
        Cards.unflip(state.flippedCards[0]);
        Cards.unflip(state.flippedCards[1]);

        // Deduct points (minimum 0)
        state.score = Math.max(0, state.score - 10);

        // Emit 'card:mismatched' event
        document.dispatchEvent(new CustomEvent('card:mismatched', {
          detail: { cardIds: state.flippedCards }
        }));

        state.flippedCards = [];
        state.isLocked = false;
      }, 1000);
    }
  }

  function pushMatchOutcome(wasMatch) {
    recentMatchOutcomes.push(!!wasMatch);
    if (recentMatchOutcomes.length > MASH_RECENT_PAIRS) {
      recentMatchOutcomes.shift();
    }
  }

  /**
   * 막누름 의심 휴리스틱:
   *   - 가드: state.moves <= MASH_GUARD_MOVES면 발동 안 함 (정보 부족 단계)
   *   - 최근 N(=3) 페어가 모두 미스매치 (매칭 0건)
   *   - 최근 N 페어의 "페어 안 두 클릭 시간차" 평균이 MASH_INTRA_MS 미만
   *     (lock 시간 1초와 무관하게, 두 카드 사이 "사고 시간"만 본다)
   *   → 모두 만족 시 cooldown 발동 + 'game:mashWarning' 이벤트 디스패치 (UI는 토스트/사운드 처리)
   *
   * 머리 좋은 친구: 매칭률이 높으니 allMiss 조건 미충족 → 발동 안 함.
   * 무지성 연타: 두 카드 사이 거의 사고 없이 빠르게 → 평균 intra가 매우 짧음 → 발동.
   */
  function maybeTriggerMashWarning() {
    if (state.moves <= MASH_GUARD_MOVES) return;
    if (recentMatchOutcomes.length < MASH_RECENT_PAIRS) return;
    if (recentPairIntraTimes.length < MASH_RECENT_PAIRS) return;

    const allMiss = recentMatchOutcomes.every(o => !o);
    if (!allMiss) return;

    const avgIntra =
      recentPairIntraTimes.reduce((a, b) => a + b, 0) / recentPairIntraTimes.length;
    if (avgIntra >= MASH_INTRA_MS) return;

    // 발동
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    cooldownUntil = now + MASH_LOCK_MS;
    lastMashWarnAt = now;

    document.dispatchEvent(new CustomEvent('game:mashWarning', {
      detail: { lockMs: MASH_LOCK_MS, avgIntra: Math.round(avgIntra) }
    }));

    // 다음 발동 전에 휴리스틱 윈도우 부분 리셋 (한 번 잡고 풀어줌)
    recentMatchOutcomes = [];
    recentPairIntraTimes = [];
  }

  /**
   * checkWin() - Check if all cards are matched
   * Phase 2: Implemented
   * Checks if all cards have been matched and triggers win condition
   */
  function checkWin() {
    if (state.matched === state.total) {
      win();
    }
  }

  /**
   * win() - Handle game win condition
   *
   * 점수 공식:
   *   매칭 +100 / 미스매치 -10 (실시간 누적, 위 로직)
   *   + 시간 보너스: max(0, (timeLimit - time)) * 5  (빠를수록 큼)
   *   + 완벽 보너스: max(0, 200 - extraMoves * 10)   (추가 움직임 적을수록 큼)
   *
   *   여기서 extraMoves = moves - pairs (pairs = 매칭에 필요한 최소 움직임).
   *   짧은 시간 + 적은 움직임이 항상 더 높은 점수를 얻도록 설계.
   */
  function win() {
    stopTimer();

    const config = Difficulty.getConfig(state.difficulty);
    const pairs = state.matched / 2;
    const extraMoves = Math.max(0, state.moves - pairs);

    const timeBonus = Math.max(0, config.timeLimit - state.time) * 5;
    const perfectBonus = Math.max(0, 200 - extraMoves * 10);

    state.score += timeBonus + perfectBonus;

    state.isPlaying = false;

    document.dispatchEvent(new CustomEvent('game:won', {
      detail: {
        score: state.score,
        moves: state.moves,
        time: state.time,
        timeBonus,
        perfectBonus,
        extraMoves
      }
    }));
  }


  // ==================== Public API ====================

  /**
   * start(difficulty) - Start a new game at the specified difficulty level
   * @param {string} difficulty - Game difficulty: 'easy', 'medium', or 'hard'
   */
  function start(difficulty) {
    // 1. Initialize state with the specified difficulty
    state.difficulty = difficulty;
    state.score = 0;
    state.moves = 0;
    state.time = 0;
    state.matched = 0;
    state.flippedCards = [];
    state.isLocked = false;

    // 막누름 휴리스틱 상태 리셋
    cooldownUntil = 0;
    recentClickTimes = [];
    recentPairIntraTimes = [];
    recentMatchOutcomes = [];

    // 2. Get difficulty config from C team's Difficulty module
    const config = Difficulty.getConfig(difficulty);
    state.total = config.rows * config.cols;

    // 3. Create shuffled cards using A team's Cards module
    cardsArray = Cards.create(config);

    // 4. Initialize the game board with card elements
    initializeCards();

    // 4.5. Set the board grid class based on difficulty
    UI.setBoardClass(difficulty);

    // 5. Set game as playing
    state.isPlaying = true;

    // 6. Register click listener on game-board using event delegation
    //    이전에 등록된 핸들러가 있으면 제거 (중복 등록 방지)
    const gameBoard = document.getElementById('game-board');
    if (boardClickHandler) {
      gameBoard.removeEventListener('click', boardClickHandler);
    }
    boardClickHandler = (e) => {
      const cardElement = e.target.closest('.card');
      if (!cardElement) return;
      const cardId = Number(cardElement.dataset.cardId);
      handleCardClick(cardId);
    };
    gameBoard.addEventListener('click', boardClickHandler);

    // 7. Start the timer
    startTimer();

    // 8. Emit 'game:started' custom event with difficulty detail
    document.dispatchEvent(new CustomEvent('game:started', {
      detail: { difficulty: difficulty }
    }));
  }

  /**
   * reset() - Reset the game to initial state
   * Ensures complete cleanup: timer stopped, state cleared, DOM cleared
   */
  function reset() {
    // 1. Stop the timer and clear interval reference
    stopTimer();
    timerInterval = null;  // Explicit null to prevent timer duplication

    // 2. Reset state object - all fields initialized
    state.difficulty = 'medium';
    state.score = 0;
    state.moves = 0;
    state.time = 0;
    state.matched = 0;
    state.total = 0;
    state.isPlaying = false;
    state.isPaused = false;
    state.flippedCards = [];
    state.isLocked = false;

    // 3. Clear cards array reference
    cardsArray = [];

    // 4. Clear the game board DOM completely
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
  }

  /**
   * getState() - Return a copy of the current game state
   * @returns {Object} Copy of the state object
   */
  function getState() {
    return { ...state };
  }


  /**
   * pause() - 타이머/입력 일시정지
   */
  function pause() {
    if (!state.isPlaying || state.isPaused) return;
    state.isPaused = true;
    stopTimer();
    document.dispatchEvent(new CustomEvent('game:paused'));
  }

  /**
   * resume() - 타이머/입력 재개
   */
  function resume() {
    if (!state.isPlaying || !state.isPaused) return;
    state.isPaused = false;
    startTimer();
    document.dispatchEvent(new CustomEvent('game:resumed'));
  }


  // ==================== Return Public API ====================
  return {
    start,
    reset,
    pause,
    resume,
    getState
  };
})();
