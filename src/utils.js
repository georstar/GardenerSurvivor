export const TAU = Math.PI * 2;

export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;

export function dist2(ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  return dx * dx + dy * dy;
}

export function normalize(x, y) {
  const l = Math.hypot(x, y);
  return l > 0 ? { x: x / l, y: y / l } : { x: 0, y: 0 };
}

// Signed smallest difference between two angles, in [-PI, PI].
export function angleDiff(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

// Deterministic 0..1 hash of integer coords, used for procedural scenery.
export function hash2(x, y, seed = 0) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function weightedPick(items, weightOf) {
  let total = 0;
  for (const it of items) total += weightOf(it);
  let r = Math.random() * total;
  for (const it of items) {
    r -= weightOf(it);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

export function fmtTime(s) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// Uniform grid for fast "who is near this point" queries.
export class SpatialHash {
  constructor(cellSize = 64) {
    this.cs = cellSize;
    this.map = new Map();
  }
  clear() {
    this.map.clear();
  }
  key(cx, cy) {
    return (cx + 32768) * 65536 + (cy + 32768);
  }
  insert(e) {
    const k = this.key(Math.floor(e.x / this.cs), Math.floor(e.y / this.cs));
    let bucket = this.map.get(k);
    if (!bucket) this.map.set(k, (bucket = []));
    bucket.push(e);
  }
  forEachNear(x, y, r, fn) {
    const cs = this.cs;
    const x0 = Math.floor((x - r) / cs), x1 = Math.floor((x + r) / cs);
    const y0 = Math.floor((y - r) / cs), y1 = Math.floor((y + r) / cs);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const bucket = this.map.get(this.key(cx, cy));
        if (bucket) for (let i = 0; i < bucket.length; i++) fn(bucket[i]);
      }
    }
  }
}

// ---------- drawing helpers ----------

export function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

export function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  ctx.fill();
}

export function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  ctx.fill();
}

// A leaf whose base is at (x, y), pointing "up" rotated by angle.
export function leaf(ctx, x, y, len, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.45, -len * 0.5, 0, -len);
  ctx.quadraticCurveTo(-len * 0.45, -len * 0.5, 0, 0);
  ctx.fill();
  ctx.restore();
}

// Cartoon eyes looking toward +x, with optional angry brows.
export function eyes(ctx, r, y = -0.1, angry = true, pupil = '#1b1b1b') {
  const ex = r * 0.33, ey = r * y, er = r * 0.26, off = r * 0.12;
  ctx.fillStyle = '#fff';
  circle(ctx, -ex + off, ey, er);
  circle(ctx, ex + off, ey, er);
  ctx.fillStyle = pupil;
  circle(ctx, -ex + off + er * 0.35, ey + er * 0.1, er * 0.5);
  circle(ctx, ex + off + er * 0.35, ey + er * 0.1, er * 0.5);
  if (angry) {
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = Math.max(1.5, r * 0.1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-ex - er + off, ey - er * 1.5);
    ctx.lineTo(-ex + er * 0.8 + off, ey - er * 0.75);
    ctx.moveTo(ex + er + off, ey - er * 1.5);
    ctx.lineTo(ex - er * 0.8 + off, ey - er * 0.75);
    ctx.stroke();
  }
}
