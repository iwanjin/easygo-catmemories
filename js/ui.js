const UI = (function() {
  let selectedDifficulty = 'medium';

  function showScreen(name) {
    // 'start' | 'game' | 'end'
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(`${name}-screen`).classList.remove('hidden');
  }

  function updateScore(value) {
    document.querySelector('#score span').textContent = value;
  }

  function updateMoves(value) {
    document.querySelector('#moves span').textContent = value;
  }

  function updateTimer(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    document.querySelector('#timer span').textContent = `${mm}:${ss}`;
  }

  function setBoardClass(difficulty) {
    const board = document.getElementById('game-board');
    board.className = `grid-${difficulty}`;
  }

  function showEndScreen(score, bestScore) {
    document.getElementById('final-score').textContent = `최종 점수: ${score}`;
    document.getElementById('best-score').textContent = `최고 점수: ${bestScore}`;
    showScreen('end');
  }

  // 이벤트 리스너 초기화 (시작 버튼, 재시작 등)
  function bindEvents() {
    // 난이도 버튼 클릭
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        selectedDifficulty = e.target.dataset.difficulty;
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // 시작 버튼 → Game.start()
    document.getElementById('start-btn').addEventListener('click', () => {
      Game.start(selectedDifficulty);
      showScreen('game');
    });

    // 재시작 → Game.reset() + start()
    document.getElementById('restart-btn').addEventListener('click', () => {
      Game.reset();
      Game.start(selectedDifficulty);
    });

    // 한번 더 → 시작 화면으로
    document.getElementById('play-again-btn').addEventListener('click', () => {
      showScreen('start');
    });
  }

  // 커스텀 이벤트 구독
  function subscribeToGameEvents() {
    document.addEventListener('game:won', (e) => {
      const { score } = e.detail;
      const best = Storage.getBestScore(Game.getState().difficulty);
      showEndScreen(score, best);
    });
  }

  return { showScreen, updateScore, updateMoves, updateTimer,
           setBoardClass, showEndScreen, bindEvents, subscribeToGameEvents };
})();
