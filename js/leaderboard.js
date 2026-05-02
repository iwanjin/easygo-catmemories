/**
 * Leaderboard Module - 명예의 전당 (TOP 10)
 *
 * 단일 책임: 리더보드 모달 렌더링과 탭 전환.
 * 데이터 저장/조회는 Storage 모듈, 모달 열기/닫기는 Modal 모듈에 위임.
 */
const Leaderboard = (function () {
  let currentDifficulty = 'easy';
  let highlightEntry = null; // { difficulty, rank }
  let onCloseCallback = null;

  function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function rankIcon(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  }

  function render() {
    const list = Storage.getLeaderboard(currentDifficulty);
    const ol = document.getElementById('leaderboard-list');
    const empty = document.getElementById('leaderboard-empty');
    if (!ol || !empty) return;

    ol.innerHTML = '';
    if (list.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    list.forEach((entry, idx) => {
      const rank = idx + 1;
      const li = document.createElement('li');
      li.className = 'lb-row';
      if (
        highlightEntry &&
        highlightEntry.difficulty === currentDifficulty &&
        highlightEntry.rank === rank
      ) {
        li.classList.add('lb-row-new');
      }
      li.innerHTML = `
        <span class="lb-rank">${rankIcon(rank)}</span>
        <span class="lb-name">${escapeHtml(entry.name || '익명')}</span>
        <span class="lb-score">${entry.score.toLocaleString()}점</span>
        <span class="lb-meta">⏱ ${formatTime(entry.time)} · 🎯 ${entry.moves}회</span>
      `;
      ol.appendChild(li);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
    if (opts.highlight) highlightEntry = opts.highlight;
    else highlightEntry = null;
    onCloseCallback = typeof opts.onClose === 'function' ? opts.onClose : null;
    selectTab(currentDifficulty);
    Modal.open('leaderboard-modal');
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
    selectTab
  };
})();
