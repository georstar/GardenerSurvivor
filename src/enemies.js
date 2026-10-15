import { TAU, rand, circle, ellipse, rrect, leaf, eyes } from './utils.js';
import { EnemyShot } from './projectiles.js';

export const ENEMY_TYPES = {
  weedling: { name: 'Weedling', hp: 8, speed: 72, r: 10, dmg: 5, xp: 1, color: '#5cc23f', ai: 'chase', draw: drawWeedling },
  thorn: { name: 'Thorn Bush', hp: 45, speed: 42, r: 18, dmg: 10, xp: 8, color: '#356b2f', ai: 'chase', knockResist: 0.5, draw: drawThorn },
  cactus: {
    name: 'Cactus', hp: 28, speed: 55, r: 14, dmg: 8, xp: 4, color: '#4caf50', ai: 'ranged',
    keepDist: 230, fireRate: 2.6, shotDmg: 8, shotSpeed: 190, draw: drawCactus,
  },
  flytrap: { name: 'Venus Flytrap', hp: 34, speed: 52, r: 16, dmg: 14, xp: 5, color: '#d6334a', ai: 'lunge', draw: drawFlytrap },
  vine: { name: 'Creeping Vine', hp: 38, speed: 62, r: 15, dmg: 9, xp: 5, color: '#7d5ba6', ai: 'chase', splits: 'vineling', draw: drawVine },
  vineling: { name: 'Vineling', hp: 10, speed: 88, r: 9, dmg: 5, xp: 1, color: '#7d5ba6', ai: 'chase', draw: drawVine },
  sunflower: {
    name: 'Mutant Sunflower', hp: 5000, speed: 48, r: 52, dmg: 30, xp: 0, color: '#f7c531', ai: 'boss',
    boss: true, knockResist: 1, draw: drawSunflower,
  },
};

let nextId = 1;

export class Enemy {
  constructor(type, x, y, hpMul = 1, elite = false) {
    const d = ENEMY_TYPES[type];
    this.id = nextId++;
    this.type = type;
    this.def = d;
    this.x = x;
    this.y = y;
    this.elite = elite;
    this.isBoss = !!d.boss;
    this.r = d.r * (elite ? 1.6 : 1);
    this.maxHp = d.hp * hpMul * (elite ? 10 : 1);
    this.hp = this.maxHp;
    this.speed = d.speed * (elite ? 0.85 : 1);
    this.dmg = d.dmg * (elite ? 1.5 : 1);
    this.xp = d.xp * (elite ? 10 : 1);
    this.knockResist = d.knockResist ?? (elite ? 0.7 : 0);
    this.kx = 0;
    this.ky = 0;
    this.flash = 0;
    this.slow = 0;
    this.burn = 0;
    this.burnDps = 0;
    this.burnTick = 0;
    this.burnSpread = false;
    this.t =Math.random() * 10;
    this.faceX = 1;
    this.dead = false;
    this.state = 'walk';
    this.timer = d.ai === 'boss' ? 2 : rand(0.6, 2.5);
    this.timer2 = 4;
    this.dashX = 0;
    this.dashY = 0;
    this.strafe = Math.random() < 0.5 ? -1 : 1;
  }

  update(dt, game) {
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.slow > 0) this.slow -= dt;
    const d = this.def, p = game.player;
    const dx = p.x - this.x, dy = p.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist, ny = dy / dist;
    const spd = this.speed * (this.slow > 0 ? 0.55 : 1);
    let vx = nx * spd, vy = ny * spd;
    this.faceX = nx >= 0 ? 1 : -1;

    if (d.ai === 'ranged') {
      if (dist < d.keepDist * 0.75) {
        vx = -nx * spd * 0.8;
        vy = -ny * spd * 0.8;
      } else if (dist < d.keepDist) {
        vx = -ny * spd * 0.5 * this.strafe;
        vy = nx * spd * 0.5 * this.strafe;
      }
      this.timer -= dt;
      if (this.timer <= 0 && dist < d.keepDist * 1.6) {
        this.timer = d.fireRate * rand(0.8, 1.2);
        const n = this.elite ? 3 : 1;
        const base = Math.atan2(dy, dx);
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * 0.25;
          game.shots.push(new EnemyShot(this.x, this.y, Math.cos(a) * d.shotSpeed, Math.sin(a) * d.shotSpeed, 'spine', d.shotDmg));
        }
      }
    } else if (d.ai === 'lunge') {
      this.timer -= dt;
      if (this.state === 'walk') {
        if (dist < 230 && this.timer <= 0) {
          this.state = 'windup';
          this.timer = 0.55;
        }
      } else if (this.state === 'windup') {
        vx = vy = 0;
        if (this.timer <= 0) {
          this.state = 'dash';
          this.timer = 0.38;
          this.dashX = nx;
          this.dashY = ny;
        }
      } else if (this.state === 'dash') {
        vx = this.dashX * 430;
        vy = this.dashY * 430;
        this.faceX = this.dashX >= 0 ? 1 : -1;
        if (this.timer <= 0) {
          this.state = 'walk';
          this.timer = rand(1.8, 2.8);
        }
      }
    } else if (d.ai === 'boss') {
      const enraged = this.hp < this.maxHp / 2;
      this.timer -= dt;
      this.timer2 -= dt;
      if (this.timer <= 0) {
        this.timer = enraged ? 1.9 : 2.8;
        const n = enraged ? 22 : 14;
        const off = rand(0, TAU);
        for (let i = 0; i < n; i++) {
          const a = off + (i / n) * TAU;
          game.shots.push(new EnemyShot(
            this.x + Math.cos(a) * this.r * 0.7, this.y + Math.sin(a) * this.r * 0.7,
            Math.cos(a) * 165, Math.sin(a) * 165, 'seed', 12,
          ));
        }
      }
      if (this.timer2 <= 0) {
        this.timer2 = 7;
        const n = enraged ? 10 : 6;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU;
          game.spawnEnemy('weedling', this.x + Math.cos(a) * (this.r + 30), this.y + Math.sin(a) * (this.r + 30));
        }
      }
    }

    this.x += (vx + this.kx) * dt;
    this.y += (vy + this.ky) * dt;
    const decay = Math.min(1, dt * 9);
    this.kx -= this.kx * decay;
    this.ky -= this.ky * decay;
  }

  draw(ctx) {
    const r = this.r;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ellipse(ctx, 0, r * 0.95, r * 0.9, r * 0.3);
    if (this.elite) {
      ctx.strokeStyle = `rgba(255,215,64,${0.55 + Math.sin(this.t * 6) * 0.3})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.3, 0, TAU);
      ctx.stroke();
    }
    const bob = Math.sin(this.t * 10) * (this.isBoss ? 0.02 : 0.06);
    ctx.scale(this.faceX * (1 + bob), 1 - bob);
    this.def.draw(ctx, this);
    ctx.restore();

    if (this.flash > 0) {
      ctx.save();
      ctx.globalAlpha = (this.flash / 0.12) * (this.isBoss ? 0.25 : 0.55);
      ctx.fillStyle = '#fff';
      circle(ctx, this.x, this.y, r * 0.95);
      ctx.restore();
    }

    if (this.burn > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.burn / 0.4);
      for (let i = 0; i < 3; i++) {
        const fx = this.x + (i - 1) * r * 0.5;
        const h = r * (0.7 + 0.3 * Math.sin(this.t * 18 + i * 2.1));
        const fy = this.y - r * 0.4;
        ctx.fillStyle = '#ff7043';
        ctx.beginPath();
        ctx.moveTo(fx - r * 0.22, fy);
        ctx.quadraticCurveTo(fx - r * 0.2, fy - h * 0.6, fx, fy - h);
        ctx.quadraticCurveTo(fx + r * 0.2, fy - h * 0.6, fx + r * 0.22, fy);
        ctx.fill();
        ctx.fillStyle = '#ffd54f';
        ellipse(ctx, fx, fy - h * 0.25, r * 0.1, h * 0.25);
      }
      ctx.restore();
    }

    if (this.elite && this.hp < this.maxHp) {
      const w = r * 2, x = this.x - r, y = this.y - r * 1.7;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x - 1, y - 1, w + 2, 6);
      ctx.fillStyle = '#ffd740';
      ctx.fillRect(x, y, w * (this.hp / this.maxHp), 4);
    }
  }
}

// ---------- per-type drawing (local coords, +x faces the player) ----------

function drawWeedling(ctx, e) {
  const r = e.r, w = Math.sin(e.t * 9) * 0.35;
  leaf(ctx, -r * 0.15, -r * 0.7, r * 1.1, -0.7 + w, '#6fd14a');
  leaf(ctx, r * 0.15, -r * 0.7, r * 1.0, 0.7 - w, '#5cc23f');
  ctx.fillStyle = '#3f8f2f';
  circle(ctx, 0, 0, r);
  ctx.fillStyle = '#4ea83a';
  circle(ctx, -r * 0.3, -r * 0.3, r * 0.5);
  eyes(ctx, r);
}

function drawThorn(ctx, e) {
  const r = e.r, n = 12, wob = Math.sin(e.t * 2) * 0.05;
  ctx.fillStyle = '#e6dcae';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + wob;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - 0.18) * r * 0.85, Math.sin(a - 0.18) * r * 0.85);
    ctx.lineTo(Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35);
    ctx.lineTo(Math.cos(a + 0.18) * r * 0.85, Math.sin(a + 0.18) * r * 0.85);
    ctx.fill();
  }
  ctx.fillStyle = '#2f5f2a';
  circle(ctx, 0, 0, r);
  ctx.fillStyle = '#3f7c37';
  circle(ctx, -r * 0.4, -r * 0.35, r * 0.45);
  circle(ctx, r * 0.35, -r * 0.45, r * 0.4);
  circle(ctx, -r * 0.1, r * 0.4, r * 0.45);
  ctx.fillStyle = '#c62f3b';
  circle(ctx, -r * 0.6, r * 0.2, r * 0.12);
  circle(ctx, r * 0.55, r * 0.45, r * 0.11);
  circle(ctx, r * 0.1, -r * 0.75, r * 0.1);
  eyes(ctx, r * 0.9);
}

function drawCactus(ctx, e) {
  const r = e.r;
  ctx.fillStyle = '#c8643b';
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, r * 0.45);
  ctx.lineTo(r * 0.75, r * 0.45);
  ctx.lineTo(r * 0.55, r * 1.05);
  ctx.lineTo(-r * 0.55, r * 1.05);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a94f2c';
  rrect(ctx, -r * 0.85, r * 0.35, r * 1.7, r * 0.28, r * 0.1);

  ctx.save();
  ctx.rotate(Math.sin(e.t * 4) * 0.08);
  ctx.fillStyle = '#43a047';
  rrect(ctx, -r * 1.05, -r * 0.6, r * 0.42, r * 0.8, r * 0.21);
  rrect(ctx, -r * 0.9, -r * 0.05, r * 0.5, r * 0.3, r * 0.15);
  rrect(ctx, r * 0.63, -r * 0.95, r * 0.42, r * 0.8, r * 0.21);
  rrect(ctx, r * 0.4, -r * 0.4, r * 0.5, r * 0.3, r * 0.15);
  ctx.fillStyle = '#4caf50';
  rrect(ctx, -r * 0.6, -r * 1.2, r * 1.2, r * 1.75, r * 0.6);
  ctx.strokeStyle = '#3b8e3f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.25, -r * 0.95);
  ctx.lineTo(-r * 0.25, r * 0.4);
  ctx.moveTo(r * 0.25, -r * 0.95);
  ctx.lineTo(r * 0.25, r * 0.4);
  ctx.stroke();
  ctx.strokeStyle = '#f4f1d0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const [sx, sy] of [[-0.45, -0.2], [0.45, 0.1], [-0.4, 0.3], [0.05, 0.25], [-0.85, -0.3], [0.85, -0.7]]) {
    ctx.moveTo(sx * r - 2, sy * r - 2);
    ctx.lineTo(sx * r + 2, sy * r + 2);
    ctx.moveTo(sx * r + 2, sy * r - 2);
    ctx.lineTo(sx * r - 2, sy * r + 2);
  }
  ctx.stroke();
  ctx.fillStyle = '#ff6fa8';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    circle(ctx, Math.cos(a) * r * 0.2, -r * 1.2 + Math.sin(a) * r * 0.2, r * 0.17);
  }
  ctx.fillStyle = '#ffd54f';
  circle(ctx, 0, -r * 1.2, r * 0.12);
  ctx.translate(0, -r * 0.5);
  eyes(ctx, r * 0.85);
  ctx.restore();
}

function drawFlytrap(ctx, e) {
  const r = e.r;
  let open;
  if (e.state === 'windup') {
    open = 0.95;
    ctx.translate(rand(-1.5, 1.5), rand(-1.5, 1.5));
  } else if (e.state === 'dash') {
    open = 0.15 + Math.abs(Math.sin(e.t * 30)) * 0.3;
  } else {
    open = 0.35 + Math.sin(e.t * 5) * 0.15;
  }
  ctx.strokeStyle = '#3c8d2f';
  ctx.lineWidth = r * 0.22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, r * 0.2);
  ctx.quadraticCurveTo(-r * 0.7, r * 0.7, -r * 0.1, r * 1.0);
  ctx.stroke();
  leaf(ctx, -r * 0.1, r * 0.95, r * 0.8, -1.2, '#4caf50');
  leaf(ctx, -r * 0.1, r * 0.95, r * 0.8, 1.2, '#43a047');

  ctx.save();
  ctx.translate(-r * 0.55, -r * 0.05);
  for (const side of [-1, 1]) {
    const a0 = side < 0 ? Math.PI : 0, a1 = side < 0 ? TAU : Math.PI;
    ctx.save();
    ctx.rotate(open * 0.6 * side);
    ctx.fillStyle = '#5ba83a';
    ctx.beginPath();
    ctx.ellipse(r * 0.85, 0, r * 0.95, r * 0.62, 0, a0, a1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d6334a';
    ctx.beginPath();
    ctx.ellipse(r * 0.85, 0, r * 0.8, r * 0.36, 0, a0, a1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff8e1';
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const x = r * (0.2 + k * 0.33);
      ctx.moveTo(x - r * 0.08, 0);
      ctx.lineTo(x, -side * r * 0.22);
      ctx.lineTo(x + r * 0.08, 0);
    }
    ctx.fill();
    ctx.restore();
  }
  ctx.rotate(-open * 0.6);
  ctx.translate(r * 0.75, -r * 0.48);
  ctx.fillStyle = '#fff';
  circle(ctx, 0, 0, r * 0.22);
  ctx.fillStyle = '#1b1b1b';
  circle(ctx, r * 0.07, 0, r * 0.11);
  ctx.strokeStyle = '#1b1b1b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.25, -r * 0.3);
  ctx.lineTo(r * 0.2, -r * 0.18);
  ctx.stroke();
  ctx.restore();
}

function drawVine(ctx, e) {
  const r = e.r, segs = e.type === 'vineling' ? 2 : 3;
  for (let k = segs; k >= 1; k--) {
    const sx = -r * 0.75 * k, sy = Math.sin(e.t * 6 - k * 1.2) * r * 0.35;
    ctx.fillStyle = k % 2 ? '#5f8f2a' : '#6fa335';
    circle(ctx, sx, sy, r * (0.75 - k * 0.12));
    leaf(ctx, sx, sy, r * 0.5, -0.8 + Math.sin(e.t * 5 + k) * 0.3, '#8bc34a');
  }
  ctx.fillStyle = '#6a9a2f';
  circle(ctx, 0, 0, r);
  ctx.fillStyle = '#7d5ba6';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.45, r * 0.85, r * 0.55, 0, Math.PI, TAU);
  ctx.fill();
  ctx.strokeStyle = '#4d7a22';
  ctx.lineWidth = Math.max(1.5, r * 0.12);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(r * 0.6, -r * 0.95, r * 0.3, Math.PI * 0.5, Math.PI * 2.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-r * 0.5, -r * 1.05, r * 0.25, Math.PI * 0.6, Math.PI * 2.3);
  ctx.stroke();
  eyes(ctx, r);
}

function drawSunflower(ctx, e) {
  const r = e.r, enraged = e.hp < e.maxHp / 2;
  ctx.strokeStyle = '#3f8f2f';
  ctx.lineWidth = r * 0.22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.5);
  ctx.quadraticCurveTo(r * 0.2, r * 1.1, 0, r * 1.5);
  ctx.stroke();
  const sway = Math.sin(e.t * 2) * 0.2;
  leaf(ctx, 0, r * 1.2, r * 0.8, -1.9 + sway, '#4caf50');
  leaf(ctx, 0, r * 1.15, r * 0.8, 1.9 - sway, '#43a047');

  const spin = e.t * (enraged ? 1.2 : 0.4), n = 18;
  for (let i = 0; i < n; i++) {
    const a = spin + (i / n) * TAU;
    ctx.fillStyle = enraged ? (i % 2 ? '#ff7043' : '#ffb300') : (i % 2 ? '#f7c531' : '#ffb300');
    ellipse(ctx, Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, r * 0.38, r * 0.15, a);
  }
  ctx.fillStyle = '#6b3e1f';
  circle(ctx, 0, 0, r * 0.62);
  ctx.fillStyle = '#4a2a12';
  for (let i = 0; i < 55; i++) {
    const a = i * 2.39996, rad = Math.sqrt(i / 55) * r * 0.56;
    circle(ctx, Math.cos(a) * rad, Math.sin(a) * rad, r * 0.035);
  }
  eyes(ctx, r * 0.6, -0.25, true, enraged ? '#ff1744' : '#1b1b1b');
  ctx.fillStyle = '#2a1208';
  ellipse(ctx, r * 0.07, r * 0.25, r * 0.26, r * 0.12);
  ctx.fillStyle = '#fff8e1';
  for (let i = 0; i < 4; i++) ctx.fillRect(r * (-0.12 + i * 0.1), r * 0.15, r * 0.06, r * 0.07);
}
