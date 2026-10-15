export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.w = 800;
    this.h = 600;
    this.shake = 0;
  }

  snap(x, y) {
    this.x = x;
    this.y = y;
    this.shake = 0;
  }

  follow(tx, ty, dt) {
    const k = Math.min(1, dt * 8);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
    this.shake = Math.max(0, this.shake - dt * 25);
  }

  addShake(amount) {
    this.shake = Math.min(14, Math.max(this.shake, amount));
  }

  apply(ctx) {
    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    ctx.translate(this.w / 2 - this.x + sx, this.h / 2 - this.y + sy);
  }

  inView(x, y, margin = 0) {
    return Math.abs(x - this.x) < this.w / 2 + margin && Math.abs(y - this.y) < this.h / 2 + margin;
  }
}
