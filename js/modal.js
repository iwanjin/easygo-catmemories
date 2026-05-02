/**
 * Modal Module - 팝업 컴포넌트
 *
 * 단일 책임: 모달 열기/닫기 + 백드롭/ESC/X버튼 닫기 + 포커스 관리.
 * 비즈니스 로직은 호출자(UI/Game)가 이벤트로 추가한다.
 */
const Modal = (function () {
  let active = null; // 현재 열린 모달 element
  let lastFocus = null;

  function init() {
    // 모든 .modal 안의 백드롭/닫기버튼에 닫기 동작 위임
    document.addEventListener('click', (e) => {
      if (!active) return;
      const closer = e.target.closest('[data-modal-close]');
      if (closer && active.contains(closer)) {
        close();
      }
    });

    // ESC로 닫기 (단, pause 모달처럼 강제 닫기 금지인 경우는 data-no-esc 옵션)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && active && !active.dataset.noEsc) {
        close();
      }
    });
  }

  function open(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) return;
    if (active && active !== el) close();

    lastFocus = document.activeElement;
    el.classList.remove('hidden');
    // reflow 후 클래스 추가해서 트랜지션 활성화
    requestAnimationFrame(() => el.classList.add('is-open'));
    active = el;

    // 첫 번째 포커스 가능한 요소에 포커스
    const focusable = el.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) focusable.focus();

    document.dispatchEvent(new CustomEvent('modal:opened', { detail: { id: el.id } }));
  }

  function close() {
    if (!active) return;
    const el = active;
    el.classList.remove('is-open');

    const handle = () => {
      el.classList.add('hidden');
      el.removeEventListener('transitionend', handle);
    };
    el.addEventListener('transitionend', handle);

    // transitionend가 안 발사될 경우 대비
    setTimeout(() => {
      if (!el.classList.contains('is-open')) el.classList.add('hidden');
    }, 400);

    const closedId = el.id;
    active = null;
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
    document.dispatchEvent(new CustomEvent('modal:closed', { detail: { id: closedId } }));
  }

  function isOpen(id) {
    if (!id) return active !== null;
    return active && active.id === id;
  }

  return { init, open, close, isOpen };
})();
