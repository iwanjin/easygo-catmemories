const UI = (function() {
  let selectedDifficulty = 'easy';

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
    // 'start' | 'game' (end는 모달로 변경됨)
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`${name}-screen`);
    if (target) target.classList.remove('hidden');

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

    // 게임 화면을 유지한 채 모달로 띄움 (팝업 효과)
    Modal.open('end-modal');
  }

  // 마지막 게임 결과를 보관 (TOP10 진입 시 이름 입력 → 저장에 사용)
  let lastResult = null;

  function formatTimeStr(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function refreshBestScoreSummary() {
    const all = Storage.getAllBestScores();
    ['easy', 'medium', 'hard'].forEach((d) => {
      const el = document.getElementById(`best-summary-${d}`);
      if (el) {
        el.textContent = (all[d] || 0).toLocaleString();
      }
    });
  }

  function showNameInputModal(rank, result) {
    const badge = document.getElementById('new-rank-badge');
    const stats = document.getElementById('new-rank-stats');
    const input = document.getElementById('player-name-input');
    if (badge) badge.textContent = `${rank}위`;
    if (stats) {
      stats.innerHTML = `
        <span>🎯 ${result.score.toLocaleString()}점</span>
        <span>⏱ ${formatTimeStr(result.time)}</span>
        <span>🔄 ${result.moves}회</span>
      `;
    }
    if (input) {
      input.value = '';
    }
    Modal.open('name-input-modal');
    if (input) {
      setTimeout(() => input.focus(), 80);
    }
    // 팡파레!
    Sound.play('fanfare');
  }

  function handleGameWon(detail) {
    const { score, time, moves } = detail;
    const difficulty = Game.getState().difficulty;
    const best = Storage.getBestScore(difficulty);
    Storage.saveBestScore(difficulty, score);
    refreshBestScoreSummary();

    const result = { score, time, moves, difficulty };
    lastResult = result;

    // TOP10 진입 여부 평가 (이름은 아직 모름)
    const rank = Storage.calcRank(difficulty, { score, time, moves });
    if (rank > 0) {
      // 진입! 이름 입력 모달로 직진 (end-modal 건너뜀)
      showNameInputModal(rank, result);
    } else {
      // 일반 종료 모달
      showEndScreen(score, Math.max(best, score));
    }
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

    // 기본 선택된 난이도(easy) 시각적 표시
    const defaultBtn = document.querySelector(`.difficulty-btn[data-difficulty="${selectedDifficulty}"]`);
    if (defaultBtn) defaultBtn.classList.add('active');

    // 시작 버튼 → Game.start()
    document.getElementById('start-btn').addEventListener('click', () => {
      Sound.play('click');
      Game.start(selectedDifficulty);
      showScreen('game');
    });

    // 재시작 → Game.reset() + start()
    document.getElementById('restart-btn').addEventListener('click', () => {
      Sound.play('click');
      Game.reset();
      Game.start(selectedDifficulty);
      showGameMessage('🎮 다시 시작했어요! 화이팅! 💪');
    });

    // 일시정지
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        Sound.play('click');
        Game.pause();
        Modal.open('pause-modal');
      });
    }

    // 계속하기 (일시정지 모달)
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        Sound.play('click');
        Modal.close();
        Game.resume();
      });
    }

    // 처음으로 (일시정지 모달)
    const quitBtn = document.getElementById('quit-btn');
    if (quitBtn) {
      quitBtn.addEventListener('click', () => {
        Sound.play('click');
        Modal.close();
        Game.reset();
        showScreen('start');
      });
    }

    // 한번 더 → 같은 난이도로 다시 시작
    document.getElementById('play-again-btn').addEventListener('click', () => {
      Sound.play('click');
      Modal.close();
      Game.reset();
      Game.start(selectedDifficulty);
      showScreen('game');
    });

    // 처음 화면으로 (종료 모달)
    const backToStartBtn = document.getElementById('back-to-start-btn');
    if (backToStartBtn) {
      backToStartBtn.addEventListener('click', () => {
        Sound.play('click');
        Modal.close();
        Game.reset();
        refreshBestScoreSummary();
        showScreen('start');
      });
    }

    // 종료 모달의 "🏆 순위 보기" 버튼
    const showLb = document.getElementById('show-leaderboard-btn');
    if (showLb) {
      showLb.addEventListener('click', () => {
        Sound.play('click');
        Modal.close();
        const diff = (lastResult && lastResult.difficulty) || Game.getState().difficulty || 'easy';
        // 약간의 텀을 두고 리더보드 모달 (모달 전환 애니메이션 안 깨지게)
        setTimeout(() => Leaderboard.open({
          difficulty: diff,
          onClose: returnToStartAfterGame
        }), 280);
      });
    }
  }

  // 게임 종료 흐름 끝나면 시작 화면으로 복귀
  function returnToStartAfterGame() {
    Game.reset();
    refreshBestScoreSummary();
    showScreen('start');
  }

  // 리더보드/이름입력 관련 바인딩
  function bindLeaderboard() {
    Leaderboard.bind();

    // 시작 화면의 "명예의 전당 보기"
    const openBtn = document.getElementById('open-leaderboard-btn');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        Sound.play('click');
        Leaderboard.open({ difficulty: selectedDifficulty });
      });
    }

    // 이름 입력 폼
    const form = document.getElementById('name-input-form');
    const skip = document.getElementById('skip-name-btn');
    const input = document.getElementById('player-name-input');

    function commitName(name) {
      if (!lastResult) {
        Modal.close();
        return;
      }
      const finalName = (name || '').trim() || '익명';
      const r = Storage.addToLeaderboard(lastResult.difficulty, {
        name: finalName,
        score: lastResult.score,
        time: lastResult.time,
        moves: lastResult.moves
      });
      Modal.close();
      const diff = lastResult.difficulty;
      lastResult = null;
      setTimeout(() => {
        const opts = { difficulty: diff, onClose: returnToStartAfterGame };
        if (r > 0) opts.highlight = { difficulty: diff, rank: r };
        Leaderboard.open(opts);
      }, 280);
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        Sound.play('match'); // 저장 효과음
        commitName(input ? input.value : '');
      });
    }
    if (skip) {
      skip.addEventListener('click', () => {
        Sound.play('click');
        commitName('익명');
      });
    }
  }

  // 음향 설정 관련 바인딩 (별도 함수로 분리 — DOM 준비 후 호출)
  function bindSoundSettings() {
    const settingsBtn = document.getElementById('sound-settings-btn');
    const soundIcon = document.getElementById('sound-icon');
    const muteToggle = document.getElementById('mute-toggle');
    const muteIcon = document.getElementById('mute-icon');
    const muteText = muteToggle ? muteToggle.querySelector('.toggle-text') : null;
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');
    const okBtn = document.getElementById('sound-modal-ok');

    function refreshUI() {
      const muted = Sound.isMuted();
      const vol = Sound.getVolume();
      if (soundIcon) soundIcon.textContent = muted ? '🔇' : '🔊';
      if (muteIcon) muteIcon.textContent = muted ? '🔇' : '🔊';
      if (muteToggle) {
        muteToggle.setAttribute('aria-pressed', String(muted));
        muteToggle.classList.toggle('is-off', muted);
      }
      if (muteText) muteText.textContent = muted ? '꺼짐' : '켜짐';
      if (volumeSlider) volumeSlider.value = String(Math.round(vol * 100));
      if (volumeValue) volumeValue.textContent = String(Math.round(vol * 100));
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        refreshUI();
        Modal.open('sound-modal');
      });
    }

    if (muteToggle) {
      muteToggle.addEventListener('click', () => {
        Sound.toggleMute();
        refreshUI();
        if (!Sound.isMuted()) Sound.play('click');
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const v = Number(e.target.value) / 100;
        Sound.setVolume(v);
        if (volumeValue) volumeValue.textContent = String(Math.round(v * 100));
      });
      // 슬라이더 떼는 순간에만 테스트 톤
      volumeSlider.addEventListener('change', () => {
        if (!Sound.isMuted()) Sound.play('flip');
      });
    }

    // 소리 테스트 버튼
    document.querySelectorAll('.test-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.test;
        Sound.play(type);
      });
    });

    if (okBtn) {
      okBtn.addEventListener('click', () => {
        Sound.play('click');
        Modal.close();
      });
    }

    refreshUI();
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
      handleGameWon(e.detail);
    });

    // 타이머 업데이트 (1초마다)
    setInterval(updateGameDisplay, 1000);
  }

  return { showScreen, updateScore, updateMoves, updateTimer,
           setBoardClass, showEndScreen, bindEvents, subscribeToGameEvents,
           bindSoundSettings, bindLeaderboard, refreshBestScoreSummary };
})();
