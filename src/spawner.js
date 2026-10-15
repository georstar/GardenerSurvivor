import { TAU, rand, choice, weightedPick } from './utils.js';

export const BOSS_TIME = 600;
const MAX_ENEMIES = 420;

// When each plant starts showing up, and how common it is.
const TABLE = [
  { type: 'weedling', from: 0, weight: (t) => Math.max(1.5, 6 - t / 60) },
  { type: 'thorn', from: 90, weight: () => 2 },
  { type: 'cactus', from: 180, weight: () => 1.2 },
  { type: 'flytrap', from: 270, weight: () => 1.5 },
  { type: 'vine', from: 360, weight: () => 2 },
];

export class Spawner {
  constructor() {
    this.acc = 0;
    this.nextElite = 300;
    this.nextSwarm = 120;
    this.warned = false;
    this.bossSpawned = false;
  }

  update(dt, game) {
    const t = game.time;

    if (!this.warned && t >= BOSS_TIME - 30) {
      this.warned = true;
      game.announce('The ground trembles... something huge is sprouting!');
    }
    if (!this.bossSpawned && t >= BOSS_TIME) {
      this.bossSpawned = true;
      const pos = game.spawnRingPos();
      game.boss = game.spawnEnemy('sunflower', pos.x, pos.y);
      game.announce('The Mutant Sunflower has bloomed!');
    }

    const rate = Math.min(0.8 + t / 40, 14) * (this.bossSpawned ? 0.35 : 1);
    this.acc += rate * dt;
    while (this.acc >= 1) {
      this.acc -= 1;
      if (game.enemies.length >= MAX_ENEMIES) {
        this.acc = 0;
        break;
      }
      const pos = game.spawnRingPos(rand(0, 60));
      game.spawnEnemy(this.pickType(t), pos.x, pos.y);
    }

    if (!this.bossSpawned && t >= this.nextElite) {
      this.nextElite += 45;
      const opts = TABLE.filter((e) => e.from <= t && e.type !== 'weedling');
      const pos = game.spawnRingPos();
      game.spawnEnemy(choice(opts).type, pos.x, pos.y, true);
    }

    if (!this.bossSpawned && t >= this.nextSwarm) {
      this.nextSwarm += 120;
      const n = Math.floor(18 + t / 12);
      const R = Math.hypot(game.camera.w, game.camera.h) / 2 + 30;
      const type = t > 360 ? 'vineling' : 'weedling';
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        game.spawnEnemy(type, game.player.x + Math.cos(a) * R, game.player.y + Math.sin(a) * R);
      }
      game.announce('A weed swarm closes in!');
    }
  }

  pickType(t) {
    const unlocked = TABLE.filter((e) => e.from <= t);
    return weightedPick(unlocked, (e) => e.weight(t)).type;
  }
}
