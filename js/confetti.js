/**
 * GAME ARENA - Lightweight Canvas Confetti Engine
 * Created by KABIR VYAS
 */

const Confetti = (() => {
  let canvas, ctx;
  let particles = [];
  let animationFrameId = null;

  const colors = [
    '#6366f1', '#818cf8', '#f59e0b', '#fbbf24', 
    '#10b981', '#34d399', '#f43f5e', '#ec4899', '#38bdf8'
  ];

  const init = () => {
    canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  };

  const resize = () => {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  class Particle {
    constructor() {
      this.x = canvas.width / 2 + (Math.random() * 400 - 200);
      this.y = canvas.height / 2 + (Math.random() * 100 - 50);
      this.size = Math.random() * 8 + 4;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.vx = (Math.random() - 0.5) * 16;
      this.vy = -(Math.random() * 14 + 6);
      this.gravity = 0.35;
      this.friction = 0.98;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 10;
      this.opacity = 1;
      this.decay = Math.random() * 0.015 + 0.01;
    }

    update() {
      this.vy += this.gravity;
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotSpeed;
      this.opacity -= this.decay;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.5);
      ctx.restore();
    }
  }

  const loop = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.opacity <= 0 || p.y > canvas.height) {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0) {
      animationFrameId = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return {
    init,
    launch(count = 120) {
      if (!canvas) init();
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
      if (!animationFrameId) {
        loop();
      }
    }
  };
})();
