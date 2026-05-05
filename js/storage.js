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

  // ========== Timeattack 최고 점수 (점수+보드수 페어로 저장) ==========
  function getBestTimeAttack() {
    const key = `${PREFIX}best_timeattack`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return { score: 0, boardsCleared: 0 };
      const obj = JSON.parse(raw);
      return {
        score: Number(obj.score) || 0,
        boardsCleared: Number(obj.boardsCleared) || 0
      };
    } catch {
      return { score: 0, boardsCleared: 0 };
    }
  }

  // 더 높은 점수일 때만 갱신. 동점이면 보드수가 더 많을 때 갱신.
  function saveBestTimeAttack(entry) {
    const cur = getBestTimeAttack();
    const newScore = Number(entry.score) || 0;
    const newBoards = Number(entry.boardsCleared) || 0;
    const better =
      newScore > cur.score ||
      (newScore === cur.score && newBoards > cur.boardsCleared);
    if (!better) return false;
    const key = `${PREFIX}best_timeattack`;
    try {
      localStorage.setItem(key, JSON.stringify({ score: newScore, boardsCleared: newBoards }));
      return true;
    } catch { return false; }
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

  function getVolume() {
    const key = `${PREFIX}volume`;
    const stored = localStorage.getItem(key);
    if (stored === null) return null;
    const v = parseFloat(stored);
    return isNaN(v) ? null : v;
  }

  function setVolume(volume) {
    const key = `${PREFIX}volume`;
    localStorage.setItem(key, String(volume));
  }

  // ========== 리더보드 (난이도별 TOP 10) ==========
  const LEADERBOARD_LIMIT = 10;

  function getLeaderboard(difficulty) {
    const key = `${PREFIX}leaderboard_${difficulty}`;
    try {
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  /**
   * 점수가 TOP10 안에 들어갈 수 있는 등수를 반환. 못 들면 -1.
   * 점수 내림차순, 동점이면 시간 적은 순(=빠른 클리어), 그래도 동점이면 movement 적은 순.
   */
  function calcRank(difficulty, entry) {
    const list = getLeaderboard(difficulty);
    let rank = 1;
    for (const e of list) {
      if (
        entry.score > e.score ||
        (entry.score === e.score && entry.time < e.time) ||
        (entry.score === e.score && entry.time === e.time && entry.moves < e.moves)
      ) {
        return rank;
      }
      rank++;
    }
    return rank <= LEADERBOARD_LIMIT ? rank : -1;
  }

  /**
   * entry: { name, score, time, moves }
   * 반환: 새로 들어간 등수 (1-base) 또는 -1 (TOP10 미달)
   */
  function addToLeaderboard(difficulty, entry) {
    const rank = calcRank(difficulty, entry);
    if (rank < 0) return -1;

    const list = getLeaderboard(difficulty);
    const fullEntry = {
      name: String(entry.name || '').slice(0, 12) || '익명',
      score: Number(entry.score) || 0,
      time: Number(entry.time) || 0,
      moves: Number(entry.moves) || 0,
      date: entry.date || new Date().toISOString().slice(0, 10)
    };

    list.splice(rank - 1, 0, fullEntry);
    list.length = Math.min(list.length, LEADERBOARD_LIMIT);

    const key = `${PREFIX}leaderboard_${difficulty}`;
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.warn('leaderboard save failed', e);
    }
    return rank;
  }

  return {
    saveBestScore,
    getBestScore,
    getAllBestScores,
    getBestTimeAttack,
    saveBestTimeAttack,
    isMuted,
    setMuted,
    getVolume,
    setVolume,
    getLeaderboard,
    calcRank,
    addToLeaderboard,
    LEADERBOARD_LIMIT
  };
})();
