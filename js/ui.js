const UI = (function() {
  let selectedDifficulty = 'medium';

  // 귀여운 메시지 모음
  const messages = {
    tips: [
      '💡 같은 동물 그림 2개를 찾아보세요!',
      '🧠 기억력을 사용해서 카드를 찾으세요!',
      '⚡ 빨리하기보다 정확하게 기억해요!',
      '🎯 같은 그림을 찾을 때까지 계속 해봐요!'
    ],
    gameStart: [
      '🎮 게임을 시작했어요! 화이팅! 💪',
      '🚀 시작했어! 열심히 해봐요! ✨',
      '🎪 재미있는 게임이 시작됐어요! 즐겨보세요! 🎉'
    ],
    encouraging: [
      '⭐ 정말 잘하고 있어요!',
      '🌟 멋진데? 계속 해봐요!',
      '💫 우와! 멋져!',
      '🎉 대단해! 계속 해봐요!',
      '✨ 정말 좋아! 화이팅! 💪'
    ],
    matched: [
      '🎊 맞췄어! 대단해! 👏',
      '✨ 찾았어! 최고야! 🌟',
      '🎯 맞아! 멋진데? 계속 해봐요!',
      '🌈 완벽해! 계속하자! 🚀'
    ],
    result: [
      '🏆 완벽했어! 최고의 실력이야! 👑',
      '🌟 정말 잘했어! 다시 해볼래? 💪',
      '✨ 멋져! 더 높은 점수도 가능할 것 같은데? 🚀',
      '🎉 와우! 정말 잘했어! 다시 도전해봐! 🔥',
      '👍 최고야! 다시 한 번 해보고 더 높은 점수를 노려봐! ⭐'
    ]
  };

  function getRandomMessage(messageType) {
    const messageList = messages[messageType] || messages.tips;
    return messageList[Math.floor(Math.random() * messageList.length)];
  }

  function showTip() {
    const tipText = document.getElementById('tip-text');
    if (tipText) {
      tipText.textContent = getRandomMessage('tips');
    }
  }

  function showGameMessage(text) {
    const messageBox = document.getElementById('game-message');
    if (messageBox) {
      messageBox.textContent = text;
      messageBox.style.animation = 'none';
      setTimeout(() => {
        messageBox.style.animation = 'messageSlideIn 0.4s ease-out';
      }, 10);
    }
  }

  function showEncouragement() {
    const encouragement = document.getElementById('encouragement');
    if (encouragement && Math.random() > 0.5) {
      encouragement.textContent = getRandomMessage('encouraging');
    }
  }

  function showScreen(name) {
    // 'start' | 'game' | 'end'
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(`${name}-screen`).classList.remove('hidden');

    if (name === 'start') {
      showTip();
      setTimeout(showTip, 5000);
    } else if (name === 'game') {
      showGameMessage(getRandomMessage('gameStart'));
    }
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
    document.getElementById('final-score').textContent = `🎯 최종 점수: ${score}점`;
    document.getElementById('best-score').textContent = `⭐ 최고 점수: ${bestScore}점`;

    const resultComment = document.getElementById('result-comment');
    if (resultComment) {
      resultComment.textContent = getRandomMessage('result');
    }

    showScreen('end');
  }

  // 이벤트 리스너 초기화 (시작 버튼, 재시작 등)
  function bindEvents() {
    // 난이도 버튼 클릭
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.closest('.difficulty-btn');
        selectedDifficulty = target.dataset.difficulty;
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        target.classList.add('active');
      });

      // 호버 팁
      btn.addEventListener('mouseenter', () => {
        showTip();
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
      showGameMessage('🎮 다시 시작했어요! 화이팅! 💪');
    });

    // 한번 더 → 시작 화면으로
    document.getElementById('play-again-btn').addEventListener('click', () => {
      showScreen('start');
    });
  }

  // 커스텀 이벤트 구독
  function subscribeToGameEvents() {
    // 게임 상태 업데이트 함수
    function updateGameDisplay() {
      const state = Game.getState();
      updateScore(state.score);
      updateMoves(state.moves);
      updateTimer(state.time);
    }

    // 카드 뒤집기
    document.addEventListener('card:flipped', () => {
      updateGameDisplay();
    });

    // 카드 매칭 성공
    document.addEventListener('card:matched', (e) => {
      updateGameDisplay();
      showGameMessage(getRandomMessage('matched'));
      showEncouragement();
    });

    // 카드 미스매칭
    document.addEventListener('card:mismatched', () => {
      updateGameDisplay();
    });

    // 게임 우승 시
    document.addEventListener('game:won', (e) => {
      const { score } = e.detail;
      const best = Storage.getBestScore(Game.getState().difficulty);
      showEndScreen(score, best);
    });

    // 타이머 업데이트 (1초마다)
    setInterval(updateGameDisplay, 1000);
  }

  return { showScreen, updateScore, updateMoves, updateTimer,
           setBoardClass, showEndScreen, bindEvents, subscribeToGameEvents };
})();
