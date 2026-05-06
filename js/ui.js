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
    const s = (typeof Game !== 'undefined' && Game.getState) ? Game.getState() : {};
    let display = seconds;
    // timeattack 모드: 남은 시간 표시
    if (s.timeLimit && s.timeLimit > 0) {
      display = Math.max(0, s.timeLimit - seconds);
    }
    const mm = String(Math.floor(display / 60)).padStart(2, '0');
    const ss = String(display % 60).padStart(2, '0');
    const timer = document.getElementById('timer');
    timer.querySelector('span:not(.en-sub-inline)').textContent = `${mm}:${ss}`;
    // 마지막 10초 빨강 강조
    const urgent = (s.timeLimit && s.timeLimit > 0 && display <= 10);
    timer.classList.toggle('timer-urgent', !!urgent);
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
    // 클래식 — 난이도 3종
    const all = Storage.getAllBestScores();
    ['easy', 'medium', 'hard'].forEach((d) => {
      const el = document.getElementById(`best-summary-${d}`);
      if (el) {
        el.textContent = (all[d] || 0).toLocaleString();
      }
    });
    // 타임어택 — 점수 + 보드수
    const ta = Storage.getBestTimeAttack ? Storage.getBestTimeAttack() : { score: 0, boardsCleared: 0 };
    const taScore = document.getElementById('best-summary-ta-score');
    const taBoards = document.getElementById('best-summary-ta-boards');
    if (taScore) taScore.textContent = (ta.score || 0).toLocaleString();
    if (taBoards) taBoards.textContent = (ta.boardsCleared || 0).toLocaleString();
  }

  // 짝꿍 대결 모드: 친구 명언 (한국어 메인 + 영어 병기 + 출처).
  // 영어 명언은 한국어 번역, 한국 명언은 영어 번역으로 페어 구성. 모두 긍정적·어린이 친화.
  const FRIEND_QUOTES = [
    { ko: '친구는 두 몸에 깃든 하나의 영혼이다.',
      en: 'A friend is one soul dwelling in two bodies.',
      by: '아리스토텔레스 / Aristotle' },
    { ko: '친구가 있으면 기쁨은 두 배가 되고 슬픔은 반이 된다.',
      en: 'Friendship doubles our joy and divides our grief.',
      by: '프랜시스 베이컨 / Francis Bacon' },
    { ko: '어둠 속에서 친구와 걷는 것이 빛 속에서 혼자 걷는 것보다 좋다.',
      en: 'Walking with a friend in the dark is better than walking alone in the light.',
      by: '헬렌 켈러 / Helen Keller' },
    { ko: '진정한 친구는 모든 걸 알고도 여전히 너를 좋아해 주는 사람이다.',
      en: 'A friend is one who knows all about you and still loves you.',
      by: '엘버트 허버드 / Elbert Hubbard' },
    { ko: '좋은 친구는 별과 같아요 — 항상 보이진 않아도 늘 그 자리에 있어요.',
      en: "Good friends are like stars — you don't always see them, but you know they're always there.",
      by: '' },
    { ko: '함께 웃을 수 있는 친구는 인생의 가장 큰 선물이에요.',
      en: 'A friend who makes you laugh is the greatest gift of life.',
      by: '' },
    { ko: '진짜 친구는 마음으로 듣고, 침묵까지 이해해 줘요.',
      en: 'A true friend listens with the heart and understands the silence.',
      by: '' },
    { ko: '좋은 친구가 함께라면 어떤 길도 멀지 않아요.',
      en: 'No road is long with good company.',
      by: '튀르키예 속담 / Turkish proverb' },
    { ko: '친구의 미소 하나가 하루 전체를 환하게 만들어요.',
      en: 'One smile from a friend can brighten a whole day.',
      by: '' },
    { ko: '같이 놀고 같이 웃으면 우정은 더 단단해져요.',
      en: 'Playing and laughing together makes friendships stronger.',
      by: '' },
  ];

  function renderVersusQuote() {
    const el = document.getElementById('bss-versus-quote');
    if (!el) return;
    const q = FRIEND_QUOTES[Math.floor(Math.random() * FRIEND_QUOTES.length)];
    const byHtml = q.by
      ? `<footer class="bss-quote-by">— ${escapeForHtml(q.by)}</footer>`
      : '';
    el.innerHTML = `
      <p class="bss-quote-ko">"${escapeForHtml(q.ko)}"</p>
      <p class="bss-quote-en">"${escapeForHtml(q.en)}"</p>
      ${byHtml}
    `;
  }

  // 시작 화면 일일 TOP1 위젯 — 실시간 구독으로 다른 사람 등록 시 자동 갱신.
  let _dailyTopUnsub = null;

  function renderDailyTopCard(state, top) {
    const el = document.getElementById('bss-daily-top');
    if (!el) return;
    if (state === 'loading') {
      el.innerHTML = '<p class="bss-info-msg">⏳ 불러오는 중...<span class="en-sub">Loading...</span></p>';
      return;
    }
    if (state === 'cloud-off') {
      el.innerHTML = '<p class="bss-info-msg">☁️ 글로벌 리더보드 준비 중이에요.<span class="en-sub">Cloud not ready yet.</span></p>';
      return;
    }
    if (state === 'empty') {
      el.innerHTML = `
        <button type="button" class="bss-daily-empty-cta" id="bss-daily-cta">
          📅 오늘 첫 도전자가 되어보세요!<span class="en-sub">Be today's first challenger!</span>
        </button>
      `;
      const cta = document.getElementById('bss-daily-cta');
      if (cta) {
        cta.addEventListener('click', () => {
          Sound.play('click');
          selectedMode = 'daily';
          applyModeUI('daily');
          // 게임 즉시 시작
          lastStartOpts = buildStartOpts();
          if (Game.reset) Game.reset();
          Game.start(lastStartOpts);
          showScreen('game');
        });
      }
      return;
    }
    if (state === 'ok' && top) {
      const flag = (Leaderboard && Leaderboard.countryToFlag) ? Leaderboard.countryToFlag(top.country) : '🇰🇷';
      const flagLabel = (top.country || 'KR').toUpperCase();
      const rawName = top.name || '익명';
      const displayName = rawName.trim() && rawName !== '익명'
        ? escapeForHtml(rawName)
        : '익명<span class="en-sub-inline">Anonymous</span>';
      el.innerHTML = `
        <div class="bss-daily-card">
          <div class="bss-daily-rank">🥇</div>
          <div class="bss-daily-name"><span class="lb-flag" aria-label="${flagLabel}" title="${flagLabel}">${flag}</span>${displayName}</div>
          <div class="bss-daily-score">${(top.score || 0).toLocaleString()}<span class="bsc-unit">점</span><span class="en-sub-inline">pts</span></div>
        </div>
      `;
      return;
    }
  }

  async function subscribeDailyTopWidget() {
    renderDailyTopCard('loading');
    if (!Cloud.isReady || !Cloud.isReady()) {
      renderDailyTopCard('cloud-off');
      return;
    }
    if (_dailyTopUnsub) {
      try { _dailyTopUnsub(); } catch {}
      _dailyTopUnsub = null;
    }
    _dailyTopUnsub = await Cloud.subscribeDailyTop(1, (list) => {
      if (!list || list.length === 0) {
        renderDailyTopCard('empty');
      } else {
        renderDailyTopCard('ok', list[0]);
      }
    });
  }

  // 모드 전환 시 best-score 패널 뷰 토글.
  // wrap은 그리드 스택이라 항상 같은 높이(클래식 기준) 유지 — 모드 카드 이하
  // 위치가 흔들리지 않음. 비활성 뷰는 visibility로만 숨겨 셀 크기 보존.
  function applyBestScoreView(mode) {
    document.querySelectorAll('.bss-mode-view').forEach((view) => {
      view.classList.toggle('is-hidden', view.dataset.bssMode !== mode);
    });
    // versus 모드 — 클릭마다 새 명언 랜덤 표시
    if (mode === 'versus') renderVersusQuote();
  }

  function showNameInputModal(rank, result, opts = {}) {
    const badge = document.getElementById('new-rank-badge');
    const stats = document.getElementById('new-rank-stats');
    const message = document.getElementById('new-rank-message');
    const input = document.getElementById('player-name-input');
    if (badge) {
      if (opts.mode === 'daily') {
        badge.innerHTML = '오늘의 챌린지<span class="en-sub-inline">Daily</span>';
      } else if (opts.mode === 'timeattack') {
        badge.innerHTML = '타임어택<span class="en-sub-inline">Time Attack</span>';
      } else {
        badge.innerHTML = `${rank}위<span class="en-sub-inline">#${rank}</span>`;
      }
    }
    if (stats) {
      if (opts.mode === 'timeattack') {
        const boards = result.boardsCleared || 0;
        stats.innerHTML = `
          <span>🎯 ${result.score.toLocaleString()}점<span class="en-sub-inline">Score</span></span>
          <span>🟩 ${boards}판<span class="en-sub-inline">Boards</span></span>
          <span>🔄 ${result.moves}회<span class="en-sub-inline">Moves</span></span>
        `;
      } else {
        stats.innerHTML = `
          <span>🎯 ${result.score.toLocaleString()}점<span class="en-sub-inline">Score</span></span>
          <span>⏱ ${formatTimeStr(result.time)}<span class="en-sub-inline">Time</span></span>
          <span>🔄 ${result.moves}회<span class="en-sub-inline">Moves</span></span>
        `;
      }
    }
    if (message) {
      if (opts.mode === 'timeattack') {
        const boards = result.boardsCleared || 0;
        const ko = boards >= 3 ? '엄청난 집중력! 글로벌 순위에 등록해요!'
                 : boards >= 1 ? '잘했어요! 점수를 글로벌 순위에 남겨봐요!'
                 : '도전 완료! 이름을 남기면 다음에 더 잘 할 수 있어요!';
        const en = boards >= 3 ? 'Incredible focus! Submit to global ranking!'
                 : boards >= 1 ? 'Great run! Submit to global ranking!'
                 : 'Round complete! Sign in for next time!';
        message.innerHTML = `⚡ ${ko}<span class="en-sub">${en}</span>`;
      } else {
        const grade = gradeFromScore(result.score, result.difficulty);
        const tierKo = grade.topPct ? `상위 ${grade.topPct}% — ` : '';
        const tierEn = grade.topPct ? `Top ${grade.topPct}% — ` : '';
        message.innerHTML = `${grade.emoji} ${tierKo}${grade.praise}<span class="en-sub">${tierEn}${grade.praiseEn}</span>`;
      }
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

    // === TimeAttack 모드: 항상 글로벌 등록 + 로컬 최고 기록 갱신 ===
    if (mode === 'timeattack') {
      const boards = detail.boardsCleared || 0;
      const result = {
        score, time, moves, difficulty, mode: 'timeattack',
        boardsCleared: boards
      };
      lastResult = result;
      // 로컬 최고 기록 갱신 — 메인 화면 패널 표시용
      if (Storage.saveBestTimeAttack) {
        Storage.saveBestTimeAttack({ score, boardsCleared: boards });
        refreshBestScoreSummary();
      }
      showNameInputModal(null, result, { mode: 'timeattack' });
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
      // 시드 = 오늘 날짜 (KST). Cloud에 동일 함수가 있으면 그걸 사용.
      opts.seed = Cloud.todayKey ? Cloud.todayKey() : new Date().toISOString().slice(0, 10);
    } else if (selectedMode === 'timeattack') {
      opts.difficulty = 'medium';
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
    // 모드별 best-score 패널 뷰 토글 + 값 갱신
    applyBestScoreView(mode);
    refreshBestScoreSummary();
    // 일일/타임어택: 난이도 medium 고정 (다른 난이도 비활성화)
    const lockedHint = document.getElementById('difficulty-locked-hint');
    const fixedToMedium = (mode === 'daily' || mode === 'timeattack');
    if (fixedToMedium) {
      document.querySelectorAll('.difficulty-btn').forEach(b => {
        const isMed = b.dataset.difficulty === 'medium';
        b.classList.toggle('is-disabled', !isMed);
        b.classList.toggle('active', isMed);
      });
      selectedDifficulty = 'medium';
      if (lockedHint) {
        lockedHint.classList.remove('hidden');
        lockedHint.innerHTML = (mode === 'daily')
          ? '오늘의 챌린지는 보통 난이도로 고정이에요.<span class="en-sub">Daily Challenge is fixed at Medium.</span>'
          : '타임어택은 보통 난이도로 고정이에요.<span class="en-sub">Time Attack is fixed at Medium.</span>';
      }
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
    // versus 뷰가 hidden이라도 첫 명언을 미리 렌더해 첫 클릭 시 깜빡임 방지
    renderVersusQuote();

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
      if (mode === 'timeattack') {
        payload.boardsCleared = lastResult.boardsCleared || 0;
      }

      let localRank = -1;
      if (mode === 'classic') {
        localRank = Storage.addToLeaderboard(lastResult.difficulty, {
          name: finalName, score: lastResult.score,
          time: lastResult.time, moves: lastResult.moves
        });
      }
      // daily/timeattack는 로컬에 안 남기고 글로벌만

      // 글로벌 — fire and forget
      Cloud.addEntry(payload);

      Modal.close();
      const diff = lastResult.difficulty;
      const submittedMode = mode;
      lastResult = null;

      setTimeout(() => {
        const opts = {
          difficulty: diff,
          scope:
            submittedMode === 'daily' ? 'daily' :
            submittedMode === 'timeattack' ? 'timeattack' :
            (Cloud.isReady() ? 'global' : 'device'),
          onClose: returnToStartAfterGame
        };
        if (localRank > 0) {
          opts.highlight = { scope: 'device', difficulty: diff, rank: localRank };
        }
        Leaderboard.open(opts);
      }, 280);
    }

    function showNameError(show) {
      const err = document.getElementById('name-input-error');
      if (!err) return;
      if (show) {
        err.innerHTML = '🚫 금지된 단어가 사용되었습니다. 다른 이름을 입력해주세요.<span class="en-sub">Inappropriate word detected. Please use a different name.</span>';
        err.classList.remove('hidden');
        if (input) {
          input.classList.add('input-error');
          input.focus();
          input.select();
        }
      } else {
        err.classList.add('hidden');
        err.innerHTML = '';
        if (input) input.classList.remove('input-error');
      }
    }

    if (input) {
      // 사용자가 다시 입력하기 시작하면 에러 메시지 자동 해제
      input.addEventListener('input', () => showNameError(false));
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = input ? input.value : '';
        if (typeof Profanity !== 'undefined' && Profanity.isProfane && Profanity.isProfane(raw)) {
          showNameError(true);
          Sound.play('mismatch'); // 거부 피드백
          return;
        }
        Sound.play('match'); // 저장 효과음
        showNameError(false);
        commitName(raw);
      });
    }
    if (skip) {
      skip.addEventListener('click', () => {
        Sound.play('click');
        showNameError(false);
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

    // 보드 클리어 (timeattack) — +500 보너스 안내
    document.addEventListener('game:boardCleared', (e) => {
      const n = (e.detail && e.detail.boardsCleared) || 0;
      const bonus = (e.detail && e.detail.bonus) || 0;
      showGameMessage({
        ko: `🎉 보드 클리어! +${bonus} 보너스 (${n}판째)`,
        en: `Board cleared! +${bonus} bonus (round ${n})`
      });
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
           bindSoundSettings, bindLeaderboard, refreshBestScoreSummary,
           subscribeDailyTopWidget };
})();
