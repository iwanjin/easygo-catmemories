const UI = (function() {
  let selectedDifficulty = 'easy';
  let selectedMode = 'classic';      // 'classic' | 'daily' | 'versus'
  let lastStartOpts = null;          // 마지막 시작 옵션 (다시하기/한번더에서 재사용)
  let comboBurstHideTimer = null;

  // 귀여운 메시지 모음 — { ko, en } 페어로 외국 어린이를 위한 영어 병기
  const messages = {
    tips: [
      { ko: '💡 같은 동물 그림 2개를 찾아보세요!', en: 'Find 2 cards with the same animal!' },
      { ko: '🧠 기억력을 사용해서 카드를 찾으세요!', en: 'Use your memory to find the cards!' },
      { ko: '⚡ 빨리하기보다 정확하게 기억해요!', en: 'Remember well, not fast!' },
      { ko: '🎯 같은 그림을 찾을 때까지 계속 해봐요!', en: 'Keep going until you match them!' }
    ],
    gameStart: [
      { ko: '🎮 게임을 시작했어요! 화이팅! 💪', en: 'Game started! You can do it!' },
      { ko: '🚀 시작했어! 열심히 해봐요! ✨', en: 'Here we go! Do your best!' },
      { ko: '🎪 재미있는 게임이 시작됐어요! 즐겨보세요! 🎉', en: 'A fun game has begun! Enjoy!' }
    ],
    encouraging: [
      { ko: '⭐ 정말 잘하고 있어요!', en: 'You are doing great!' },
      { ko: '🌟 멋진데? 계속 해봐요!', en: 'Awesome! Keep going!' },
      { ko: '💫 우와! 멋져!', en: 'Wow! So cool!' },
      { ko: '🎉 대단해! 계속 해봐요!', en: 'Amazing! Keep it up!' },
      { ko: '✨ 정말 좋아! 화이팅! 💪', en: 'Looking good! You can do it!' }
    ],
    matched: [
      { ko: '🎊 맞췄어! 대단해! 👏', en: 'Match! Amazing!' },
      { ko: '✨ 찾았어! 최고야! 🌟', en: 'Found it! The best!' },
      { ko: '🎯 맞아! 멋진데? 계속 해봐요!', en: 'Right! Keep going!' },
      { ko: '🌈 완벽해! 계속하자! 🚀', en: 'Perfect! Lets go!' }
    ],
    result: [
      { ko: '🏆 완벽했어! 최고의 실력이야! 👑', en: 'Perfect! Top skills!' },
      { ko: '🌟 정말 잘했어! 다시 해볼래? 💪', en: 'Well done! Try again?' },
      { ko: '✨ 멋져! 더 높은 점수도 가능할 것 같은데? 🚀', en: 'Awesome! Aim for a higher score!' },
      { ko: '🎉 와우! 정말 잘했어! 다시 도전해봐! 🔥', en: 'Wow! Great job! Try again!' },
      { ko: '👍 최고야! 다시 한 번 해보고 더 높은 점수를 노려봐! ⭐', en: 'The best! Try for a higher score!' }
    ]
  };

  function getRandomMessage(messageType) {
    const messageList = messages[messageType] || messages.tips;
    return messageList[Math.floor(Math.random() * messageList.length)];
  }

  function escapeForHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showTip() {
    const tipText = document.getElementById('tip-text');
    if (tipText) {
      const m = getRandomMessage('tips');
      tipText.innerHTML = `${escapeForHtml(m.ko)}<span class="en-sub">${escapeForHtml(m.en)}</span>`;
    }
  }

  // 정적/신뢰 메시지를 받아 ko/en 양쪽을 출력
  // text: string | { ko, en }
  function showGameMessage(text) {
    const messageBox = document.getElementById('game-message');
    if (messageBox) {
      if (text && typeof text === 'object' && 'ko' in text) {
        messageBox.innerHTML = `${escapeForHtml(text.ko)}<span class="en-sub">${escapeForHtml(text.en || '')}</span>`;
      } else {
        messageBox.textContent = text;
      }
      messageBox.style.animation = 'none';
      setTimeout(() => {
        messageBox.style.animation = 'messageSlideIn 0.4s ease-out';
      }, 10);
    }
  }

  function showEncouragement() {
    const encouragement = document.getElementById('encouragement');
    if (encouragement && Math.random() > 0.5) {
      const m = getRandomMessage('encouraging');
      encouragement.innerHTML = `${escapeForHtml(m.ko)}<span class="en-sub">${escapeForHtml(m.en)}</span>`;
    }
  }

  // ==================== 콤보 표시 ====================
  function showComboBurst(multiplier) {
    const burst = document.getElementById('combo-burst');
    if (!burst) return;
    burst.innerHTML = `×${multiplier}<div class="en-sub" style="font-size:0.35em;letter-spacing:0.2em;">COMBO</div>`;
    burst.classList.remove('is-bursting');
    void burst.offsetWidth; // restart animation
    burst.classList.add('is-bursting');
    if (comboBurstHideTimer) clearTimeout(comboBurstHideTimer);
    comboBurstHideTimer = setTimeout(() => {
      burst.classList.remove('is-bursting');
    }, 950);
  }

  function updateComboIndicator() {
    const ind = document.getElementById('combo-indicator');
    const num = document.getElementById('combo-mult-text');
    if (!ind || !num) return;
    const s = Game.getState();
    if (s.combo >= 2) {
      num.textContent = String(s.comboMultiplier);
      ind.classList.remove('hidden');
    } else {
      ind.classList.add('hidden');
    }
  }

  // ==================== 짝꿍 대결 점수판 ====================
  function showVersusBoard(players) {
    const board = document.getElementById('versus-board');
    if (!board || !players) return;
    board.classList.remove('hidden');
    players.forEach((p, i) => {
      const slot = board.querySelector(`.versus-player[data-player="${i}"]`);
      if (!slot) return;
      slot.querySelector('.vp-name').innerHTML =
        `${escapeForHtml(p.ko)}<span class="en-sub-inline">${escapeForHtml(p.en)}</span>`;
      slot.querySelector('.vp-matches').textContent = '0';
      slot.querySelector('.vp-score').textContent = '0';
      slot.classList.remove('is-turn');
    });
    highlightVersusTurn(0);
  }
  function hideVersusBoard() {
    const board = document.getElementById('versus-board');
    if (board) board.classList.add('hidden');
  }
  function updateVersusBoard() {
    const s = Game.getState();
    if (s.mode !== 'versus' || !s.players) return;
    const board = document.getElementById('versus-board');
    if (!board) return;
    s.players.forEach((p, i) => {
      const slot = board.querySelector(`.versus-player[data-player="${i}"]`);
      if (!slot) return;
      slot.querySelector('.vp-matches').textContent = String(p.matches);
      slot.querySelector('.vp-score').textContent = String(p.score);
    });
  }
  function highlightVersusTurn(idx) {
    document.querySelectorAll('.versus-player').forEach(el => el.classList.remove('is-turn'));
    const cur = document.querySelector(`.versus-player[data-player="${idx}"]`);
    if (cur) cur.classList.add('is-turn');
  }

  // 막누름 경고 토스트 — 1.4초 보여주고 자동 숨김
  let mashToastHideTimer = null;
  function showMashWarning() {
    const toast = document.getElementById('mash-toast');
    if (!toast) return;
    toast.innerHTML = '🐱 천천히! 신중하게 누르면 더 빨라요<span class="en-sub">Slow down! Careful taps win the race.</span>';
    toast.classList.add('is-shown');
    Sound.play('mismatch');
    if (mashToastHideTimer) clearTimeout(mashToastHideTimer);
    mashToastHideTimer = setTimeout(() => {
      toast.classList.remove('is-shown');
    }, 1400);
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

  // 헤더 값 표시 — 영어 병기 span(.en-sub-inline)을 건드리지 않도록
  // 일반 span(=값 칸)만 골라서 갱신.
  function updateScore(value) {
    document.querySelector('#score span:not(.en-sub-inline)').textContent = value;
  }

  function updateMoves(value) {
    document.querySelector('#moves span:not(.en-sub-inline)').textContent = value;
  }

  function updateTimer(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    document.querySelector('#timer span:not(.en-sub-inline)').textContent = `${mm}:${ss}`;
  }

  function setBoardClass(difficulty) {
    const board = document.getElementById('game-board');
    board.className = `grid-${difficulty}`;
  }

  /**
   * 점수 / 이상적 만점 비율로 등급 산정.
   * Firebase 글로벌 통계가 붙으면 실제 percentile로 교체할 함수.
   */
  function gradeFromScore(score, difficulty) {
    const max = Difficulty.getMaxScore(difficulty);
    const ratio = max > 0 ? score / max : 0;
    if (ratio >= 0.95) return { topPct: 5,  emoji: '👑', praise: '전설적인 기억력! 완벽에 가까워요!', praiseEn: 'Legendary memory! Almost perfect!' };
    if (ratio >= 0.85) return { topPct: 15, emoji: '🏆', praise: '대단해! 손꼽히는 실력이에요!', praiseEn: 'Amazing! Top-notch skills!' };
    if (ratio >= 0.70) return { topPct: 30, emoji: '🌟', praise: '정말 잘했어요! 머리가 반짝반짝!', praiseEn: 'Well done! Sharp brain!' };
    if (ratio >= 0.50) return { topPct: 50, emoji: '✨', praise: '잘했어요! 한 번 더 하면 더 좋은 점수!', praiseEn: 'Nice! Try once more for a better score!' };
    return { topPct: null, emoji: '🐾', praise: '끝까지 클리어한 게 멋져요! 다시 도전!', praiseEn: 'Cool that you cleared it! Try again!' };
  }

  function renderResultComment(score, difficulty, opts = {}) {
    const resultComment = document.getElementById('result-comment');
    if (!resultComment) return;
    const grade = gradeFromScore(score, difficulty);
    const topPct = opts.topPct || grade.topPct;
    const tierKo = topPct
      ? `${grade.emoji} 상위 ${topPct}% 안에 드는 점수!`
      : `${grade.emoji} 클리어 성공!`;
    const tierEn = topPct
      ? `Top ${topPct}%!`
      : 'Cleared!';
    const sourceTag = opts.fromCloud
      ? '<span class="result-source">(글로벌 기준)<span class="en-sub-inline">Global</span></span>'
      : '';
    resultComment.innerHTML = `
      <div class="result-tier">${tierKo}<span class="en-sub">${tierEn}</span> ${sourceTag}</div>
      <div class="result-praise">${grade.praise}<span class="en-sub">${grade.praiseEn}</span></div>
    `;
  }

  function showEndScreen(score, bestScore, difficulty) {
    document.getElementById('final-score').innerHTML = `🎯 최종 점수: ${score}점<span class="en-sub">Final Score: ${score}</span>`;
    document.getElementById('best-score').innerHTML = `⭐ 최고 점수: ${bestScore}점<span class="en-sub">Best Score: ${bestScore}</span>`;

    // 1차: 점수 비율로 즉시 등급 표시 (오프라인/Firebase 미설정에도 동작)
    renderResultComment(score, difficulty);

    // 2차: 글로벌 표본 percentile이 도착하면 메시지 업데이트
    if (Cloud.isReady()) {
      Cloud.getPercentile(difficulty, score).then((res) => {
        if (res && res.sampleSize >= 5) {
          renderResultComment(score, difficulty, { topPct: res.topPct, fromCloud: true });
        }
      });
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

  function showNameInputModal(rank, result, opts = {}) {
    const badge = document.getElementById('new-rank-badge');
    const stats = document.getElementById('new-rank-stats');
    const message = document.getElementById('new-rank-message');
    const input = document.getElementById('player-name-input');
    if (badge) {
      if (opts.mode === 'daily') {
        badge.innerHTML = '오늘의 챌린지<span class="en-sub-inline">Daily</span>';
      } else {
        badge.innerHTML = `${rank}위<span class="en-sub-inline">#${rank}</span>`;
      }
    }
    if (stats) {
      stats.innerHTML = `
        <span>🎯 ${result.score.toLocaleString()}점<span class="en-sub-inline">Score</span></span>
        <span>⏱ ${formatTimeStr(result.time)}<span class="en-sub-inline">Time</span></span>
        <span>🔄 ${result.moves}회<span class="en-sub-inline">Moves</span></span>
      `;
    }
    if (message) {
      const grade = gradeFromScore(result.score, result.difficulty);
      const tierKo = grade.topPct ? `상위 ${grade.topPct}% — ` : '';
      const tierEn = grade.topPct ? `Top ${grade.topPct}% — ` : '';
      message.innerHTML = `${grade.emoji} ${tierKo}${grade.praise}<span class="en-sub">${tierEn}${grade.praiseEn}</span>`;
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
    const mode = detail.mode || Game.getState().mode || 'classic';

    // === Versus 모드: 별도 결과 모달 ===
    if (mode === 'versus') {
      showVersusEndModal(detail);
      return;
    }

    const { score, time, moves } = detail;
    const difficulty = Game.getState().difficulty;
    const seed = Game.getState().seed;

    // === Daily 모드: 항상 클라우드 등록 (이름 입력 모달) ===
    if (mode === 'daily') {
      const result = { score, time, moves, difficulty, mode: 'daily', seed };
      lastResult = result;
      // 일일은 로컬 저장 안 함, TOP10 평가도 클라우드에 위임
      showNameInputModal(null, result, { mode: 'daily' });
      return;
    }

    // === Classic 모드: 기존 흐름 ===
    const best = Storage.getBestScore(difficulty);
    Storage.saveBestScore(difficulty, score);
    refreshBestScoreSummary();
    const result = { score, time, moves, difficulty, mode: 'classic' };
    lastResult = result;

    const rank = Storage.calcRank(difficulty, { score, time, moves });
    if (rank > 0) {
      showNameInputModal(rank, result);
    } else {
      showEndScreen(score, Math.max(best, score), difficulty);
    }
  }

  // ==================== Versus 결과 모달 ====================
  function showVersusEndModal(detail) {
    const banner = document.getElementById('vs-winner-banner');
    const board = document.getElementById('vs-scoreboard');
    if (banner) {
      if (detail.winnerIndex === -1) {
        banner.innerHTML = '🤝 무승부!<span class="en-sub">It\'s a tie!</span>';
      } else {
        const w = detail.players[detail.winnerIndex];
        banner.innerHTML = `🏆 ${escapeForHtml(w.ko)} 승!<span class="en-sub">${escapeForHtml(w.en)} wins!</span>`;
      }
    }
    if (board) {
      board.innerHTML = detail.players.map((p, i) => {
        const isWin = i === detail.winnerIndex;
        return `
          <div class="${isWin ? 'win' : ''}">
            <div class="vsr-name">${escapeForHtml(p.ko)}<span class="en-sub-inline">${escapeForHtml(p.en)}</span></div>
            <div class="vsr-matches">${p.matches}<span class="en-sub-inline">matches</span></div>
            <div style="font-size:0.85em;color:#888;">${p.score}<span class="en-sub-inline">pts</span></div>
          </div>
        `;
      }).join('');
    }
    Modal.open('versus-end-modal');
    Sound.play('fanfare');
  }

  // ==================== Helpers ====================
  function buildStartOpts() {
    const opts = { mode: selectedMode, difficulty: selectedDifficulty };
    if (selectedMode === 'daily') {
      opts.difficulty = 'medium';
      // 시드 = 오늘 날짜 (UTC). Cloud에 동일 함수가 있으면 그걸 사용.
      opts.seed = Cloud.todayKey ? Cloud.todayKey() : new Date().toISOString().slice(0, 10);
    }
    return opts;
  }

  function applyModeUI(mode) {
    // 모드 카드 활성 상태
    document.querySelectorAll('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    // 모드 도움말 카드 토글
    document.querySelectorAll('.mode-help-box .mh-card').forEach(c => {
      c.classList.toggle('hidden', c.dataset.mhMode !== mode);
    });
    // 일일 챌린지: 난이도 medium 고정 (다른 난이도 비활성화)
    const lockedHint = document.getElementById('difficulty-locked-hint');
    if (mode === 'daily') {
      document.querySelectorAll('.difficulty-btn').forEach(b => {
        const isMed = b.dataset.difficulty === 'medium';
        b.classList.toggle('is-disabled', !isMed);
        b.classList.toggle('active', isMed);
      });
      selectedDifficulty = 'medium';
      if (lockedHint) lockedHint.classList.remove('hidden');
    } else {
      document.querySelectorAll('.difficulty-btn').forEach(b => {
        b.classList.remove('is-disabled');
      });
      // 활성 표시는 selectedDifficulty 유지
      document.querySelectorAll('.difficulty-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.difficulty === selectedDifficulty);
      });
      if (lockedHint) lockedHint.classList.add('hidden');
    }
  }

  // 이벤트 리스너 초기화 (시작 버튼, 재시작 등)
  function bindEvents() {
    // 난이도 버튼 클릭
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.closest('.difficulty-btn');
        if (target.classList.contains('is-disabled')) return;
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

    // 모드 버튼 클릭
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.play('click');
        selectedMode = btn.dataset.mode;
        applyModeUI(selectedMode);
      });
    });
    applyModeUI(selectedMode);

    // 시작 버튼 → Game.start()
    document.getElementById('start-btn').addEventListener('click', () => {
      Sound.play('click');
      lastStartOpts = buildStartOpts();
      Game.start(lastStartOpts);
      showScreen('game');
    });

    // 재시작 → 같은 옵션으로
    document.getElementById('restart-btn').addEventListener('click', () => {
      Sound.play('click');
      Game.reset();
      Game.start(lastStartOpts || buildStartOpts());
      showGameMessage({ ko: '🎮 다시 시작했어요! 화이팅! 💪', en: 'Restarted! You can do it!' });
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

    // 한번 더 → 같은 모드/난이도로 다시 시작
    document.getElementById('play-again-btn').addEventListener('click', () => {
      Sound.play('click');
      Modal.close();
      Game.reset();
      Game.start(lastStartOpts || buildStartOpts());
      showScreen('game');
    });

    // Versus 결과 모달 — 다시 대결
    const vsAgain = document.getElementById('vs-play-again-btn');
    if (vsAgain) {
      vsAgain.addEventListener('click', () => {
        Sound.play('click');
        Modal.close();
        Game.reset();
        Game.start(lastStartOpts || { mode: 'versus', difficulty: selectedDifficulty });
        showScreen('game');
      });
    }
    // Versus 결과 모달 — 처음 화면으로
    const vsBack = document.getElementById('vs-back-btn');
    if (vsBack) {
      vsBack.addEventListener('click', () => {
        Sound.play('click');
        Modal.close();
        Game.reset();
        refreshBestScoreSummary();
        showScreen('start');
      });
    }

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
          scope: Cloud.isReady() ? 'global' : 'device',
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
        Leaderboard.open({
          difficulty: selectedDifficulty,
          scope: Cloud.isReady() ? 'global' : 'device'
        });
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
      const mode = lastResult.mode || 'classic';
      const payload = {
        mode,
        difficulty: lastResult.difficulty,
        name: finalName,
        score: lastResult.score,
        time: lastResult.time,
        moves: lastResult.moves
      };

      let localRank = -1;
      if (mode === 'classic') {
        localRank = Storage.addToLeaderboard(lastResult.difficulty, {
          name: finalName, score: lastResult.score,
          time: lastResult.time, moves: lastResult.moves
        });
      }
      // daily는 로컬에 안 남기고 글로벌만 (오늘 날짜 키 자동 부여)

      // 글로벌 — fire and forget
      Cloud.addEntry(payload);

      Modal.close();
      const diff = lastResult.difficulty;
      const wasDaily = mode === 'daily';
      lastResult = null;

      setTimeout(() => {
        const opts = {
          difficulty: diff,
          scope: wasDaily ? 'daily' : (Cloud.isReady() ? 'global' : 'device'),
          onClose: returnToStartAfterGame
        };
        if (localRank > 0) {
          opts.highlight = { scope: 'device', difficulty: diff, rank: localRank };
        }
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
      if (muteText) muteText.innerHTML = muted
        ? '꺼짐<span class="en-sub-inline">Off</span>'
        : '켜짐<span class="en-sub-inline">On</span>';
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
      // 콤보 표시
      const mult = e.detail && e.detail.multiplier ? e.detail.multiplier : 1;
      if (mult > 1) showComboBurst(mult);
      updateComboIndicator();
      // versus 점수판 갱신
      updateVersusBoard();
    });

    // 카드 미스매칭
    document.addEventListener('card:mismatched', () => {
      updateGameDisplay();
      updateComboIndicator();
    });

    // 차례 변경 (versus)
    document.addEventListener('game:turnChanged', (e) => {
      const idx = e.detail && e.detail.currentPlayerIndex;
      if (idx != null) highlightVersusTurn(idx);
    });

    // 게임 시작 — 콤보/versus UI 초기화
    document.addEventListener('game:started', (e) => {
      const mode = e.detail && e.detail.mode;
      const ind = document.getElementById('combo-indicator');
      if (ind) ind.classList.add('hidden');
      const burst = document.getElementById('combo-burst');
      if (burst) burst.classList.remove('is-bursting');
      if (mode === 'versus') {
        const s = Game.getState();
        showVersusBoard(s.players);
      } else {
        hideVersusBoard();
      }
    });

    // 게임 우승 시
    document.addEventListener('game:won', (e) => {
      handleGameWon(e.detail);
    });

    // 막누름 경고
    document.addEventListener('game:mashWarning', () => {
      showMashWarning();
    });

    // 타이머 업데이트 (1초마다)
    setInterval(updateGameDisplay, 1000);
  }

  return { showScreen, updateScore, updateMoves, updateTimer,
           setBoardClass, showEndScreen, bindEvents, subscribeToGameEvents,
           bindSoundSettings, bindLeaderboard, refreshBestScoreSummary };
})();
