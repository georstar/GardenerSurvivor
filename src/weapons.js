import { TAU, rand, angleDiff, normalize, circle } from './utils.js';
import { ICONS, drawTrowel, drawGnome } from './icons.js';

const MAX_ENEMY_R = 64; // search margin so big enemies are found by grid queries

function nearestEnemy(game, maxDist) {
  const p = game.player;
  let best = null, bd = maxDist * maxDist;
  for (const e of game.enemies) {
    if (e.dead) continue;
    const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

class Weapon {
  constructor(def) {
    this.def = def;
    this.level = 1;
    this.timer = 0.3;
  }
  get s() {
    return this.def.levels[this.level - 1];
  }
  update() {}
  draw() {}
}

// Snips an arc in the direction you are walking.
class Shears extends Weapon {
  constructor(def) {
    super(def);
    this.slashes = [];
  }
  update(dt, game) {
    const p = game.player, s = this.s;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = s.cd * p.cooldownMul;
      const target = nearestEnemy(game, s.range * 1.8);
      const base = target ? Math.atan2(target.y - p.y, target.x - p.x) : Math.atan2(p.facing.y, p.facing.x);
      this.slash(game, base, s);
      if (s.both) this.slash(game, base + Math.PI, s);
    }
    for (const sl of this.slashes) sl.age += dt;
    this.slashes = this.slashes.filter((sl) => sl.age < 0.22);
  }
  slash(game, a, s) {
    const p = game.player, dmg = s.dmg * p.damageMul;
    game.grid.forEachNear(p.x, p.y, s.range + MAX_ENEMY_R, (e) => {
      if (e.dead) return;
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
      if (d > s.range + e.r) return;
      const ang = Math.atan2(dy, dx);
      const tol = s.arc / 2 + Math.atan2(e.r, Math.max(d, 1));
      if (d > e.r && Math.abs(angleDiff(a, ang)) > tol) return;
      game.hitEnemy(e, dmg, Math.cos(ang) * s.knock, Math.sin(ang) * s.knock);
    });
    this.slashes.push({ a, age: 0, range: s.range, arc: s.arc });
  }
  draw(ctx, game) {
    const p = game.player;
    for (const sl of this.slashes) {
      const k = sl.age / 0.22, r = sl.range * (0.75 + 0.25 * Math.min(1, k * 3));
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(sl.a);
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, r, -sl.arc / 2, sl.arc / 2);
      ctx.arc(0, 0, r * 0.6, sl.arc / 2, -sl.arc / 2, true);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e0f7fa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, -sl.arc / 2, sl.arc / 2);
      ctx.stroke();
      ctx.rotate(-sl.arc / 2 + sl.arc * Math.min(1, k * 2.5));
      ctx.translate(r * 0.8, 0);
      ctx.rotate(Math.PI * 0.75);
      ctx.scale(0.8, 0.8);
      ICONS.shears(ctx);
      ctx.restore();
    }
  }
}

// Boomerang trowels that fly toward the nearest plant and come back.
class Trowel extends Weapon {
  constructor(def) {
    super(def);
    this.items = [];
  }
  update(dt, game) {
    const p = game.player, s = this.s;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = s.cd * p.cooldownMul;
      const target = nearestEnemy(game, 500);
      const base = target ? Math.atan2(target.y - p.y, target.x - p.x) : Math.atan2(p.facing.y, p.facing.x);
      for (let i = 0; i < s.count; i++) {
        const a = base + (i - (s.count - 1) / 2) * 0.45;
        this.items.push({
          x: p.x, y: p.y, dx: Math.cos(a), dy: Math.sin(a), t: 0, spin: 0,
          back: false, backV: 0, outT: (2 * s.range) / s.speed, speed: s.speed, hits: new Map(), done: false,
        });
      }
    }
    const dmg = s.dmg * p.damageMul;
    for (const it of this.items) {
      it.t += dt;
      it.spin += dt * 18;
      if (!it.back) {
        const v = it.speed * Math.max(0, 1 - it.t / it.outT);
        it.x += it.dx * v * dt;
        it.y += it.dy * v * dt;
        if (it.t >= it.outT) it.back = true;
      } else {
        const dx = p.x - it.x, dy = p.y - it.y, d = Math.hypot(dx, dy) || 1;
        it.backV = Math.min(it.speed * 1.4, it.backV + it.speed * 3 * dt);
        it.x += (dx / d) * it.backV * dt;
        it.y += (dy / d) * it.backV * dt;
        if (d < 18 || it.t > 5) it.done = true;
      }
      game.grid.forEachNear(it.x, it.y, 12 + MAX_ENEMY_R, (e) => {
        if (e.dead) return;
        const rr = e.r + 12;
        if ((e.x - it.x) ** 2 + (e.y - it.y) ** 2 > rr * rr) return;
        const last = it.hits.get(e.id);
        if (last !== undefined && it.t - last < 0.45) return;
        it.hits.set(e.id, it.t);
        game.hitEnemy(e, dmg, it.dx * 80, it.dy * 80);
      });
    }
    this.items = this.items.filter((it) => !it.done);
  }
  draw(ctx) {
    for (const it of this.items) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.spin);
      drawTrowel(ctx, 1.1);
      ctx.restore();
    }
  }
}

// Lobs clouds of weedkiller that damage and slow everything inside.
class Spray extends Weapon {
  constructor(def) {
    super(def);
    this.clouds = [];
    this.streaks = [];
  }
  update(dt, game) {
    const p = game.player, s = this.s;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = s.cd * p.cooldownMul;
      for (let i = 0; i < s.count; i++) {
        let x = p.x + rand(-150, 150), y = p.y + rand(-150, 150);
        for (let tries = 0; tries < 30 && game.enemies.length; tries++) {
          const e = game.enemies[Math.floor(Math.random() * game.enemies.length)];
          if (!e.dead && (e.x - p.x) ** 2 + (e.y - p.y) ** 2 < 320 * 320) { x = e.x; y = e.y; break; }
        }
        this.clouds.push({ x, y, r: s.radius, age: 0, dur: s.dur, tick: 0, dmg: s.dmg, tickT: s.tick });
        this.streaks.push({ x1: p.x, y1: p.y, x2: x, y2: y, age: 0 });
      }
    }
    for (const c of this.clouds) {
      c.age += dt;
      c.tick -= dt;
      if (c.tick <= 0) {
        c.tick = c.tickT;
        const dmg = c.dmg * p.damageMul;
        game.grid.forEachNear(c.x, c.y, c.r + MAX_ENEMY_R, (e) => {
          if (e.dead) return;
          const rr = c.r + e.r * 0.5;
          if ((e.x - c.x) ** 2 + (e.y - c.y) ** 2 > rr * rr) return;
          e.slow = 0.5;
          game.hitEnemy(e, dmg, 0, 0);
        });
      }
    }
    for (const st of this.streaks) st.age += dt;
    this.clouds = this.clouds.filter((c) => c.age < c.dur);
    this.streaks = this.streaks.filter((st) => st.age < 0.15);
  }
  draw(ctx) {
    for (const c of this.clouds) {
      const r = c.r * Math.min(1, c.age / 0.2);
      if (r <= 1) continue;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (c.dur - c.age) / 0.4);
      const g = ctx.createRadialGradient(c.x, c.y, r * 0.1, c.x, c.y, r);
      g.addColorStop(0, 'rgba(170,240,90,0.55)');
      g.addColorStop(0.7, 'rgba(120,200,60,0.35)');
      g.addColorStop(1, 'rgba(110,60,150,0)');
      ctx.fillStyle = g;
      circle(ctx, c.x, c.y, r);
      ctx.fillStyle = 'rgba(210,255,160,0.7)';
      for (let k = 0; k < 6; k++) {
        const bx = c.x + Math.cos(k * 2.1 + c.age) * r * 0.55;
        const by = c.y + r * 0.5 - ((k * 13 + c.age * 30) % r);
        circle(ctx, bx, by, 2.5);
      }
      ctx.restore();
    }
    ctx.save();
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 6]);
    for (const st of this.streaks) {
      ctx.strokeStyle = `rgba(180,255,120,${1 - st.age / 0.15})`;
      ctx.beginPath();
      ctx.moveTo(st.x1, st.y1);
      ctx.lineTo(st.x2, st.y2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Rotating jets of water that push plants away.
class Hose extends Weapon {
  constructor(def) {
    super(def);
    this.angle = 0;
    this.tick = 0;
    this.t = 0;
  }
  update(dt, game) {
    const p = game.player, s = this.s;
    this.t += dt;
    this.angle += s.rot * dt;
    this.tick -= dt;
    if (this.tick > 0) return;
    this.tick = s.tick * p.cooldownMul;
    const dmg = s.dmg * p.damageMul;
    for (let b = 0; b < s.beams; b++) {
      const a = this.angle + (b * TAU) / s.beams, cx = Math.cos(a), cy = Math.sin(a);
      game.grid.forEachNear(p.x + (cx * s.len) / 2, p.y + (cy * s.len) / 2, s.len / 2 + MAX_ENEMY_R, (e) => {
        if (e.dead) return;
        const rx = e.x - p.x, ry = e.y - p.y;
        const along = rx * cx + ry * cy;
        if (along < 0 || along > s.len + e.r) return;
        if (Math.abs(rx * cy - ry * cx) > e.r + 10) return;
        game.hitEnemy(e, dmg, cx * s.knock, cy * s.knock);
      });
    }
  }
  draw(ctx, game) {
    const p = game.player, s = this.s;
    for (let b = 0; b < s.beams; b++) {
      const a = this.angle + (b * TAU) / s.beams;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(a);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      for (let x = 14; x <= s.len; x += 10) ctx.lineTo(x, Math.sin(x * 0.08 - this.t * 20) * 3 * (x / s.len));
      ctx.strokeStyle = 'rgba(79,195,247,0.75)';
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(225,245,254,0.9)';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = 'rgba(179,229,252,0.85)';
      for (let k = 0; k < 4; k++) circle(ctx, s.len + rand(-4, 10), rand(-8, 8), rand(2, 4));
      ctx.fillStyle = '#f9a825';
      ctx.fillRect(8, -3.5, 8, 7);
      ctx.restore();
    }
  }
}

// Lawn gnomes orbiting the gardener.
class Gnomes extends Weapon {
  constructor(def) {
    super(def);
    this.angle = 0;
    this.t = 0;
    this.hits = new Map();
  }
  positions(p) {
    const s = this.s, out = [];
    for (let i = 0; i < s.count; i++) {
      const a = this.angle + (i * TAU) / s.count;
      out.push({ x: p.x + Math.cos(a) * s.radius, y: p.y + Math.sin(a) * s.radius });
    }
    return out;
  }
  update(dt, game) {
    const p = game.player, s = this.s;
    this.t += dt;
    this.angle += s.rot * dt;
    if (this.hits.size > 2000) this.hits.clear();
    const dmg = s.dmg * p.damageMul;
    for (const g of this.positions(p)) {
      game.grid.forEachNear(g.x, g.y, 12 + MAX_ENEMY_R, (e) => {
        if (e.dead) return;
        const rr = e.r + 12;
        if ((e.x - g.x) ** 2 + (e.y - g.y) ** 2 > rr * rr) return;
        const last = this.hits.get(e.id);
        if (last !== undefined && this.t - last < 0.5) return;
        this.hits.set(e.id, this.t);
        const n = normalize(e.x - p.x, e.y - p.y);
        game.hitEnemy(e, dmg, n.x * s.knock, n.y * s.knock);
      });
    }
  }
  draw(ctx, game) {
    for (const [i, g] of this.positions(game.player).entries()) {
      ctx.save();
      ctx.translate(g.x, g.y + Math.sin(this.t * 10 + i) * 2);
      drawGnome(ctx, 1);
      ctx.restore();
    }
  }
}

// Slams the ground around the gardener, knocking everything back.
class Rake extends Weapon {
  constructor(def) {
    super(def);
    this.slams = [];
    this.timer = 1.5;
  }
  update(dt, game) {
    const p = game.player, s = this.s;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = s.cd * p.cooldownMul;
      const dmg = s.dmg * p.damageMul;
      game.grid.forEachNear(p.x, p.y, s.radius + MAX_ENEMY_R, (e) => {
        if (e.dead) return;
        const rr = s.radius + e.r;
        if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 > rr * rr) return;
        const n = normalize(e.x - p.x, e.y - p.y);
        game.hitEnemy(e, dmg, n.x * s.knock, n.y * s.knock);
      });
      this.slams.push({ x: p.x, y: p.y, r: s.radius, age: 0 });
      game.camera.addShake(4);
      game.particles.dirt(p.x, p.y, s.radius);
    }
    for (const sl of this.slams) sl.age += dt;
    this.slams = this.slams.filter((sl) => sl.age < 0.45);
  }
  draw(ctx) {
    for (const sl of this.slams) {
      const k = sl.age / 0.45, a = 1 - k;
      const e = 1 - (1 - Math.min(1, k * 1.6)) ** 3;
      const r = sl.r * (0.3 + 0.7 * e);
      ctx.fillStyle = `rgba(141,110,74,${a * 0.25})`;
      circle(ctx, sl.x, sl.y, r);
      ctx.strokeStyle = `rgba(121,85,72,${a})`;
      ctx.lineWidth = 6 * a + 2;
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, r, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = `rgba(93,64,55,${a})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * TAU;
        ctx.moveTo(sl.x + Math.cos(ang) * r * 0.7, sl.y + Math.sin(ang) * r * 0.7);
        ctx.lineTo(sl.x + Math.cos(ang) * r * 0.95, sl.y + Math.sin(ang) * r * 0.95);
      }
      ctx.stroke();
    }
  }
}

export const WEAPON_DEFS = {
  shears: {
    id: 'shears', name: 'Pruning Shears', cls: Shears, layer: 'above',
    levels: [
      { dmg: 12, cd: 1.1, range: 70, arc: 1.7, knock: 90, both: false, desc: 'Snips the nearest plants around you.' },
      { dmg: 16, cd: 1.0, range: 76, arc: 1.8, knock: 100, both: false, desc: '+4 damage, faster snips.' },
      { dmg: 18, cd: 1.0, range: 80, arc: 1.8, knock: 100, both: true, desc: 'Also snips behind you.' },
      { dmg: 24, cd: 0.9, range: 92, arc: 2.0, knock: 120, both: true, desc: '+6 damage, longer reach.' },
      { dmg: 32, cd: 0.75, range: 105, arc: 2.2, knock: 140, both: true, desc: '+8 damage, much faster.' },
    ],
  },
  trowel: {
    id: 'trowel', name: 'Boomerang Trowel', cls: Trowel, layer: 'above',
    levels: [
      { dmg: 15, cd: 1.6, count: 1, speed: 420, range: 220, desc: 'Flies at the nearest plant and comes back.' },
      { dmg: 19, cd: 1.4, count: 1, speed: 440, range: 240, desc: '+4 damage, thrown more often.' },
      { dmg: 20, cd: 1.4, count: 2, speed: 440, range: 240, desc: 'Throw 2 trowels.' },
      { dmg: 26, cd: 1.2, count: 2, speed: 460, range: 260, desc: '+6 damage, longer throws.' },
      { dmg: 32, cd: 1.1, count: 3, speed: 480, range: 280, desc: 'Throw 3 trowels.' },
    ],
  },
  spray: {
    id: 'spray', name: 'Weedkiller Spray', cls: Spray, layer: 'below',
    levels: [
      { dmg: 6, tick: 0.4, cd: 3.0, radius: 50, dur: 2.5, count: 1, desc: 'Toxic cloud that damages and slows plants.' },
      { dmg: 7, tick: 0.4, cd: 2.8, radius: 58, dur: 2.5, count: 1, desc: 'Bigger, stronger cloud.' },
      { dmg: 7, tick: 0.4, cd: 2.8, radius: 58, dur: 2.8, count: 2, desc: 'Spray 2 clouds at once.' },
      { dmg: 9, tick: 0.35, cd: 2.6, radius: 68, dur: 3.0, count: 2, desc: 'Faster damage ticks, wider clouds.' },
      { dmg: 11, tick: 0.35, cd: 2.4, radius: 78, dur: 3.5, count: 3, desc: 'Spray 3 huge clouds.' },
    ],
  },
  hose: {
    id: 'hose', name: 'Garden Hose', cls: Hose, layer: 'above',
    levels: [
      { dmg: 5, tick: 0.25, len: 130, beams: 1, rot: 1.8, knock: 60, desc: 'A rotating jet of water that pushes plants back.' },
      { dmg: 6, tick: 0.25, len: 150, beams: 1, rot: 1.9, knock: 70, desc: 'Longer, stronger jet.' },
      { dmg: 7, tick: 0.25, len: 150, beams: 2, rot: 1.9, knock: 70, desc: 'Adds a second jet.' },
      { dmg: 9, tick: 0.22, len: 175, beams: 2, rot: 2.2, knock: 80, desc: 'Faster spin, longer reach.' },
      { dmg: 11, tick: 0.2, len: 200, beams: 3, rot: 2.3, knock: 90, desc: 'Three jets of high-pressure water.' },
    ],
  },
  gnomes: {
    id: 'gnomes', name: 'Lawn Gnomes', cls: Gnomes, layer: 'above',
    levels: [
      { count: 1, dmg: 10, radius: 75, rot: 2.6, knock: 150, desc: 'A loyal gnome circles you, bonking plants.' },
      { count: 2, dmg: 10, radius: 75, rot: 2.6, knock: 150, desc: 'Recruit a second gnome.' },
      { count: 2, dmg: 14, radius: 85, rot: 2.8, knock: 170, desc: '+4 damage, wider orbit.' },
      { count: 3, dmg: 16, radius: 85, rot: 2.9, knock: 170, desc: 'Recruit a third gnome.' },
      { count: 4, dmg: 20, radius: 95, rot: 3.2, knock: 200, desc: 'A full gnome squad of 4.' },
    ],
  },
  rake: {
    id: 'rake', name: 'Earthquake Rake', cls: Rake, layer: 'below',
    levels: [
      { dmg: 25, cd: 4.0, radius: 100, knock: 350, desc: 'Slams the ground, knocking back everything nearby.' },
      { dmg: 32, cd: 4.0, radius: 110, knock: 370, desc: '+7 damage, bigger slam.' },
      { dmg: 40, cd: 3.5, radius: 125, knock: 390, desc: 'Slams more often.' },
      { dmg: 50, cd: 3.5, radius: 140, knock: 410, desc: '+10 damage, huge radius.' },
      { dmg: 65, cd: 3.0, radius: 160, knock: 450, desc: 'A devastating, frequent slam.' },
    ],
  },
};

export function createWeapon(id) {
  const def = WEAPON_DEFS[id];
  return new def.cls(def);
}
