import { rand, circle, ellipse } from './utils.js';
import { drawTomato } from './icons.js';

// kind: 'xp' (seed), 'heart' (tomato, heals), 'bee' (pulls in every seed),
// 'can' (golden watering can, wilts every plant on screen)
export class Pickup {
  constructor(kind, x, y, value = 0) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.value = value;
    this.vx = rand(-50, 50);
    this.vy = rand(-50, 50);
    this.magnetized = false;
    this.v = 0;
    this.t = Math.random() * 10;
    this.dead = false;
  }

  // Returns true when the player collects it.
  update(dt, p) {
    this.t += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const decay = Math.min(1, dt * 6);
    this.vx -= this.vx * decay;
    this.vy -= this.vy * decay;
    const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy) || 1;
    if (!this.magnetized && d < p.magnet) this.magnetized = true;
    if (this.magnetized) {
      this.v = Math.min(700, this.v + 900 * dt);
      this.x += (dx / d) * this.v * dt;
      this.y += (dy / d) * this.v * dt;
    }
    return d < p.r + 6;
  }

  draw(ctx) {
    const bob = Math.sin(this.t * 4) * 1.5;
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    if (this.kind === 'xp') {
      const v = this.value;
      const [color, hi, size] = v >= 40 ? ['#ff6fd8', '#ffc1ef', 1.6]
        : v >= 8 ? ['#ffcf3f', '#fff3b0', 1.35]
        : v >= 3 ? ['#4fb3ff', '#c4e6ff', 1.15]
        : ['#7ed957', '#d4f7c0', 1];
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ellipse(ctx, 0, 7 - bob, 4 * size, 1.5 * size);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -6 * size);
      ctx.quadraticCurveTo(5 * size, 0, 0, 5 * size);
      ctx.quadraticCurveTo(-5 * size, 0, 0, -6 * size);
      ctx.fill();
      ctx.fillStyle = hi;
      ellipse(ctx, -1 * size, -1 * size, 1.2 * size, 2.4 * size, 0.3);
    } else if (this.kind === 'heart') {
      drawTomato(ctx, 0.75);
    } else if (this.kind === 'bee') {
      const flap = Math.sin(this.t * 40) * 0.5 + 0.5;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ellipse(ctx, -2, -7, 4, 6 * (0.5 + flap * 0.5), -0.4);
      ellipse(ctx, 3, -7, 4, 6 * (0.5 + flap * 0.5), 0.4);
      ctx.fillStyle = '#ffca28';
      ellipse(ctx, 0, 0, 8, 6);
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(-3, -5.5, 2.5, 11);
      ctx.fillRect(2, -5.5, 2.5, 11);
      circle(ctx, 7, -1, 1.2);
    } else if (this.kind === 'can') {
      const glow = 0.35 + Math.sin(this.t * 6) * 0.15;
      ctx.fillStyle = `rgba(255,215,64,${glow})`;
      circle(ctx, 0, 0, 16);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ellipse(ctx, 0, 10 - bob, 9, 2.5);
      ctx.strokeStyle = '#c79100';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-1, -4, 6, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.fillStyle = '#ffd740';
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(14, -9);
      ctx.lineTo(15, -7);
      ctx.lineTo(7, 4);
      ctx.closePath();
      ctx.fill();
      ellipse(ctx, 14.5, -8.5, 2.5, 1.5, -0.8);
      ctx.fillStyle = '#ffca28';
      ctx.fillRect(-8, -3, 14, 11);
      ctx.fillStyle = '#fff59d';
      ctx.fillRect(-6, -1, 3, 7);
    }
    ctx.restore();
  }
}
