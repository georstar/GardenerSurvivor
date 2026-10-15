import { WEAPON_DEFS, createWeapon } from './weapons.js';
import { ICONS } from './icons.js';

export const MAX_WEAPONS = 6;
export const MAX_PASSIVES = 6;

export const PASSIVE_DEFS = {
  boots: { name: 'Garden Boots', desc: '+10% move speed.', max: 5 },
  gloves: { name: 'Work Gloves', desc: '+12% damage with every tool.', max: 5 },
  hat: { name: 'Straw Hat', desc: '+1 armor: take less damage from every hit.', max: 5 },
  fertilizer: { name: 'Fertilizer', desc: 'Regenerate +0.3 HP per second.', max: 5 },
  pouch: { name: 'Seed Pouch', desc: '+30% seed pickup radius.', max: 5 },
  sundial: { name: 'Sundial', desc: '-7% tool cooldowns.', max: 5 },
};

const HEAL_AMOUNT = 40;

export function generateChoices(player, n = 3) {
  const pool = [];
  const owned = new Set(player.weapons.map((w) => w.def.id));
  for (const w of player.weapons) {
    if (w.level < w.def.levels.length) pool.push({ kind: 'weapon', id: w.def.id, level: w.level + 1, w: 3 });
  }
  if (player.weapons.length < MAX_WEAPONS) {
    for (const id of Object.keys(WEAPON_DEFS)) {
      if (!owned.has(id)) pool.push({ kind: 'weapon', id, level: 1, w: 2.2 });
    }
  }
  const passiveCount = Object.keys(player.passives).length;
  for (const [id, def] of Object.entries(PASSIVE_DEFS)) {
    const lv = player.passive(id);
    if (lv >= def.max || (lv === 0 && passiveCount >= MAX_PASSIVES)) continue;
    pool.push({ kind: 'passive', id, level: lv + 1, w: lv ? 2 : 1.5 });
  }

  const out = [];
  while (out.length < n && pool.length) {
    let r = Math.random() * pool.reduce((s, c) => s + c.w, 0);
    let i = 0;
    for (; i < pool.length - 1; i++) {
      r -= pool[i].w;
      if (r <= 0) break;
    }
    out.push(pool.splice(i, 1)[0]);
  }
  if (!out.length) out.push({ kind: 'heal', id: 'heal', level: 0 });
  return out;
}

export function applyChoice(player, c) {
  if (c.kind === 'weapon') {
    const w = player.weapons.find((w) => w.def.id === c.id);
    if (w) w.level = c.level;
    else player.weapons.push(createWeapon(c.id));
  } else if (c.kind === 'passive') {
    player.passives[c.id] = c.level;
  } else {
    player.hp = Math.min(player.maxHp, player.hp + HEAL_AMOUNT);
  }
}

export function describeChoice(c) {
  if (c.kind === 'weapon') {
    const def = WEAPON_DEFS[c.id];
    return { name: def.name, tag: c.level === 1 ? 'NEW!' : `Lv ${c.level}`, desc: def.levels[c.level - 1].desc, icon: ICONS[c.id] };
  }
  if (c.kind === 'passive') {
    const def = PASSIVE_DEFS[c.id];
    return { name: def.name, tag: c.level === 1 ? 'NEW!' : `Lv ${c.level}`, desc: def.desc, icon: ICONS[c.id] };
  }
  return { name: 'Fresh Tomato', tag: 'Snack', desc: `Restore ${HEAL_AMOUNT} HP.`, icon: ICONS.heal };
}
