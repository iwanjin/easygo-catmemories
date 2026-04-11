const Sound = (function() {
  const sounds = {};
  let muted = false;

  function init() {
    const soundFiles = {
      flip: 'assets/sounds/flip.mp3',
      match: 'assets/sounds/match.mp3',
      mismatch: 'assets/sounds/mismatch.mp3',
      win: 'assets/sounds/win.mp3'
    };

    // Load sounds with Audio objects
    for (const [type, filePath] of Object.entries(soundFiles)) {
      sounds[type] = new Audio(filePath);
      sounds[type].preload = 'auto';
    }

    // Load mute state from storage
    muted = Storage.isMuted();
  }

  function play(type) {
    if (muted || !sounds[type]) return;

    try {
      sounds[type].currentTime = 0;
      sounds[type].play().catch(() => {});
    } catch (e) {
      console.warn('Sound play failed', e);
    }
  }

  function toggleMute() {
    muted = !muted;
    Storage.setMuted(muted);
  }

  function subscribeToGameEvents() {
    document.addEventListener('card:flipped', () => play('flip'));
    document.addEventListener('card:matched', () => play('match'));
    document.addEventListener('card:mismatched', () => play('mismatch'));
    document.addEventListener('game:won', () => play('win'));
  }

  return {
    init,
    play,
    toggleMute,
    subscribeToGameEvents
  };
})();
