/**
 * Game Module - IIFE
 * 게임 상태/흐름 관리. 모드(classic / daily / versus / timeattack) 분기.
 */
const Game = (() => {
  // ==================== State ====================
  let state = {
    mode: 'classic',          // 'classic' | 'daily' | 'versus' | 'timeattack'
    difficulty: 'medium',
    seed: null,               // daily 모드에서 결정론적 셔플 시드
    score: 0,                 // 1인 모드 점수
    moves: 0,
    time: 0,
    matched: 0,
    total: 0,
    combo: 0,                 // 연속 매칭 카운트 (1인 모드)
    comboMultiplier: 1,       // 위에서 계산된 배수
    isPlaying: false,
    isPaused: false,
    flippedCards: [],
    isLocked: false,
    // versus 전용
    players: null,            // [{name, en, score, matches, combo}]
    currentPlayerIndex: -1,
    // timeattack 전용
    timeLimit: 0,             // 0이면 무제한, >0이면 카운트다운
    boardsCleared: 0          // 비운 보드 수
  };

  const TIMEATTACK_DURATION = 60;
  const BOARD_CLEAR_BONUS = 500;

  let timerInterval = null;
  let cardsArray = [];
  let boardClickHandler = null;

  // ==================== 막누름 감지 (기존) ====================
  let cooldownUntil = 0;
  let recentClickTimes = [];
  let recentPairIntraTimes = [];
  let recentMatchOutcomes = [];
  const MASH_RECENT_PAIRS = 3;
  const MASH_INTRA_MS = 320;
  const MASH_GUARD_MOVES = 2;
  const MASH_LOCK_MS = 1200;
  let lastMashWarnAt = 0;

  // ==================== 콤보 ====================
  // 연속 매칭 카운트 → 배수.
  // 1: x1, 2~3: x2, 4~5: x3, 6~7: x5, 8+: x8
  function comboToMultiplier(combo) {
    if (combo >= 8) return 8;
    if (combo >= 6) return 5;
    if (combo >= 4) return 3;
    if (combo >= 2) return 2;
    return 1;
  }

  // ==================== Timer ====================
  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      state.time++;
      // timeattack: 카운트다운이 0에 닿으면 종료
      if (state.timeLimit > 0 && state.time >= state.timeLimit) {
        timeAttackEnd();
      }
    }, 1000);
  }
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // ==================== Board ====================
  function initializeCards() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    cardsArray.forEach(card => {
      const cardElement = Cards.createElement(card);
      gameBoard.appendChild(cardElement);
    });
  }

  // ==================== Click ====================
  function handleCardClick(cardId) {
    if (state.isPaused) return;

    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now < cooldownUntil) return;
    if (state.isLocked) return;

    const card = cardsArray.find(c => c.id === cardId);
    if (!card) return;
    if (card.isFlipped) return;
    if (card.isMatched) return;

    Cards.flip(cardId);

    recentClickTimes.push(now);
    if (recentClickTimes.length > 6) recentClickTimes.shift();

    state.flippedCards.push(cardId);

    if (state.flippedCards.length === 2 && recentClickTimes.length >= 2) {
      const last = recentClickTimes[recentClickTimes.length - 1];
      const prev = recentClickTimes[recentClickTimes.length - 2];
      recentPairIntraTimes.push(last - prev);
      if (recentPairIntraTimes.length > MASH_RECENT_PAIRS) {
        recentPairIntraTimes.shift();
      }
    }

    document.dispatchEvent(new CustomEvent('card:flipped', {
      detail: { cardId: cardId }
    }));

    if (state.flippedCards.length === 2) {
      checkMatch();
    }
  }

  function checkMatch() {
    state.isLocked = true;
    state.moves++;

    const card1 = cardsArray.find(c => c.id === state.flippedCards[0]);
    const card2 = cardsArray.find(c => c.id === state.flippedCards[1]);

    if (card1.emoji === card2.emoji) {
      // === 매칭 성공 ===
      Cards.markMatched(state.flippedCards[0]);
      Cards.markMatched(state.flippedCards[1]);
      state.matched += 2;

      if (state.mode === 'versus') {
        const p = state.players[state.currentPlayerIndex];
        p.matches += 1;
        p.combo += 1;
        const mult = comboToMultiplier(p.combo);
        p.score += 100 * mult;
        state.combo = p.combo;
        state.comboMultiplier = mult;
      } else {
        state.combo += 1;
        state.comboMultiplier = comboToMultiplier(state.combo);
        state.score += 100 * state.comboMultiplier;
      }

      pushMatchOutcome(true);

      document.dispatchEvent(new CustomEvent('card:matched', {
        detail: {
          cardIds: state.flippedCards,
          combo: state.combo,
          multiplier: state.comboMultiplier
        }
      }));

      state.flippedCards = [];
      state.isLocked = false;
      checkWin();
    } else {
      // === 미스매치 ===
      pushMatchOutcome(false);
      maybeTriggerMashWarning();

      const flippedCopy = state.flippedCards.slice();

      setTimeout(() => {
        Cards.unflip(flippedCopy[0]);
        Cards.unflip(flippedCopy[1]);

        if (state.mode === 'versus') {
          const p = state.players[state.currentPlayerIndex];
          p.combo = 0;
          // 다음 플레이어로 차례 넘김
          state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
          state.combo = state.players[state.currentPlayerIndex].combo;
          state.comboMultiplier = comboToMultiplier(state.combo);
          document.dispatchEvent(new CustomEvent('game:turnChanged', {
            detail: { currentPlayerIndex: state.currentPlayerIndex }
          }));
        } else {
          state.combo = 0;
          state.comboMultiplier = 1;
          state.score = Math.max(0, state.score - 10);
        }

        document.dispatchEvent(new CustomEvent('card:mismatched', {
          detail: { cardIds: flippedCopy }
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

  function maybeTriggerMashWarning() {
    if (state.moves <= MASH_GUARD_MOVES) return;
    if (recentMatchOutcomes.length < MASH_RECENT_PAIRS) return;
    if (recentPairIntraTimes.length < MASH_RECENT_PAIRS) return;

    const allMiss = recentMatchOutcomes.every(o => !o);
    if (!allMiss) return;

    const avgIntra =
      recentPairIntraTimes.reduce((a, b) => a + b, 0) / recentPairIntraTimes.length;
    if (avgIntra >= MASH_INTRA_MS) return;

    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    cooldownUntil = now + MASH_LOCK_MS;
    lastMashWarnAt = now;

    document.dispatchEvent(new CustomEvent('game:mashWarning', {
      detail: { lockMs: MASH_LOCK_MS, avgIntra: Math.round(avgIntra) }
    }));

    recentMatchOutcomes = [];
    recentPairIntraTimes = [];
  }

  // ==================== Win ====================
  function checkWin() {
    if (state.matched !== state.total) return;
    if (state.mode === 'timeattack') {
      // 보드 클리어: 보너스 + 콤보 유지 + 새 보드 즉시 깔기
      state.boardsCleared += 1;
      state.score += BOARD_CLEAR_BONUS;
      refillBoardForTimeAttack();
      document.dispatchEvent(new CustomEvent('game:boardCleared', {
        detail: {
          boardsCleared: state.boardsCleared,
          bonus: BOARD_CLEAR_BONUS,
          score: state.score
        }
      }));
      return;
    }
    win();
  }

  function refillBoardForTimeAttack() {
    state.matched = 0;
    state.flippedCards = [];
    state.isLocked = false;
    const config = Difficulty.getConfig(state.difficulty);
    // seed=null → 매번 다른 보드
    cardsArray = Cards.create(config, null);
    initializeCards();
  }

  function timeAttackEnd() {
    if (!state.isPlaying) return;
    stopTimer();
    state.isPlaying = false;
    document.dispatchEvent(new CustomEvent('game:won', {
      detail: {
        mode: 'timeattack',
        difficulty: state.difficulty,
        score: state.score,
        moves: state.moves,
        time: state.timeLimit,
        boardsCleared: state.boardsCleared
      }
    }));
  }

  /**
   * 모드별 승리 처리
   *  - classic / daily: 기존 점수 공식 (시간/완벽 보너스) + 콤보는 이미 점수 누적에 반영됨
   *  - versus: 더 많이 맞춘 플레이어 승, 동률이면 무승부
   */
  function win() {
    stopTimer();
    state.isPlaying = false;

    if (state.mode === 'versus') {
      // 우승자 결정: 매칭 수 많은 사람. 동률이면 무승부(-1).
      let winnerIndex = -1;
      let max = -1;
      let tied = false;
      state.players.forEach((p, i) => {
        if (p.matches > max) { max = p.matches; winnerIndex = i; tied = false; }
        else if (p.matches === max) { tied = true; }
      });
      if (tied) winnerIndex = -1;

      document.dispatchEvent(new CustomEvent('game:won', {
        detail: {
          mode: 'versus',
          players: state.players.map(p => ({ ...p })),
          winnerIndex,
          time: state.time
        }
      }));
      return;
    }

    // classic / daily
    const config = Difficulty.getConfig(state.difficulty);
    const pairs = state.matched / 2;
    const extraMoves = Math.max(0, state.moves - pairs);

    const timeBonus = Math.max(0, config.timeLimit - state.time) * 5;
    const perfectBonus = Math.max(0, 200 - extraMoves * 10);

    state.score += timeBonus + perfectBonus;

    document.dispatchEvent(new CustomEvent('game:won', {
      detail: {
        mode: state.mode,
        difficulty: state.difficulty,
        seed: state.seed,
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
   * Game.start(opts)
   *   opts: 'easy'|'medium'|'hard' (호환)  또는
   *         { mode, difficulty, seed?, players? }
   *
   *   mode 기본값 'classic'
   *   versus 모드의 players 기본: [{ko:'플레이어 1', en:'Player 1'}, {ko:'플레이어 2', en:'Player 2'}]
   */
  function start(opts) {
    if (typeof opts === 'string') {
      opts = { mode: 'classic', difficulty: opts };
    }
    const mode = opts.mode || 'classic';
    const difficulty = opts.difficulty || 'medium';
    const seed = opts.seed != null ? opts.seed : null;
    const playersIn = opts.players || (mode === 'versus'
      ? [{ ko: '플레이어 1', en: 'Player 1' }, { ko: '플레이어 2', en: 'Player 2' }]
      : null);

    // 상태 초기화
    state.mode = mode;
    state.difficulty = difficulty;
    state.seed = seed;
    state.score = 0;
    state.moves = 0;
    state.time = 0;
    state.matched = 0;
    state.combo = 0;
    state.comboMultiplier = 1;
    state.flippedCards = [];
    state.isLocked = false;
    state.isPaused = false;
    state.timeLimit = (mode === 'timeattack') ? TIMEATTACK_DURATION : 0;
    state.boardsCleared = 0;

    if (mode === 'versus') {
      state.players = playersIn.map(p => ({
        ko: p.ko, en: p.en,
        score: 0, matches: 0, combo: 0
      }));
      state.currentPlayerIndex = 0;
    } else {
      state.players = null;
      state.currentPlayerIndex = -1;
    }

    // 막누름 휴리스틱 리셋
    cooldownUntil = 0;
    recentClickTimes = [];
    recentPairIntraTimes = [];
    recentMatchOutcomes = [];

    // 보드 생성
    const config = Difficulty.getConfig(difficulty);
    state.total = config.rows * config.cols;
    cardsArray = Cards.create(config, seed);

    initializeCards();
    UI.setBoardClass(difficulty);

    state.isPlaying = true;

    // 클릭 핸들러 (중복 방지)
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

    startTimer();

    document.dispatchEvent(new CustomEvent('game:started', {
      detail: { mode, difficulty, seed }
    }));
  }

  function reset() {
    stopTimer();
    timerInterval = null;
    state.mode = 'classic';
    state.difficulty = 'medium';
    state.seed = null;
    state.score = 0;
    state.moves = 0;
    state.time = 0;
    state.matched = 0;
    state.total = 0;
    state.combo = 0;
    state.comboMultiplier = 1;
    state.isPlaying = false;
    state.isPaused = false;
    state.flippedCards = [];
    state.isLocked = false;
    state.players = null;
    state.currentPlayerIndex = -1;
    state.timeLimit = 0;
    state.boardsCleared = 0;

    cardsArray = [];
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
  }

  function getState() { return { ...state }; }

  function pause() {
    if (!state.isPlaying || state.isPaused) return;
    state.isPaused = true;
    stopTimer();
    document.dispatchEvent(new CustomEvent('game:paused'));
  }
  function resume() {
    if (!state.isPlaying || !state.isPaused) return;
    state.isPaused = false;
    startTimer();
    document.dispatchEvent(new CustomEvent('game:resumed'));
  }

  return { start, reset, pause, resume, getState };
})();
