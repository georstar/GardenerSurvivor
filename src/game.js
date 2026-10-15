import { Player } from './player.js';
import { Enemy, ENEMY_TYPES } from './enemies.js';
import { Spawner } from './spawner.js';
import { Pickup } from './pickups.js';
import { Particles } from './particles.js';
import { createWeapon } from './weapons.js';
import { SpatialHash, TAU, rand } from './utils.js';

const MAX_ENEMY_R = 64;
const MAX_XP_PICKUPS = 350;

// One run of the game: owns every entity and the simulation step.
export class Game {
  constructor(camera, ui) {
    this.camera = camera;
    this.ui = ui;
    this.player = new Player();
    this.player.weapons.push(createWeapon('shears'));
    this.enemies = [];
    this.shots = [];
    this.pickups = [];
    this.particles = new Particles();
    this.grid = new SpatialHash(64);
    this.spawner = new Spawner();
    this.time = 0;
    this.kills = 0;
    this.pendingLevelUps = 0;
    this.boss = null;
    this.winTimer = -1;
    this.won = false;
    this.screenFlash = 0;
    camera.snap(0, 0);
  }

  spawnEnemy(type, x, y, elite = false) {
    const hpMul = ENEMY_TYPES[type].boss ? 1 : 1 + this.time / 180;
    const e = new Enemy(type, x, y, hpMul, elite);
    this.enemies.push(e);
    return e;
  }

  // A point just outside the visible screen; biased ahead of the player when angle is given.
  spawnRingPos(extra = 0, angle = rand(0, TAU)) {
    const R = Math.hypot(this.camera.w, this.camera.h) / 2 + 40 + extra;
    return { x: this.player.x + Math.cos(angle) * R, y: this.player.y + Math.sin(angle) * R };
  }

  announce(text) {
    this.ui.banner(text);
  }

  hitEnemy(e, dmg, kx = 0, ky = 0, color = '#fff') {
    if (e.dead) return;
    e.hp -= dmg;
    e.flash = 0.12;
    const res = 1 - e.knockResist;
    e.kx += kx * res;
    e.ky += ky * res;
    const k = Math.hypot(e.kx, e.ky);
    if (k > 500) { e.kx *= 500 / k; e.ky *= 500 / k; }
    this.particles.text(e.x, e.y - e.r, String(Math.round(dmg)), color, e.isBoss ? 16 : 12);
    if (e.hp <= 0) this.killEnemy(e);
  }

  killEnemy(e, split = true) {
    e.dead = true;
    this.kills++;
    this.particles.burst(e.x, e.y, e.def.color, e.isBoss ? 60 : e.elite ? 20 : 7, e.r);
    if (e.isBoss) {
      for (let i = 0; i < 40; i++) this.dropXp(e.x + rand(-70, 70), e.y + rand(-70, 70), 25);
      this.winTimer = 2.5;
      this.camera.addShake(12);
      this.announce('The Mutant Sunflower wilts! The garden is safe!');
      return;
    }
    this.dropXp(e.x, e.y, e.xp);
    if (e.elite) {
      this.pickups.push(new Pickup('heart', e.x + 12, e.y));
      if (Math.random() < 0.4) this.pickups.push(new Pickup('bee', e.x - 12, e.y));
      if (Math.random() < 0.25) this.pickups.push(new Pickup('can', e.x, e.y + 12));
    } else {
      const r = Math.random();
      if (r < 0.008) this.pickups.push(new Pickup('heart', e.x, e.y));
      else if (r < 0.0105) this.pickups.push(new Pickup('bee', e.x, e.y));
      else if (r < 0.0125) this.pickups.push(new Pickup('can', e.x, e.y));
    }
    if (e.burn > 0 && e.burnSpread) {
      // Burning plants pass the fire on to their neighbours (without the spread, so it can't chain forever).
      this.grid.forEachNear(e.x, e.y, 70 + MAX_ENEMY_R, (o) => {
        if (o.dead || o.isBoss) return;
        const rr = 70 + o.r;
        if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 > rr * rr) return;
        this.ignite(o, e.burnDps, 2);
      });
    }
    if (split && e.def.splits) {
      for (let i = 0; i < 2; i++) {
        const c = this.spawnEnemy(e.def.splits, e.x + rand(-8, 8), e.y + rand(-8, 8));
        c.kx = rand(-150, 150);
        c.ky = rand(-150, 150);
      }
    }
  }

  ignite(e, dps, dur, spread = false) {
    if (e.dead) return;
    if (e.burn <= 0) e.burnTick = 0.5;
    e.burn = Math.max(e.burn, dur);
    e.burnDps = Math.max(e.burnDps, dps);
    e.burnSpread = e.burnSpread || spread;
  }

  // Golden Watering Can: every plant on screen wilts, the boss just takes a big hit.
  wiltScreen() {
    for (const e of this.enemies.slice()) {
      if (e.dead || !this.camera.inView(e.x, e.y, e.r)) continue;
      if (e.isBoss) this.hitEnemy(e, e.maxHp * 0.1, 0, 0, '#ffd740');
      else this.killEnemy(e, false);
    }
    this.camera.addShake(10);
    this.screenFlash = 0.5;
  }

  dropXp(x, y, value) {
    let count = 0;
    for (const k of this.pickups) if (k.kind === 'xp') count++;
    if (count >= MAX_XP_PICKUPS) {
      // Too many seeds on the ground: fold the value into an existing one.
      const xs = this.pickups.filter((k) => k.kind === 'xp');
      xs[Math.floor(Math.random() * xs.length)].value += value;
      return;
    }
    this.pickups.push(new Pickup('xp', x, y, value));
  }

  damagePlayer(amount) {
    const d = this.player.takeDamage(amount);
    if (d) {
      this.camera.addShake(3);
      this.particles.text(this.player.x, this.player.y - 26, `-${Math.round(d)}`, '#ff5252', 15);
    }
  }

  collect(k) {
    const p = this.player;
    if (k.kind === 'xp') {
      this.pendingLevelUps += p.gainXp(k.value);
    } else if (k.kind === 'heart') {
      p.hp = Math.min(p.maxHp, p.hp + 30);
      this.particles.text(p.x, p.y - 26, '+30', '#69f0ae', 15);
    } else if (k.kind === 'bee') {
      for (const o of this.pickups) if (o.kind === 'xp') o.magnetized = true;
      this.particles.text(p.x, p.y - 26, 'Bzzz!', '#ffca28', 15);
    } else if (k.kind === 'can') {
      this.particles.text(p.x, p.y - 26, 'Wilt!', '#ffd740', 18);
      this.wiltScreen();
    }
  }

  update(dt) {
    this.time += dt;
    const p = this.player;
    p.update(dt);
    this.spawner.update(dt, this);

    for (const e of this.enemies) if (!e.dead) e.update(dt, this);
    this.grid.clear();
    for (const e of this.enemies) if (!e.dead) this.grid.insert(e);
    this.separate();

    for (const w of p.weapons) w.update(dt, this);

    for (const e of this.enemies) {
      if (e.dead || e.burn <= 0) continue;
      e.burnTick -= dt;
      if (e.burnTick <= 0) {
        e.burnTick += 0.5;
        this.hitEnemy(e, e.burnDps * 0.5, 0, 0, '#ff9800');
      }
      e.burn -= dt;
      if (e.burn <= 0) {
        e.burnDps = 0;
        e.burnSpread = false;
      }
    }

    // Contact damage; enemies are pushed out of the gardener so they don't stack on top.
    this.grid.forEachNear(p.x, p.y, p.r + MAX_ENEMY_R, (e) => {
      if (e.dead) return;
      const dx = e.x - p.x, dy = e.y - p.y, rr = e.r * 0.85 + p.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr) return;
      const d = Math.sqrt(d2) || 1;
      if (!e.isBoss) {
        e.x = p.x + (dx / d) * rr;
        e.y = p.y + (dy / d) * rr;
      }
      this.damagePlayer(e.dmg);
    });

    for (const s of this.shots) {
      s.update(dt);
      const rr = s.r + p.r * 0.8;
      if (!s.dead && (s.x - p.x) ** 2 + (s.y - p.y) ** 2 < rr * rr) {
        this.damagePlayer(s.dmg);
        s.dead = true;
      }
    }
    this.shots = this.shots.filter((s) => !s.dead);

    for (const k of this.pickups) {
      if (k.update(dt, p)) {
        this.collect(k);
        k.dead = true;
      }
    }
    this.pickups = this.pickups.filter((k) => !k.dead);

    this.enemies = this.enemies.filter((e) => !e.dead);
    // Plants left far behind are replanted ahead of the gardener.
    const far = Math.hypot(this.camera.w, this.camera.h) * 0.75 + 250;
    for (const e of this.enemies) {
      if (!e.isBoss && (Math.abs(e.x - p.x) > far || Math.abs(e.y - p.y) > far)) {
        const ahead = p.moving ? Math.atan2(p.facing.y, p.facing.x) + rand(-1, 1) : rand(0, TAU);
        const pos = this.spawnRingPos(rand(0, 60), ahead);
        e.x = pos.x;
        e.y = pos.y;
      }
    }

    if (this.screenFlash > 0) this.screenFlash -= dt;
    this.particles.update(dt);
    this.camera.follow(p.x, p.y, dt);

    if (this.winTimer > 0) {
      this.winTimer -= dt;
      if (this.winTimer <= 0) this.won = true;
    }
  }

  // Push overlapping enemies apart, lighter ones more than heavier ones.
  separate() {
    for (const e of this.enemies) {
      this.grid.forEachNear(e.x, e.y, e.r + MAX_ENEMY_R, (o) => {
        if (o.id <= e.id) return;
        let dx = o.x - e.x, dy = o.y - e.y;
        const rr = e.r + o.r;
        let d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr) return;
        if (d2 === 0) { dx = rand(-1, 1); dy = rand(-1, 1); d2 = dx * dx + dy * dy || 1; }
        const d = Math.sqrt(d2), overlap = (rr - d) * 0.5;
        const nx = dx / d, ny = dy / d;
        const me = e.isBoss ? 1e6 : e.r * e.r, mo = o.isBoss ? 1e6 : o.r * o.r;
        const fe = mo / (me + mo), fo = me / (me + mo);
        e.x -= nx * overlap * fe;
        e.y -= ny * overlap * fe;
        o.x += nx * overlap * fo;
        o.y += ny * overlap * fo;
      });
    }
  }

  draw(ctx) {
    const p = this.player, cam = this.camera;
    for (const w of p.weapons) if (w.def.layer === 'below') w.draw(ctx, this);
    for (const k of this.pickups) if (cam.inView(k.x, k.y, 20)) k.draw(ctx);

    const sprites = this.enemies.filter((e) => cam.inView(e.x, e.y, e.r * 2 + 20));
    sprites.push(p);
    sprites.sort((a, b) => a.y - b.y);
    for (const s of sprites) s.draw(ctx);

    for (const w of p.weapons) if (w.def.layer === 'above') w.draw(ctx, this);
    for (const s of this.shots) s.draw(ctx);
    this.particles.draw(ctx);
    p.drawHpBar(ctx);
  }
}
