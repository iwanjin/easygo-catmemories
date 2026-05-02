/**
 * Sound Module - 아기 고양이 효과음 합성기 (Web Audio API)
 *
 * 외부 mp3 의존 없이 OscillatorNode + BiquadFilter(포먼트) + LFO(비브라토)로
 * 키튼 "야옹/냐/먀옹" 류의 효과음을 합성한다.
 *
 * 합성 원리:
 *  - 톱니파(sawtooth)로 풍부한 하모닉 생성
 *  - 두 개의 peaking 필터로 고양이 성도(vocal tract) 포먼트 모사
 *  - 5~7Hz LFO로 미세한 비브라토 → 살아있는 느낌
 *  - 주파수가 살짝 올라갔다 내려가는 M자 모양 글라이드 → 야옹의 억양
 */
const Sound = (function () {
  let audioCtx = null;
  let masterGain = null;
  let muted = false;
  let volume = 0.6; // 0.0 ~ 1.0

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
  }

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
   * 키튼 야옹 합성 — 한 번의 "냐"
   * @param {Object} opts
   *   startFreq: 시작 기본 주파수
   *   peakFreq: 글라이드 정점 주파수
   *   endFreq: 종료 주파수
   *   duration: 길이 (초)
   *   gain: 음량 (0~1)
   *   formant1: 첫 포먼트 중심 (Hz, 보통 1300~1800)
   *   formant2: 두 번째 포먼트 중심 (Hz, 보통 2400~3200)
   *   vibrato: 비브라토 진폭 (Hz, 0이면 끔)
   */
  function meow({
    startFreq = 600,
    peakFreq = 1000,
    endFreq = 700,
    duration = 0.3,
    gain = 0.45,
    formant1 = 1500,
    formant2 = 2800,
    vibrato = 7
  }) {
    const ctx = ensureContext();
    if (!ctx || muted) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const t0 = ctx.currentTime;
    const tEnd = t0 + duration;

    // 주 음원: 톱니파 (포먼트 필터를 위한 풍부한 하모닉)
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, t0);
    if (peakFreq && Math.abs(peakFreq - startFreq) > 5) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, peakFreq),
        t0 + duration * 0.4
      );
    }
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), tEnd);

    // 비브라토 LFO (4~7Hz, 진폭 vibrato Hz)
    let lfo = null;
    if (vibrato > 0) {
      lfo = ctx.createOscillator();
      lfo.frequency.value = 5.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = vibrato;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
    }

    // 포먼트 1 — 저역 모음 모사 ("아"/"오" 영역)
    const f1 = ctx.createBiquadFilter();
    f1.type = 'peaking';
    f1.frequency.setValueAtTime(formant1, t0);
    f1.Q.value = 7;
    f1.gain.value = 13;

    // 포먼트 2 — 고역 모음 모사 ("이" 영역)
    const f2 = ctx.createBiquadFilter();
    f2.type = 'peaking';
    f2.frequency.setValueAtTime(formant2, t0);
    f2.Q.value = 5;
    f2.gain.value = 9;

    // 저역 차단 (160Hz 이하 제거 — 통통한 저음 방지)
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 220;

    // 고역 부드럽게 (귀에 안 따가운 키튼 톤)
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 4500;
    lp.Q.value = 0.7;

    // 게인 엔벨로프 (빠른 attack, 부드러운 release)
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(gain, t0 + 0.035);
    env.gain.linearRampToValueAtTime(gain * 0.75, t0 + duration * 0.55);
    env.gain.exponentialRampToValueAtTime(0.0008, tEnd);

    // 체인 연결
    osc.connect(f1);
    f1.connect(f2);
    f2.connect(hp);
    hp.connect(lp);
    lp.connect(env);
    env.connect(masterGain);

    osc.start(t0);
    osc.stop(tEnd + 0.05);
    if (lfo) {
      lfo.start(t0);
      lfo.stop(tEnd + 0.05);
    }
  }

  /**
   * 짧은 단순 톤 (UI 클릭 등 비-고양이 효과)
   */
  function tone(freq, duration, type = 'sine', endFreq = null, gain = 0.3) {
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
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + duration);
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
        // 짧고 가벼운 키튼 "냐" — 카드 뒤집기마다 가볍게
        meow({
          startFreq: 720,
          peakFreq: 980,
          endFreq: 820,
          duration: 0.13,
          gain: 0.3,
          formant1: 1700,
          formant2: 3000,
          vibrato: 4
        });
        break;

      case 'match':
        // 짝 맞췄을 때 — 신나는 "냐옹!" 두 번
        meow({
          startFreq: 600,
          peakFreq: 1100,
          endFreq: 850,
          duration: 0.26,
          gain: 0.5,
          formant1: 1500,
          formant2: 2700,
          vibrato: 8
        });
        setTimeout(() => meow({
          startFreq: 800,
          peakFreq: 1350,
          endFreq: 1050,
          duration: 0.32,
          gain: 0.5,
          formant1: 1700,
          formant2: 3000,
          vibrato: 8
        }), 180);
        break;

      case 'mismatch':
        // 시무룩한 "냐~" — 하강 글라이드
        meow({
          startFreq: 700,
          peakFreq: 700,
          endFreq: 360,
          duration: 0.36,
          gain: 0.42,
          formant1: 1250,
          formant2: 2300,
          vibrato: 5
        });
        break;

      case 'win': {
        // 클리어 합창 — 키튼 5마리가 차례로 야옹
        const notes = [
          { startFreq: 600, peakFreq: 1000, endFreq: 800, duration: 0.24, formant1: 1450, formant2: 2700 },
          { startFreq: 700, peakFreq: 1200, endFreq: 900, duration: 0.24, formant1: 1550, formant2: 2800 },
          { startFreq: 850, peakFreq: 1400, endFreq: 1050, duration: 0.26, formant1: 1650, formant2: 2900 },
          { startFreq: 950, peakFreq: 1550, endFreq: 1150, duration: 0.28, formant1: 1750, formant2: 3000 },
          { startFreq: 1050, peakFreq: 1750, endFreq: 1300, duration: 0.42, formant1: 1850, formant2: 3100 }
        ];
        notes.forEach((n, i) => {
          setTimeout(() => meow({ ...n, gain: 0.42, vibrato: 8 }), i * 175);
        });
        break;
      }

      case 'click':
        // UI 클릭 (고양이 소리 X — 짧은 톡)
        tone(680, 0.04, 'sine', 500, 0.2);
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

    // 첫 사용자 입력에서 AudioContext 깨우기 (브라우저 자동재생 정책 대응)
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
