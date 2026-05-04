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
  let currentScope = 'global'; // 'global' | 'device'
  let highlightEntry = null;   // { scope, difficulty, rank }
  let onCloseCallback = null;
  let renderToken = 0;         // 비동기 race-condition 방지

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

  function renderRows(list) {
    const ol = document.getElementById('leaderboard-list');
    if (!ol) return;
    ol.innerHTML = '';
    list.forEach((entry, idx) => {
      const rank = idx + 1;
      const li = document.createElement('li');
      li.className = 'lb-row';
      if (
        highlightEntry &&
        highlightEntry.scope === currentScope &&
        highlightEntry.difficulty === currentDifficulty &&
        highlightEntry.rank === rank
      ) {
        li.classList.add('lb-row-new');
      }
      // 글로벌에서 내 디바이스가 올린 기록은 별도 표시
      if (entry.isMe) li.classList.add('lb-row-me');

      const meBadge = entry.isMe ? '<span class="lb-me-badge">나<span class="en-sub-inline">Me</span></span>' : '';
      const rawName = entry.name || '';
      const displayName = rawName.trim() && rawName !== '익명'
        ? escapeHtml(rawName)
        : `${escapeHtml('익명')}<span class="en-sub-inline">Anonymous</span>`;
      li.innerHTML = `
        <span class="lb-rank">${rankIcon(rank)}</span>
        <span class="lb-name">${displayName}${meBadge}</span>
        <span class="lb-score">${entry.score.toLocaleString()}점<span class="en-sub-inline">pts</span></span>
        <span class="lb-meta">⏱ ${formatTime(entry.time)} · 🎯 ${entry.moves}회</span>
      `;
      ol.appendChild(li);
    });
  }

  async function render() {
    const myToken = ++renderToken;

    // 일단 모든 보조 메시지 숨김
    setVisibility('leaderboard-loading', false);
    setVisibility('leaderboard-empty', false);
    setVisibility('leaderboard-cloud-off', false);
    const ol = document.getElementById('leaderboard-list');
    if (ol) ol.innerHTML = '';

    if (currentScope === 'device') {
      // 로컬 즉시 렌더
      const list = Storage.getLeaderboard(currentDifficulty);
      if (list.length === 0) {
        setVisibility('leaderboard-empty', true);
        return;
      }
      renderRows(list);
      return;
    }

    // 글로벌 — Firebase 미설정 시 안내
    if (!Cloud.isReady()) {
      setVisibility('leaderboard-cloud-off', true);
      return;
    }

    // 글로벌 — 비동기 로딩
    setVisibility('leaderboard-loading', true);
    const list = await Cloud.getTop(currentDifficulty, 10);

    // 늦게 도착한 응답이 다른 탭을 덮지 않게
    if (myToken !== renderToken) return;

    setVisibility('leaderboard-loading', false);
    if (list.length === 0) {
      setVisibility('leaderboard-empty', true);
      return;
    }
    renderRows(list);
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

    // 모달이 닫히는 모든 경로(백드롭, ESC, X 버튼) 처리
    document.addEventListener('modal:closed', (e) => {
      if (e.detail && e.detail.id === 'leaderboard-modal') {
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
