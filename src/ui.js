import { describeChoice, PASSIVE_DEFS } from './upgrades.js';
import { ICONS } from './icons.js';
import { fmtTime } from './utils.js';

const $ = (id) => document.getElementById(id);

export function makeIcon(drawFn, size = 44) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const c = document.createElement('canvas');
  c.width = c.height = Math.round(size * dpr);
  c.style.width = c.style.height = `${size}px`;
  const ctx = c.getContext('2d');
  ctx.scale((size * dpr) / 40, (size * dpr) / 40);
  ctx.translate(20, 20);
  drawFn(ctx);
  return c;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export class UI {
  constructor() {
    this.hud = $('hud');
    this.overlay = $('overlay');
    this.xpFill = $('xpfill');
    this.lvl = $('lvl');
    this.timer = $('timer');
    this.kills = $('kills');
    this.bossBar = $('bossbar');
    this.bossFill = $('bossfill');
    this.bannerEl = $('banner');
    this.invWeapons = $('inv-weapons');
    this.invPassives = $('inv-passives');
    this.pauseBtn = $('pausebtn');
    this.cache = {};
    this.bannerTimeout = null;
  }

  set(key, node, prop, value) {
    if (this.cache[key] === value) return;
    this.cache[key] = value;
    if (prop === 'text') node.textContent = value;
    else node.style[prop] = value;
  }

  showHud(visible) {
    this.hud.classList.toggle('hidden', !visible);
    if (!visible) this.cache = {};
  }

  updateHud(game) {
    const p = game.player;
    this.set('xp', this.xpFill, 'width', `${Math.min(100, (p.xp / p.xpToNext) * 100).toFixed(1)}%`);
    this.set('lvl', this.lvl, 'text', `LV ${p.level}`);
    this.set('time', this.timer, 'text', fmtTime(game.time));
    this.set('kills', this.kills, 'text', `${game.kills} plants pruned`);
    const boss = game.boss && !game.boss.dead ? game.boss : null;
    this.bossBar.classList.toggle('hidden', !boss);
    if (boss) this.set('boss', this.bossFill, 'width', `${Math.max(0, (boss.hp / boss.maxHp) * 100).toFixed(1)}%`);
  }

  refreshInventory(player) {
    this.invWeapons.replaceChildren();
    this.invPassives.replaceChildren();
    for (const w of player.weapons) {
      this.invWeapons.append(this.slot(ICONS[w.def.id], w.level, w.def.name));
    }
    for (const id of Object.keys(PASSIVE_DEFS)) {
      const lv = player.passive(id);
      if (lv) this.invPassives.append(this.slot(ICONS[id], lv, PASSIVE_DEFS[id].name));
    }
  }

  slot(icon, level, title) {
    const s = el('div', 'slot');
    s.title = title;
    s.append(makeIcon(icon, 30), el('span', 'slot-lv', String(level)));
    return s;
  }

  banner(text) {
    this.bannerEl.textContent = text;
    this.bannerEl.classList.add('show');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => this.bannerEl.classList.remove('show'), 3200);
  }

  panel(cls) {
    this.overlay.replaceChildren();
    this.overlay.classList.add('active');
    const p = el('div', `panel ${cls || ''}`);
    this.overlay.append(p);
    return p;
  }

  hideOverlay() {
    this.overlay.classList.remove('active');
    this.overlay.replaceChildren();
  }

  button(text, onClick, primary = false) {
    const b = el('button', primary ? 'btn primary' : 'btn', text);
    b.addEventListener('click', onClick);
    return b;
  }

  showMenu(onStart) {
    const p = this.panel('menu');
    const title = el('h1', 'title');
    title.innerHTML = 'Gardener<br><span>Survivor</span>';
    p.append(
      title,
      el('p', 'tagline', 'The plants have had enough of you. The feeling is mutual.'),
    );
    const how = el('ul', 'howto');
    for (const line of [
      'Move with WASD / arrow keys (drag on touch screens)',
      'Your tools attack on their own',
      'Collect seeds to level up and pick new tools',
      'Survive 10 minutes and defeat the Mutant Sunflower',
      'Esc / P to pause',
    ]) how.append(el('li', '', line));
    p.append(how, this.button('Start gardening  ⏎', onStart, true));
  }

  showLevelUp(choices, onPick, level) {
    const p = this.panel('levelup');
    p.append(el('h2', '', 'Level Up!'), el('p', 'sub', `Level ${level}: choose an upgrade`));
    const cards = el('div', 'cards');
    const openedAt = performance.now();
    choices.forEach((c, i) => {
      const d = describeChoice(c);
      const card = el('button', 'card');
      card.append(
        el('span', 'key', String(i + 1)),
        makeIcon(d.icon, 56),
        el('div', 'cname', d.name),
        el('div', d.tag === 'NEW!' ? 'ctag new' : 'ctag', d.tag),
        el('div', 'cdesc', d.desc),
      );
      // Ignore clicks in the first moments so a stray tap doesn't pick blindly.
      card.addEventListener('click', () => {
        if (performance.now() - openedAt > 250) onPick(i);
      });
      cards.append(card);
    });
    p.append(cards);
  }

  showPause(onResume, onQuit) {
    const p = this.panel('pause');
    p.append(el('h2', '', 'Paused'), this.button('Resume', onResume, true), this.button('Quit to menu', onQuit));
  }

  showEnd(won, stats, onRestart, onMenu) {
    const p = this.panel(won ? 'victory' : 'gameover');
    p.append(
      el('h2', '', won ? 'The Garden Is Safe!' : 'You Were Overgrown!'),
      el('p', 'sub', won ? 'The Mutant Sunflower has wilted. Time for a cup of tea.' : 'The weeds win this round...'),
    );
    const grid = el('div', 'stats');
    for (const [k, v] of [['Time survived', fmtTime(stats.time)], ['Level reached', stats.level], ['Plants pruned', stats.kills]]) {
      grid.append(el('div', 'k', k), el('div', 'v', String(v)));
    }
    p.append(grid, this.button('Play again  ⏎', onRestart, true), this.button('Main menu', onMenu));
  }
}
