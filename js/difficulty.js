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

  /**
   * 난이도별 이상적 만점.
   *   = 페어수 × 100 (모두 매칭, 미스 0) + 시간보너스(즉시클리어=timeLimit*5) + 완벽보너스(200)
   * 클리어 시 백분위 등급 산정의 분모로 쓴다.
   */
  function getMaxScore(level) {
    const cfg = getConfig(level);
    const pairs = (cfg.rows * cfg.cols) / 2;
    return pairs * 100 + cfg.timeLimit * 5 + 200;
  }

  // Public API
  return {
    getConfig: getConfig,
    getAllLevels: getAllLevels,
    getMaxScore: getMaxScore
  };
})();
