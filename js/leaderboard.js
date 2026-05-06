/**
 * Leaderboard Module - 명예의 전당 (TOP 10)
 *
 * 단일 책임: 리더보드 모달 렌더링과 탭 전환.
 * 데이터 소스 두 가지:
 *   - global: Cloud(Firestore) — 모든 디바이스 통합
 *   - device: Storage(localStorage) — 이 기기에서만
 *
 * 모달 열기/닫기는 Modal 모듈에 위임.
 */
const Leaderboard = (function () {
  let currentDifficulty = 'easy';
  let currentScope = 'global'; // 'global' | 'daily' | 'device'
  let highlightEntry = null;   // { scope, difficulty, rank }
  let onCloseCallback = null;
  let renderToken = 0;         // 비동기 race-condition 방지

  // 실시간 구독 상태
  let activeUnsub = null;       // 현재 활성 onSnapshot 해제 함수
  let knownIds = new Set();     // 이미 본 doc id (새 항목 강조용)
  let isFirstSnapshot = true;   // 첫 스냅샷에선 강조 안 함

  function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function rankIcon(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}<span class="en-sub-inline">#${rank}</span>`;
  }

  // ISO 3166-1 alpha-2 → Unicode flag emoji.
  // 알 수 없거나 빈 값이면 한국이 타깃 사용자라 태극기로 폴백.
  function countryToFlag(cc) {
    if (!cc || !/^[A-Za-z]{2}$/.test(cc)) {
      return String.fromCodePoint(0x1F1F0, 0x1F1F7); // 🇰🇷
    }
    const upper = cc.toUpperCase();
    return String.fromCodePoint(
      0x1F1E6 + upper.charCodeAt(0) - 65,
      0x1F1E6 + upper.charCodeAt(1) - 65
    );
  }

  // IPv4 → "A.B.*.*" 형식. IPv6/알 수 없으면 빈 문자열.
  function maskIp(ip) {
    if (!ip || typeof ip !== 'string') return '';
    const v4 = /^(\d{1,3}\.\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(ip);
    if (v4) return `${v4[1]}.*.*`;
    // IPv6: 첫 그룹만 노출
    if (ip.includes(':')) {
      const head = ip.split(':')[0];
      return head ? `${head}:*:*:*` : '';
    }
    return '';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setVisibility(id, show) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !show);
  }

  function renderDailyNotice(show) {
    const el = document.getElementById('leaderboard-daily-notice');
    if (!el) return;
    if (!show) {
      el.classList.add('hidden');
      el.innerHTML = '';
      return;
    }
    const info = (Cloud.getDailyResetInfo && Cloud.getDailyResetInfo()) || null;
    let koText, enText;
    if (!info || info.isKST) {
      koText = '📅 매일 자정(00:00 KST)에 새 보드와 순위로 초기화돼요';
      enText = 'Resets daily at midnight (00:00 KST)';
    } else {
      koText = `📅 매일 한국 자정(00:00 KST) 기준 초기화 — 현재 시간대 기준 ${info.koLocal}`;
      enText = `Resets at midnight KST — that's ${info.enLocal} in your local time`;
    }
    el.innerHTML = `${koText}<span class="en-sub">${enText}</span>`;
    el.classList.remove('hidden');
  }

  function renderRows(list) {
    const ol = document.getElementById('leaderboard-list');
    if (!ol) return;
    ol.innerHTML = '';

    // 첫 스냅샷: 모든 id를 알려진 상태로 등록 (강조 안 함)
    // 이후 스냅샷: list에 있지만 knownIds에 없는 id는 새 항목 → 강조
    list.forEach((entry, idx) => {
      const rank = idx + 1;
      const li = document.createElement('li');
      li.className = 'lb-row';

      const isNewArrival = entry.id && !isFirstSnapshot && !knownIds.has(entry.id);

      if (
        highlightEntry &&
        highlightEntry.scope === currentScope &&
        highlightEntry.difficulty === currentDifficulty &&
        highlightEntry.rank === rank
      ) {
        li.classList.add('lb-row-new');
      } else if (isNewArrival) {
        // 실시간으로 들어온 신규 항목 — 살짝 강조
        li.classList.add('lb-row-fresh');
      }

      if (entry.isMe) li.classList.add('lb-row-me');

      const meBadge = entry.isMe ? '<span class="lb-me-badge">나<span class="en-sub-inline">Me</span></span>' : '';
      const rawName = entry.name || '';
      const displayName = rawName.trim() && rawName !== '익명'
        ? escapeHtml(rawName)
        : `${escapeHtml('익명')}<span class="en-sub-inline">Anonymous</span>`;
      const flag = countryToFlag(entry.country);
      const flagLabel = (entry.country || 'KR').toUpperCase();
      const ipMasked = maskIp(entry.ip);
      const ipHtml = ipMasked ? `<span class="lb-ip">${escapeHtml(ipMasked)}</span>` : '';
      const metaHtml = (currentScope === 'timeattack')
        ? `🟩 ${entry.boardsCleared || 0}판<span class="en-sub-inline">boards</span> · 🎯 ${entry.moves}회<span class="en-sub-inline">moves</span>`
        : `⏱ ${formatTime(entry.time)} · 🎯 ${entry.moves}회<span class="en-sub-inline">moves</span>`;
      li.innerHTML = `
        <span class="lb-rank">${rankIcon(rank)}</span>
        <span class="lb-name"><span class="lb-flag" aria-label="${flagLabel}" title="${flagLabel}">${flag}</span>${displayName}${meBadge}${ipHtml}</span>
        <span class="lb-score">${entry.score.toLocaleString()}점<span class="en-sub-inline">pts</span></span>
        <span class="lb-meta">${metaHtml}</span>
      `;
      ol.appendChild(li);
    });

    // knownIds 갱신: 다음 스냅샷 비교 기준
    knownIds = new Set(list.map(e => e.id).filter(Boolean));
    isFirstSnapshot = false;
  }

  function teardownSubscription() {
    if (activeUnsub) {
      try { activeUnsub(); } catch {}
      activeUnsub = null;
    }
    knownIds = new Set();
    isFirstSnapshot = true;
  }

  async function render() {
    const myToken = ++renderToken;

    // 새 렌더 시작 — 기존 구독 해제, 강조 상태 리셋
    teardownSubscription();

    setVisibility('leaderboard-loading', false);
    setVisibility('leaderboard-empty', false);
    setVisibility('leaderboard-cloud-off', false);
    const ol = document.getElementById('leaderboard-list');
    if (ol) ol.innerHTML = '';

    const diffTabs = document.querySelector('.leaderboard-tabs');
    // 난이도가 의미 없는 스코프(daily/timeattack)에선 visibility만 숨겨 모달 높이 유지
    const noDifficulty = currentScope === 'daily' || currentScope === 'timeattack';
    if (diffTabs) diffTabs.classList.toggle('lb-tabs-invisible', noDifficulty);

    renderDailyNotice(currentScope === 'daily');

    if (currentScope === 'device') {
      // 로컬 — 실시간 구독 불필요
      const list = Storage.getLeaderboard(currentDifficulty);
      if (list.length === 0) {
        setVisibility('leaderboard-empty', true);
        return;
      }
      renderRows(list);
      return;
    }

    // global / daily — Firebase 미설정 시 안내
    if (!Cloud.isReady()) {
      setVisibility('leaderboard-cloud-off', true);
      return;
    }

    setVisibility('leaderboard-loading', true);

    // 실시간 구독 시작
    const onUpdate = (list) => {
      if (myToken !== renderToken) return; // 탭이 바뀌면 무시
      setVisibility('leaderboard-loading', false);
      if (list.length === 0) {
        setVisibility('leaderboard-empty', true);
        const ol2 = document.getElementById('leaderboard-list');
        if (ol2) ol2.innerHTML = '';
      } else {
        setVisibility('leaderboard-empty', false);
        renderRows(list);
      }
    };

    if (currentScope === 'daily') {
      activeUnsub = await Cloud.subscribeDailyTop(10, onUpdate);
    } else if (currentScope === 'timeattack') {
      activeUnsub = await Cloud.subscribeTimeAttackTop(10, onUpdate);
    } else {
      activeUnsub = await Cloud.subscribeTop(currentDifficulty, 10, onUpdate);
    }
  }

  function selectScope(scope) {
    currentScope = scope;
    document.querySelectorAll('.lb-scope-tab').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.lbScope === scope);
    });
    render();
  }

  function selectTab(difficulty) {
    currentDifficulty = difficulty;
    document.querySelectorAll('.lb-tab').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.lbDifficulty === difficulty);
    });
    render();
  }

  function open(opts = {}) {
    if (opts.difficulty) currentDifficulty = opts.difficulty;
    if (opts.scope) currentScope = opts.scope;
    if (opts.highlight) highlightEntry = opts.highlight;
    else highlightEntry = null;
    onCloseCallback = typeof opts.onClose === 'function' ? opts.onClose : null;

    // 탭 활성화 동기화
    document.querySelectorAll('.lb-scope-tab').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.lbScope === currentScope);
    });
    document.querySelectorAll('.lb-tab').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.lbDifficulty === currentDifficulty);
    });

    Modal.open('leaderboard-modal');
    render();
  }

  function fireCloseCallback() {
    if (onCloseCallback) {
      const cb = onCloseCallback;
      onCloseCallback = null;
      cb();
    }
  }

  function bind() {
    document.querySelectorAll('.lb-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        Sound.play('click');
        selectTab(btn.dataset.lbDifficulty);
      });
    });
    document.querySelectorAll('.lb-scope-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        Sound.play('click');
        selectScope(btn.dataset.lbScope);
      });
    });
    const closeBtn = document.getElementById('leaderboard-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        Sound.play('click');
        Modal.close();
      });
    }

    const challengeBtn = document.getElementById('leaderboard-empty-challenge-btn');
    if (challengeBtn) {
      challengeBtn.addEventListener('click', () => {
        Sound.play('click');
        let opts;
        if (currentScope === 'daily') {
          opts = { mode: 'daily', difficulty: 'medium', seed: (Cloud.todayKey ? Cloud.todayKey() : '') };
        } else if (currentScope === 'timeattack') {
          opts = { mode: 'timeattack', difficulty: 'medium' };
        } else {
          opts = { mode: 'classic', difficulty: currentDifficulty };
        }
        // 모달 닫기 + 게임 시작 + 게임 화면 전환
        Modal.close();
        if (typeof Game !== 'undefined') {
          if (Game.reset) Game.reset();
          if (Game.start) Game.start(opts);
        }
        if (typeof UI !== 'undefined' && UI.showScreen) UI.showScreen('game');
      });
    }

    // 모달이 닫히는 모든 경로(백드롭, ESC, X 버튼) 처리
    document.addEventListener('modal:closed', (e) => {
      if (e.detail && e.detail.id === 'leaderboard-modal') {
        teardownSubscription();
        fireCloseCallback();
      }
    });
  }

  return {
    bind,
    open,
    render,
    selectTab,
    selectScope
  };
})();
