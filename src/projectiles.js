import { ellipse } from './utils.js';

// Projectiles fired by plants at the gardener (cactus spines, boss seeds).
export class EnemyShot {
  constructor(x, y, vx, vy, kind, dmg) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.kind = kind;
    this.dmg = dmg;
    this.r = kind === 'seed' ? 6 : 4;
    this.life = 4;
    this.angle = Math.atan2(vy, vx);
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    if (this.kind === 'spine') {
      ctx.strokeStyle = '#f4f1d0';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();
      ctx.fillStyle = '#795548';
      ctx.beginPath();
      ctx.moveTo(6, -2);
      ctx.lineTo(10, 0);
      ctx.lineTo(6, 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#3e2723';
      ellipse(ctx, 0, 0, 7.5, 4.8);
      ctx.fillStyle = '#d7ccc8';
      ellipse(ctx, 1, 0, 4, 1.2);
    }
    ctx.restore();
  }
}
