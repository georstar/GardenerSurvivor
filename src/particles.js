import { TAU, rand } from './utils.js';

const MAX_PARTICLES = 700;
const MAX_TEXTS = 70;
const DIRT = ['#8d6e4a', '#6d4c33', '#a1825a'];

export class Particles {
  constructor() {
    this.list = [];
    this.texts = [];
  }

  // Leafy confetti when a plant dies.
  burst(x, y, color, n, spread = 10) {
    for (let i = 0; i < n && this.list.length < MAX_PARTICLES; i++) {
      const a = rand(0, TAU), s = rand(40, 160);
      const life = rand(0.4, 0.8);
      this.list.push({
        x: x + rand(-spread, spread) * 0.5, y: y + rand(-spread, spread) * 0.5,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life,
        size: rand(2, 4.5), color: i % 3 === 0 ? '#a5d66f' : color, rot: rand(0, TAU), spin: rand(-8, 8),
      });
    }
  }

  dirt(x, y, radius) {
    for (let i = 0; i < 18 && this.list.length < MAX_PARTICLES; i++) {
      const a = (i / 18) * TAU, s = rand(60, 140), life = rand(0.3, 0.6);
      this.list.push({
        x: x + Math.cos(a) * radius * 0.8, y: y + Math.sin(a) * radius * 0.8,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life,
        size: rand(2, 4), color: DIRT[i % 3], rot: 0, spin: 0,
      });
    }
  }

  text(x, y, str, color = '#fff', size = 13) {
    if (this.texts.length >= MAX_TEXTS) this.texts.shift();
    this.texts.push({ x: x + rand(-6, 6), y, str, color, size, life: 0.7, max: 0.7 });
  }

  update(dt) {
    const drag = Math.min(1, dt * 3);
    for (const p of this.list) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx -= p.vx * drag;
      p.vy -= p.vy * drag;
      p.rot += p.spin * dt;
      p.life -= dt;
    }
    for (const t of this.texts) {
      t.y -= 35 * dt;
      t.life -= dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.list) {
      ctx.globalAlpha = p.life / p.max;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, p.rot, 0, TAU);
      ctx.fill();
    }
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, (t.life / t.max) * 2);
      ctx.font = `bold ${t.size}px Fredoka, "Trebuchet MS", sans-serif`;
      ctx.strokeText(t.str, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.restore();
  }
}
