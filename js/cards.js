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
   * create(config) - Creates and shuffles a deck of cards
   * @param {Object} config - Configuration object
   * @param {number} config.rows - Number of rows
   * @param {number} config.cols - Number of columns
   * @param {Array} config.emojis - Array of emoji strings (will be duplicated)
   * @returns {Array} Array of card objects, shuffled
   */
  function create(config) {
    const { rows, cols, emojis } = config;
    const totalCards = rows * cols;
    const pairsNeeded = totalCards / 2;

    // Create card array with pairs
    cardsData = [];
    let cardId = 0;

    // Add each emoji twice (creating pairs)
    for (let i = 0; i < pairsNeeded; i++) {
      const emoji = emojis[i];

      // First card of the pair
      cardsData.push({
        id: cardId,
        emoji: emoji,
        isFlipped: false,
        isMatched: false,
        element: null
      });
      cardId++;

      // Second card of the pair
      cardsData.push({
        id: cardId,
        emoji: emoji,
        isFlipped: false,
        isMatched: false,
        element: null
      });
      cardId++;
    }

    // Shuffle the deck
    shuffle(cardsData);

    return cardsData;
  }

  /**
   * shuffle(array) - Fisher-Yates shuffle algorithm
   * Mutates the input array in place
   * @param {Array} array - Array to shuffle
   */
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      // Pick a random index from 0 to i
      const j = Math.floor(Math.random() * (i + 1));

      // Swap array[i] and array[j]
      [array[i], array[j]] = [array[j], array[i]];
    }
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
