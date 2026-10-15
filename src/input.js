// Keyboard uses KeyboardEvent.code so WASD works on any keyboard layout.
const keys = new Set();
const handlers = [];
const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

const touch = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
const JOY_RADIUS = 50;

export function initInput(canvas) {
  window.addEventListener('keydown', (e) => {
    if (PREVENT.has(e.code)) e.preventDefault();
    if (!e.repeat) handlers.forEach((h) => h(e.code));
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (touch.active) return;
    const t = e.changedTouches[0];
    Object.assign(touch, { active: true, id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY });
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === touch.id) { touch.x = t.clientX; touch.y = t.clientY; }
    }
  }, { passive: false });
  const end = (e) => {
    for (const t of e.changedTouches) if (t.identifier === touch.id) touch.active = false;
  };
  canvas.addEventListener('touchend', end);
  canvas.addEventListener('touchcancel', end);
}

export function onKey(fn) {
  handlers.push(fn);
}

export function getMove() {
  let x = 0, y = 0;
  if (touch.active) {
    x = (touch.x - touch.ox) / JOY_RADIUS;
    y = (touch.y - touch.oy) / JOY_RADIUS;
    if (Math.hypot(x, y) < 0.15) return { x: 0, y: 0 };
  } else {
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  }
  const l = Math.hypot(x, y);
  if (l > 1) { x /= l; y /= l; }
  return { x, y };
}

export function drawJoystick(ctx) {
  if (!touch.active) return;
  let dx = touch.x - touch.ox, dy = touch.y - touch.oy;
  const l = Math.hypot(dx, dy);
  if (l > JOY_RADIUS) { dx = (dx / l) * JOY_RADIUS; dy = (dy / l) * JOY_RADIUS; }
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(touch.ox, touch.oy, JOY_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(touch.ox + dx, touch.oy + dy, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
