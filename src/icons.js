import { TAU, circle, ellipse, rrect, leaf } from './utils.js';

// World sprites that are also reused as icons.

export function drawTrowel(ctx, s = 1) {
  ctx.save();
  ctx.scale(s, s);
  ctx.fillStyle = '#8b5a2b';
  rrect(ctx, -13, -2.5, 10, 5, 2);
  ctx.fillStyle = '#5d3b1a';
  rrect(ctx, -4, -1.5, 3, 3, 1);
  ctx.fillStyle = '#cfd8dc';
  ctx.beginPath();
  ctx.moveTo(-1, -5);
  ctx.quadraticCurveTo(10, -7, 15, 0);
  ctx.quadraticCurveTo(10, 7, -1, 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#90a4ae';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

export function drawGnome(ctx, s = 1) {
  ctx.save();
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ellipse(ctx, 0, 12, 8, 3);
  ctx.fillStyle = '#6d4c41';
  rrect(ctx, -6, 9, 5, 3.5, 1.5);
  rrect(ctx, 1, 9, 5, 3.5, 1.5);
  ctx.fillStyle = '#2e5aa8';
  rrect(ctx, -7, -1, 14, 12, 4);
  ctx.fillStyle = '#f2c79b';
  circle(ctx, 0, -4, 4.8);
  ctx.fillStyle = '#f5f5f5';
  ctx.beginPath();
  ctx.moveTo(-5.5, -3);
  ctx.quadraticCurveTo(0, 11, 5.5, -3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ef9a9a';
  circle(ctx, 0, -3, 1.7);
  ctx.fillStyle = '#d63030';
  ctx.beginPath();
  ctx.moveTo(-6.5, -6);
  ctx.lineTo(6.5, -6);
  ctx.lineTo(1.5, -20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function shears(ctx) {
  ctx.save();
  ctx.rotate(-Math.PI / 4);
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.rotate(s * 0.3);
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.moveTo(0, -2.2);
    ctx.lineTo(16, 0);
    ctx.lineTo(0, 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e53935';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-4, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-8.5, 0, 4.5, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#455a64';
  circle(ctx, 0, 0, 2);
  ctx.restore();
}

function trowel(ctx) {
  ctx.save();
  ctx.rotate(-Math.PI / 4);
  drawTrowel(ctx, 1.1);
  ctx.restore();
}

function spray(ctx) {
  ctx.fillStyle = '#6ab04c';
  rrect(ctx, -8, -4, 14, 19, 3);
  ctx.fillStyle = '#fff';
  rrect(ctx, -6, 2, 10, 6, 1);
  ctx.fillStyle = '#7b1fa2';
  circle(ctx, -1, 5, 1.8);
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(-4, -8, 6, 4);
  ctx.fillStyle = '#333';
  rrect(ctx, -5, -13, 13, 5, 1.5);
  ctx.fillRect(8, -12, 3, 3);
  ctx.fillStyle = 'rgba(160,230,90,0.85)';
  circle(ctx, 14, -11, 1.8);
  circle(ctx, 17, -14, 1.4);
  circle(ctx, 17, -8, 1.4);
}

function hose(ctx) {
  ctx.strokeStyle = '#43a047';
  ctx.lineWidth = 3;
  for (const r of [11, 7.5, 4]) {
    ctx.beginPath();
    ctx.arc(-3, 2, r, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = '#f9a825';
  rrect(ctx, 6, -3, 7, 5, 1.5);
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.moveTo(16, -10);
  ctx.quadraticCurveTo(20, -4, 16, -2);
  ctx.quadraticCurveTo(12, -4, 16, -10);
  ctx.fill();
}

function torch(ctx) {
  ctx.translate(-3, 0);
  ctx.fillStyle = '#c62828';
  rrect(ctx, -13, -6, 9, 17, 3.5);
  ctx.fillStyle = '#ef5350';
  rrect(ctx, -11, -4, 3, 12, 1.5);
  ctx.fillStyle = '#616161';
  rrect(ctx, -5, -2, 12, 4, 1.5);
  ctx.fillStyle = '#424242';
  rrect(ctx, 5, -3, 4, 6, 1);
  ctx.fillStyle = '#ff7043';
  ctx.beginPath();
  ctx.moveTo(9, -5);
  ctx.quadraticCurveTo(17, -9, 20, 0);
  ctx.quadraticCurveTo(17, 9, 9, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ellipse(ctx, 13, 0, 4, 2.5);
}

function gnomes(ctx) {
  ctx.translate(0, 3);
  drawGnome(ctx, 1);
}

function rake(ctx) {
  ctx.save();
  ctx.rotate(0.45);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#8b5a2b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.lineTo(0, -8);
  ctx.stroke();
  ctx.strokeStyle = '#78909c';
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.lineTo(10, -8);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = -9; x <= 9; x += 4.5) {
    ctx.moveTo(x, -8);
    ctx.lineTo(x, -15);
  }
  ctx.stroke();
  ctx.restore();
}

function boots(ctx) {
  ctx.fillStyle = '#795548';
  rrect(ctx, -7, -13, 10, 17, 2);
  rrect(ctx, -7, -1, 17, 9, 4);
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(-7, 7, 17, 3);
  ctx.fillStyle = '#a1887f';
  ctx.fillRect(-7, -10, 10, 2);
}

function gloves(ctx) {
  ctx.fillStyle = '#c0ca33';
  rrect(ctx, -7, -3, 14, 13, 4);
  for (let i = 0; i < 4; i++) rrect(ctx, -7 + i * 3.7, -13, 3.2, 13, 1.6);
  ctx.save();
  ctx.translate(7, 2);
  ctx.rotate(-0.7);
  rrect(ctx, -1.5, -8, 3.4, 9, 1.6);
  ctx.restore();
  ctx.fillStyle = '#827717';
  ctx.fillRect(-8, 9, 16, 5);
}

function hat(ctx) {
  ctx.fillStyle = '#d4a93c';
  ellipse(ctx, 0, 5, 16, 5.5);
  ctx.fillStyle = '#f0cf6a';
  rrect(ctx, -8, -8, 16, 13, 6);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-8, 0, 16, 3);
}

function fertilizer(ctx) {
  ctx.fillStyle = '#8d6e63';
  rrect(ctx, -10, -11, 20, 24, 4);
  ctx.fillStyle = '#6d4c41';
  ctx.fillRect(-10, -11, 20, 5);
  leaf(ctx, 0, 9, 13, -0.4, '#66bb6a');
  leaf(ctx, 0, 9, 10, 0.6, '#81c784');
}

function pouch(ctx) {
  ctx.fillStyle = '#a1887f';
  circle(ctx, 0, 4, 10);
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(-8, -13);
  ctx.lineTo(8, -13);
  ctx.lineTo(6, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(-6, -8, 12, 3);
  ctx.fillStyle = '#7ed957';
  ellipse(ctx, -3, -13, 2, 3, -0.4);
  ellipse(ctx, 2, -14, 2, 3, 0.3);
  ctx.fillStyle = '#ffcf3f';
  ellipse(ctx, 5, -12, 2, 3, 0.6);
}

function sundial(ctx) {
  ctx.fillStyle = '#8d8d8d';
  ellipse(ctx, 0, 5, 15, 8);
  ctx.fillStyle = '#c4c4c4';
  ellipse(ctx, 0, 3, 13, 6.5);
  ctx.strokeStyle = '#757575';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.moveTo(Math.cos(a) * 9, 3 + Math.sin(a) * 4.5);
    ctx.lineTo(Math.cos(a) * 12, 3 + Math.sin(a) * 6);
  }
  ctx.stroke();
  ctx.strokeStyle = '#424242';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.lineTo(-9, 6);
  ctx.stroke();
  ctx.fillStyle = '#616161';
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.lineTo(0, -12);
  ctx.lineTo(7, 3);
  ctx.closePath();
  ctx.fill();
}

export function drawTomato(ctx, s = 1) {
  ctx.save();
  ctx.scale(s, s);
  ctx.fillStyle = '#e53935';
  circle(ctx, 0, 2, 11);
  ctx.fillStyle = '#ff8a80';
  ellipse(ctx, -4, -2, 3.5, 2.2, -0.5);
  ctx.fillStyle = '#43a047';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2;
    ellipse(ctx, Math.cos(a) * 3.5, -8 + Math.sin(a) * 2, 3.5, 1.5, a);
  }
  ctx.restore();
}

export const ICONS = {
  shears, trowel, spray, hose, torch, gnomes, rake,
  boots, gloves, hat, fertilizer, pouch, sundial,
  heal: (ctx) => drawTomato(ctx, 1),
};
