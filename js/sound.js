/**
 * Sound Module - Web Audio API 기반 효과음
 *
 * 외부 mp3 파일에 의존하지 않고 OscillatorNode로 효과음을 즉석 합성한다.
 * GitHub Pages 배포 시 추가 자산 없이 동작하기 위한 선택.
 */
const Sound = (function () {
  let audioCtx = null;
  let masterGain = null;
  let muted = false;
  let volume = 0.6; // 0.0 ~ 1.0
  let initialized = false;

  function ensureContext() {
    if (audioCtx) return audioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = muted ? 0 : volume;
    masterGain.connect(audioCtx.destination);
    return audioCtx;
  }

  function init() {
    muted = Storage.isMuted();
    const stored = Storage.getVolume();
    if (typeof stored === 'number') volume = stored;
    initialized = true;
  }

  // 사용자 상호작용(클릭) 후에만 AudioContext 시작 가능 — 첫 클릭에서 깨운다.
  function unlock() {
    const ctx = ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  function applyGain() {
    if (!masterGain || !audioCtx) return;
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.setValueAtTime(muted ? 0 : volume, audioCtx.currentTime);
  }

  /**
   * 짧은 톤(beep) 한 음을 합성.
   * @param {number} freq - 시작 주파수 (Hz)
   * @param {number} duration - 길이 (초)
   * @param {string} type - 파형: 'sine'|'square'|'triangle'|'sawtooth'
   * @param {number} endFreq - 종료 주파수 (Hz, 글라이드)
   * @param {number} gain - 톤 자체 게인 (0~1)
   */
  function tone(freq, duration, type = 'sine', endFreq = null, gain = 0.5) {
    const ctx = ensureContext();
    if (!ctx || muted) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, endFreq),
        ctx.currentTime + duration
      );
    }

    // ADSR: 빠른 attack, 부드러운 release
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(env);
    env.connect(masterGain);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  }

  function play(type) {
    if (muted) return;
    ensureContext();

    switch (type) {
      case 'flip':
        // 짧고 가벼운 클릭
        tone(880, 0.08, 'triangle', 660, 0.35);
        break;
      case 'match':
        // 상승하는 두 음 (성공 느낌)
        tone(660, 0.12, 'triangle', 880, 0.4);
        setTimeout(() => tone(990, 0.18, 'triangle', 1320, 0.4), 90);
        break;
      case 'mismatch':
        // 가벼운 하강 (실수 느낌, 부정적이지 않게)
        tone(440, 0.18, 'sine', 220, 0.35);
        break;
      case 'win': {
        // 팡파르: 도-미-솔-도'
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((f, i) => {
          setTimeout(() => tone(f, 0.25, 'triangle', null, 0.45), i * 130);
        });
        break;
      }
      case 'click':
        tone(600, 0.05, 'sine', null, 0.25);
        break;
    }
  }

  function toggleMute() {
    muted = !muted;
    Storage.setMuted(muted);
    applyGain();
    return muted;
  }

  function setMuted(value) {
    muted = !!value;
    Storage.setMuted(muted);
    applyGain();
  }

  function isMuted() {
    return muted;
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, Number(v) || 0));
    Storage.setVolume(volume);
    applyGain();
  }

  function getVolume() {
    return volume;
  }

  function subscribeToGameEvents() {
    document.addEventListener('card:flipped', () => play('flip'));
    document.addEventListener('card:matched', () => play('match'));
    document.addEventListener('card:mismatched', () => play('mismatch'));
    document.addEventListener('game:won', () => play('win'));

    // 첫 사용자 입력에서 AudioContext 깨우기 (브라우저 자동재생 정책)
    const wake = () => {
      unlock();
      document.removeEventListener('click', wake);
      document.removeEventListener('keydown', wake);
      document.removeEventListener('touchstart', wake);
    };
    document.addEventListener('click', wake);
    document.addEventListener('keydown', wake);
    document.addEventListener('touchstart', wake);
  }

  return {
    init,
    play,
    toggleMute,
    setMuted,
    isMuted,
    setVolume,
    getVolume,
    subscribeToGameEvents
  };
})();
