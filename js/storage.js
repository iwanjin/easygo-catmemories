const Storage = (function() {
  const PREFIX = 'memoCats_';

  function saveBestScore(difficulty, score) {
    const key = `${PREFIX}best_${difficulty}`;
    const current = getBestScore(difficulty);
    if (score > current) {
      localStorage.setItem(key, String(score));
      return true;
    }
    return false;
  }

  function getBestScore(difficulty) {
    const key = `${PREFIX}best_${difficulty}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 0;
  }

  function getAllBestScores() {
    return {
      easy: getBestScore('easy'),
      medium: getBestScore('medium'),
      hard: getBestScore('hard')
    };
  }

  function isMuted() {
    const key = `${PREFIX}muted`;
    const stored = localStorage.getItem(key);
    return stored === 'true';
  }

  function setMuted(muted) {
    const key = `${PREFIX}muted`;
    localStorage.setItem(key, String(muted));
  }

  return {
    saveBestScore,
    getBestScore,
    getAllBestScores,
    isMuted,
    setMuted
  };
})();
