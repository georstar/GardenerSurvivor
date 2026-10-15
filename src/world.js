import { hash2, TAU } from './utils.js';

const TILE = 96;
const FLOWER_COLORS = ['#ffffff', '#fff176', '#f48fb1', '#ce93d8', '#ffab91', '#90caf9'];

// Endless lawn: every tile's decorations come from a hash of its coords,
// so the world looks the same whenever you walk back to a spot.
export function drawBackground(ctx, cam) {
  const x0 = cam.x - cam.w / 2 - 40, x1 = cam.x + cam.w / 2 + 40;
  const y0 = cam.y - cam.h / 2 - 40, y1 = cam.y + cam.h / 2 + 40;
  ctx.fillStyle = '#6cae4b';
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);

  const tx0 = Math.floor(x0 / TILE), tx1 = Math.floor(x1 / TILE);
  const ty0 = Math.floor(y0 / TILE), ty1 = Math.floor(y1 / TILE);

  // Pass 1: soft grass patches and dirt
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const bx = tx * TILE, by = ty * TILE;
      const p = hash2(tx, ty, 2);
      if (p < 0.3) {
        ctx.fillStyle = p < 0.15 ? '#76b856' : '#64a444';
        ctx.beginPath();
        ctx.ellipse(bx + TILE / 2, by + TILE / 2, 30 + p * 120, 20 + p * 70, p * 6, 0, TAU);
        ctx.fill();
      }
      const d = hash2(tx, ty, 1);
      if (d > 0.93) {
        const cx = bx + hash2(tx, ty, 3) * TILE, cy = by + hash2(tx, ty, 4) * TILE;
        ctx.fillStyle = '#8d6e4a';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 22, 13, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#a1825a';
        ctx.beginPath();
        ctx.ellipse(cx - 4, cy - 2, 13, 7, 0, 0, TAU);
        ctx.fill();
      } else if (d > 0.9) {
        const cx = bx + hash2(tx, ty, 3) * TILE, cy = by + hash2(tx, ty, 4) * TILE;
        ctx.fillStyle = '#9e9e9e';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 8, 6, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#bdbdbd';
        ctx.beginPath();
        ctx.ellipse(cx - 2, cy - 2, 4, 3, 0, 0, TAU);
        ctx.fill();
      }
    }
  }

  // Pass 2: grass tufts, batched into a single stroke
  ctx.strokeStyle = '#4f9235';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      for (let k = 0; k < 3; k++) {
        const gx = tx * TILE + hash2(tx, ty, 10 + k) * TILE;
        const gy = ty * TILE + hash2(tx, ty, 20 + k) * TILE;
        ctx.moveTo(gx - 4, gy - 6); ctx.lineTo(gx - 1, gy);
        ctx.moveTo(gx, gy - 8); ctx.lineTo(gx, gy);
        ctx.moveTo(gx + 4, gy - 6); ctx.lineTo(gx + 1, gy);
      }
    }
  }
  ctx.stroke();

  // Pass 3: little flowers
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const f = hash2(tx, ty, 5);
      if (f > 0.16) continue;
      const fx = tx * TILE + hash2(tx, ty, 6) * TILE, fy = ty * TILE + hash2(tx, ty, 7) * TILE;
      ctx.fillStyle = FLOWER_COLORS[Math.floor(hash2(tx, ty, 8) * FLOWER_COLORS.length)];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(a) * 3.5, fy + Math.sin(a) * 3.5, 2.8, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#ffca28';
      ctx.beginPath();
      ctx.arc(fx, fy, 2.2, 0, TAU);
      ctx.fill();
    }
  }
}
