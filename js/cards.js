/**
 * Cards Module - IIFE
 * Manages card creation, shuffling, and DOM manipulation
 *
 * Team A: Core Logic
 */
const Cards = (() => {
  // Private state: store all cards
  let cardsData = [];

  /**
   * create(config, seed?) - 카드 페어 생성 후 셔플.
   *   seed가 주어지면 결정론적 셔플 (일일 챌린지 등 모든 디바이스 같은 보드).
   *   seed는 문자열(예 'YYYY-MM-DD-easy') 또는 정수.
   */
  function create(config, seed) {
    const { rows, cols, emojis } = config;
    const totalCards = rows * cols;
    const pairsNeeded = totalCards / 2;

    cardsData = [];
    let cardId = 0;
    for (let i = 0; i < pairsNeeded; i++) {
      const emoji = emojis[i];
      cardsData.push({
        id: cardId++, emoji, isFlipped: false, isMatched: false, element: null
      });
      cardsData.push({
        id: cardId++, emoji, isFlipped: false, isMatched: false, element: null
      });
    }

    if (seed != null && seed !== '') {
      shuffleSeeded(cardsData, seed);
    } else {
      shuffle(cardsData);
    }

    return cardsData;
  }

  /**
   * Fisher-Yates with Math.random
   */
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Fisher-Yates with seeded PRNG (Mulberry32).
   * 같은 seed → 같은 결과. 일일 챌린지에서 모든 사용자가 같은 보드를 보게 함.
   */
  function shuffleSeeded(array, seed) {
    const rand = mulberry32(seedHash(seed));
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function seedHash(seed) {
    if (typeof seed === 'number') return seed >>> 0;
    const str = String(seed);
    // FNV-1a 32-bit
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * createElement(card) - Creates DOM element for a card
   * Stores the DOM reference in card.element
   * @param {Object} card - Card object
   * @returns {HTMLElement} The created card element
   */
  function createElement(card) {
    // Create outer card div
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.setAttribute('data-card-id', card.id);

    // Create inner container for 3D flip effect
    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';

    // Create front side (emoji)
    const cardFront = document.createElement('div');
    cardFront.className = 'card-front';
    cardFront.textContent = card.emoji;

    // Create back side (?)
    const cardBack = document.createElement('div');
    cardBack.className = 'card-back';
    cardBack.textContent = '?';

    // Assemble the card structure
    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    cardElement.appendChild(cardInner);

    // Store reference to DOM element in card object
    card.element = cardElement;

    return cardElement;
  }

  /**
   * flip(cardId) - Adds .flipped class to card
   * @param {number} cardId - ID of the card to flip
   */
  function flip(cardId) {
    const card = cardsData.find(c => c.id === cardId);
    if (card && card.element) {
      card.element.classList.add('flipped');
      card.isFlipped = true;
    }
  }

  /**
   * unflip(cardId) - Removes .flipped class from card
   * @param {number} cardId - ID of the card to unflip
   */
  function unflip(cardId) {
    const card = cardsData.find(c => c.id === cardId);
    if (card && card.element) {
      card.element.classList.remove('flipped');
      card.isFlipped = false;
    }
  }

  /**
   * markMatched(cardId) - Adds .matched class to card
   * @param {number} cardId - ID of the card to mark as matched
   */
  function markMatched(cardId) {
    const card = cardsData.find(c => c.id === cardId);
    if (card && card.element) {
      card.element.classList.add('matched');
      card.isMatched = true;
    }
  }

  // Public API
  return {
    create,
    createElement,
    flip,
    unflip,
    markMatched
  };
})();
