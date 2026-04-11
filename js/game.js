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
    flippedCards: [],    // 현재 뒤집혀있는 카드 (최대 2장)
    isLocked: false      // 카드 비교 중 클릭 방지
  };

  let timerInterval = null;
  let cardsArray = [];  // Reference to created cards


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
    // 1. Check if game is locked (cards are being compared)
    if (state.isLocked) return;

    // 2. Check if card is already flipped
    if (cardsArray[cardId].isFlipped) return;

    // 3. Check if card is already matched
    if (cardsArray[cardId].isMatched) return;

    // 4. Flip the card using Cards module
    Cards.flip(cardId);

    // 5. Add cardId to flippedCards array
    state.flippedCards.push(cardId);

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

    // 3. Get the two flipped card objects
    const card1 = cardsArray[state.flippedCards[0]];
    const card2 = cardsArray[state.flippedCards[1]];

    // 4. Compare emojis
    if (card1.emoji === card2.emoji) {
      // === MATCH SUCCESS ===
      Cards.markMatched(state.flippedCards[0]);
      Cards.markMatched(state.flippedCards[1]);

      state.matched += 2;
      state.score += 100;

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
   * Phase 2: Implemented
   * Stops timer, calculates final score, and emits game:won event
   */
  function win() {
    // 1. Stop the timer
    stopTimer();

    // 2. Calculate time bonus
    // Simplified: time * 2 (accumulated time in seconds * 2)
    const timeBonus = state.time * 2;
    state.score += timeBonus;

    // 3. Mark game as not playing
    state.isPlaying = false;

    // 4. Emit 'game:won' custom event with final stats
    document.dispatchEvent(new CustomEvent('game:won', {
      detail: {
        score: state.score,
        moves: state.moves,
        time: state.time
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

    // 2. Get difficulty config from C team's Difficulty module
    const config = Difficulty.getConfig(difficulty);
    state.total = config.rows * config.cols;

    // 3. Create shuffled cards using A team's Cards module
    cardsArray = Cards.create(config);

    // 4. Initialize the game board with card elements
    initializeCards();

    // 5. Set game as playing
    state.isPlaying = true;

    // 6. Register click listener on game-board using event delegation
    const gameBoard = document.getElementById('game-board');
    gameBoard.addEventListener('click', (e) => {
      const cardElement = e.target.closest('.card');
      if (!cardElement) return;

      const cardId = Number(cardElement.dataset.cardId);
      handleCardClick(cardId);
    });

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


  // ==================== Return Public API ====================
  return {
    start,
    reset,
    getState
  };
})();
