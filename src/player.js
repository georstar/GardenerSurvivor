import { getMove } from './input.js';
import { circle, ellipse, rrect } from './utils.js';

export function xpForLevel(level) {
  return 5 + (level - 1) * 7;
}

export class Player {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.r = 14;
    this.maxHp = 100;
    this.hp = 100;
    this.baseSpeed = 140;
    this.facing = { x: 1, y: 0 };
    this.faceX = 1;
    this.moving = false;
    this.walkT = 0;
    this.iframes = 0;
    this.hurtFlash = 0;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = xpForLevel(1);
    this.weapons = [];
    this.passives = {}; // id -> level
  }

  passive(id) {
    return this.passives[id] || 0;
  }
  get speed() { return this.baseSpeed * (1 + 0.1 * this.passive('boots')); }
  get damageMul() { return 1 + 0.12 * this.passive('gloves'); }
  get armor() { return this.passive('hat'); }
  get regen() { return 0.3 * this.passive('fertilizer'); }
  get magnet() { return 60 * (1 + 0.3 * this.passive('pouch')); }
  get cooldownMul() { return 1 - 0.07 * this.passive('sundial'); }

  update(dt) {
    const m = getMove();
    this.moving = m.x !== 0 || m.y !== 0;
    if (this.moving) {
      const l = Math.hypot(m.x, m.y);
      this.facing = { x: m.x / l, y: m.y / l };
      if (Math.abs(m.x) > 0.1) this.faceX = m.x > 0 ? 1 : -1;
      this.x += m.x * this.speed * dt;
      this.y += m.y * this.speed * dt;
      this.walkT += dt;
    }
    if (this.iframes > 0) this.iframes -= dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (this.regen > 0) this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
  }

  // Returns the damage actually dealt, or 0 if invulnerable.
  takeDamage(amount) {
    if (this.iframes > 0 || this.hp <= 0) return 0;
    const dmg = Math.max(1, amount - this.armor);
    this.hp = Math.max(0, this.hp - dmg);
    this.iframes = 0.5;
    this.hurtFlash = 0.2;
    return dmg;
  }

  // Returns how many levels were gained.
  gainXp(value) {
    this.xp += value;
    let ups = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = xpForLevel(this.level);
      ups++;
    }
    return ups;
  }

  draw(ctx) {
    const swing = this.moving ? Math.sin(this.walkT * 14) : 0;
    const bob = this.moving ? Math.abs(swing) * -2 : 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ellipse(ctx, 0, 15, 13, 5);
    if (this.iframes > 0 && Math.floor(this.iframes * 20) % 2 === 0) ctx.globalAlpha = 0.45;
    ctx.scale(this.faceX, 1);

    // boots
    ctx.fillStyle = '#5b3a1e';
    rrect(ctx, -7, 8 + swing * 2, 6, 7, 2);
    rrect(ctx, 1, 8 - swing * 2, 6, 7, 2);

    ctx.translate(0, bob);
    // arms
    ctx.fillStyle = '#e94f4f';
    circle(ctx, -10, 1 - swing * 1.5, 4);
    circle(ctx, 10, 1 + swing * 1.5, 4);
    ctx.fillStyle = '#f2c79b';
    circle(ctx, -11, 4 - swing * 1.5, 2.6);
    circle(ctx, 11, 4 + swing * 1.5, 2.6);
    // shirt + overalls
    ctx.fillStyle = '#e94f4f';
    rrect(ctx, -8, -5, 16, 8, 4);
    ctx.fillStyle = '#3d6fb5';
    rrect(ctx, -9, -1, 18, 12, 5);
    ctx.fillStyle = '#2f5a97';
    ctx.fillRect(-6, -5, 3, 6);
    ctx.fillRect(3, -5, 3, 6);
    ctx.fillStyle = '#ffd54f';
    circle(ctx, -4.5, 0, 1.3);
    circle(ctx, 4.5, 0, 1.3);
    ctx.fillStyle = '#2f5a97';
    rrect(ctx, -4, 3, 8, 4, 1);

    // head
    ctx.fillStyle = '#f2c79b';
    circle(ctx, 0, -11, 8);
    ctx.fillStyle = '#e8a87c';
    circle(ctx, 6.5, -10, 2);
    ctx.fillStyle = '#2b1d12';
    circle(ctx, 4, -12, 1.4);
    circle(ctx, 0, -12, 1.4);
    ctx.strokeStyle = '#8d4a2b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(2.5, -9, 2.5, 0.2, Math.PI - 0.6);
    ctx.stroke();
    ctx.fillStyle = '#ff9a8a';
    circle(ctx, -3, -9, 1.5);

    // straw hat
    ctx.fillStyle = '#d4a93c';
    ellipse(ctx, 0, -16, 14, 4);
    ctx.fillStyle = '#f0cf6a';
    rrect(ctx, -7, -24, 14, 9, 5);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-7, -18.5, 14, 2.5);

    ctx.restore();

    if (this.hurtFlash > 0) {
      ctx.save();
      ctx.globalAlpha = (this.hurtFlash / 0.2) * 0.45;
      ctx.fillStyle = '#ff1744';
      circle(ctx, this.x, this.y - 4, 18);
      ctx.restore();
    }
  }

  drawHpBar(ctx) {
    const w = 32, h = 5, x = this.x - w / 2, y = this.y + 21;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#c62828';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#66d14a';
    ctx.fillRect(x, y, w * (this.hp / this.maxHp), h);
  }
}
