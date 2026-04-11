/**
 * Confetti Effect Module
 * Creates a visually appealing falling confetti animation on game win
 *
 * Team C: Celebration Effects
 */
const Confetti = (() => {
  let canvas = null;
  let animationFrameId = null;

  /**
   * Create and launch confetti particles
   * Responds to 'game:won' event and auto-cleans after 3 seconds
   */
  function launch() {
    // Create canvas element for animation
    canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Color palette for confetti - vibrant and playful
    const colors = [
      '#FF6B9D',  // Pink
      '#6BC5FF',  // Light Blue
      '#FFD93D',  // Yellow
      '#81E979',  // Green
      '#B39DFF',  // Purple
      '#FF9A76',  // Coral
      '#66D9FF',  // Sky Blue
      '#FFB86C'   // Orange
    ];

    // Create particles
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      vy: 2 + Math.random() * 3,           // vertical velocity
      vx: -2 + Math.random() * 4,           // horizontal velocity (drift)
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rotVelocity: -0.05 + Math.random() * 0.1
    }));

    const startTime = Date.now();
    const duration = 3000;  // 3 seconds

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        // Apply gravity and drift
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1;  // gravity
        particle.rot += particle.rotVelocity;

        // Add fade effect as particles fall
        const alpha = Math.max(0, 1 - progress * 0.5);

        // Draw particle (as a small square/rectangle)
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rot);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();
      });

      // Continue animation or cleanup
      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        cleanup();
      }
    }

    // Start animation
    animate();
  }

  /**
   * Clean up canvas and remove from DOM
   */
  function cleanup() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
      canvas = null;
    }
  }

  /**
   * Initialize confetti module - subscribe to game:won event
   */
  function init() {
    document.addEventListener('game:won', (event) => {
      launch();
    });
  }

  // Public API
  return {
    init: init,
    launch: launch,
    cleanup: cleanup
  };
})();

// Auto-initialize when module loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    Confetti.init();
  });
} else {
  Confetti.init();
}
