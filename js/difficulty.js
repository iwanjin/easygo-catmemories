const Difficulty = (function() {
  // Cute animal emojis for the game
  const animalEmojis = ['🐱', '🐶', '🐰', '🐻', '🐼', '🦊', '🐸', '🐵', '🦁', '🐯', '🐨', '🐷'];

  // Difficulty configurations
  const configs = {
    easy: {
      rows: 3,
      cols: 4,
      timeLimit: 120,
      emojis: animalEmojis.slice(0, 6)
    },
    medium: {
      rows: 4,
      cols: 4,
      timeLimit: 180,
      emojis: animalEmojis.slice(0, 8)
    },
    hard: {
      rows: 4,
      cols: 6,
      timeLimit: 240,
      emojis: animalEmojis.slice(0, 12)
    }
  };

  /**
   * Get configuration for a specific difficulty level
   * @param {string} level - The difficulty level ('easy', 'medium', or 'hard')
   * @returns {Object} A copy of the configuration object for the specified level
   */
  function getConfig(level) {
    if (!configs[level]) {
      console.warn(`Unknown difficulty level: ${level}. Defaulting to 'medium'.`);
      return { ...configs['medium'] };
    }
    return { ...configs[level] };
  }

  /**
   * Get all available difficulty levels
   * @returns {Array<string>} Array of available difficulty level names
   */
  function getAllLevels() {
    return Object.keys(configs);
  }

  // Public API
  return {
    getConfig: getConfig,
    getAllLevels: getAllLevels
  };
})();
