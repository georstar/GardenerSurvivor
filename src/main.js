import { Camera } from './camera.js';
import { initInput, onKey, drawJoystick } from './input.js';
import { drawBackground } from './world.js';
import { Game } from './game.js';
import { UI } from './ui.js';
import { generateChoices, applyChoice } from './upgrades.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const camera = new Camera();
const ui = new UI();
// Debug keys (` = skip a minute, L = level up, H = heal) only with ?debug in the URL.
const DEBUG = new URLSearchParams(location.search).has('debug');

const STEP = 1 / 60;
let dpr = 1;
let state = 'menu'; // menu | playing | paused | levelup | gameover | victory
let game = null;
let choices = [];
let menuT = 0;
let acc = 0;
let last = performance.now();

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  camera.w = window.innerWidth;
  camera.h = window.innerHeight;
}

function startGame() {
  game = new Game(camera, ui);
  if (DEBUG) window.game = game;
  state = 'playing';
  acc = 0;
  ui.hideOverlay();
  ui.showHud(true);
  ui.refreshInventory(game.player);
}

function openLevelUp() {
  state = 'levelup';
  choices = generateChoices(game.player);
  ui.showLevelUp(choices, pick, game.player.level - game.pendingLevelUps + 1);
}

function pick(i) {
  if (state !== 'levelup' || !choices[i]) return;
  applyChoice(game.player, choices[i]);
  game.pendingLevelUps--;
  ui.refreshInventory(game.player);
  if (game.pendingLevelUps > 0) {
    openLevelUp();
  } else {
    state = 'playing';
    ui.hideOverlay();
  }
}

function pause() {
  if (state !== 'playing') return;
  state = 'paused';
  ui.showPause(resume, toMenu);
}

function resume() {
  if (state !== 'paused') return;
  state = 'playing';
  ui.hideOverlay();
}

function toMenu() {
  state = 'menu';
  game = null;
  ui.showHud(false);
  ui.showMenu(startGame);
}

function endGame(won) {
  state = won ? 'victory' : 'gameover';
  const p = game.player;
  ui.showEnd(won, { time: game.time, level: p.level, kills: game.kills }, startGame, toMenu);
}

onKey((code) => {
  if (state === 'menu' && (code === 'Enter' || code === 'Space')) startGame();
  else if (state === 'playing' && (code === 'Escape' || code === 'KeyP')) pause();
  else if (state === 'paused' && (code === 'Escape' || code === 'KeyP')) resume();
  else if (state === 'levelup' && /^(Digit|Numpad)[1-3]$/.test(code)) pick(Number(code.slice(-1)) - 1);
  else if ((state === 'gameover' || state === 'victory') && code === 'Enter') startGame();

  if (DEBUG && game && state === 'playing') {
    if (code === 'Backquote') game.time += 60;
    if (code === 'KeyL') game.pendingLevelUps++;
    if (code === 'KeyH') game.player.hp = game.player.maxHp;
  }
});

function drawOverlays() {
  const p = game.player;
  const low = p.hp / p.maxHp;
  if (low < 0.35 && p.hp > 0) {
    const pulse = 0.5 + Math.sin(performance.now() / 180) * 0.15;
    const g = ctx.createRadialGradient(camera.w / 2, camera.h / 2, Math.min(camera.w, camera.h) * 0.35,
      camera.w / 2, camera.h / 2, Math.max(camera.w, camera.h) * 0.7);
    g.addColorStop(0, 'rgba(200,0,0,0)');
    g.addColorStop(1, `rgba(200,0,0,${(1 - low / 0.35) * pulse})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, camera.w, camera.h);
  }
  drawJoystick(ctx);
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!game) {
    camera.x = menuT * 30;
    camera.y = Math.sin(menuT * 0.2) * 80;
  }
  ctx.save();
  camera.apply(ctx);
  drawBackground(ctx, camera);
  if (game) game.draw(ctx);
  ctx.restore();
  if (game) {
    drawOverlays();
    ui.updateHud(game);
  }
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (state === 'playing') {
    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      game.update(STEP);
      if (game.player.hp <= 0) { endGame(false); break; }
      if (game.won) { endGame(true); break; }
      if (game.pendingLevelUps > 0) { openLevelUp(); break; }
    }
    if (state !== 'playing') acc = 0;
  } else {
    menuT += dt;
  }
  render();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
});
document.getElementById('pausebtn').addEventListener('click', pause);

resize();
initInput(canvas);
ui.showMenu(startGame);
requestAnimationFrame(frame);
