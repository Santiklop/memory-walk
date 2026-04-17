// Obstacles — gentle scenery she jumps over. Nothing harmful:
//   - bench: low wooden bench (jumpable)
//   - puddle: cosmetic (not solid) — but it slows visual passage
//   - stone: small mossy rock
//   - log: fallen log (wider)
//
// Obstacles are procedurally placed between milestones.

class Obstacles {
  constructor(scene, groundY) {
    this.scene = scene;
    this.groundY = groundY;
    this.group = scene.physics.add.staticGroup();
    this.decorGfx = scene.add.graphics().setDepth(9);
  }

  build() {
    const rnd = mulberry32(77);
    const types = ['bench', 'stone', 'log'];

    // place ~2–3 obstacles between each pair of milestones
    for (let i = 0; i < MILESTONES.length - 1; i++) {
      const a = MILESTONES[i].x;
      const b = MILESTONES[i + 1].x;
      const count = 2 + Math.floor(rnd() * 2);
      for (let k = 0; k < count; k++) {
        const t = (k + 1) / (count + 1);
        const x = a + (b - a) * t + (rnd() - 0.5) * 80;
        const kind = types[Math.floor(rnd() * types.length)];
        this._placeObstacle(x, kind, rnd);
      }
    }
  }

  _placeObstacle(x, kind, rnd) {
    const y = this.groundY;
    const s = this.scene;

    if (kind === 'bench') {
      const w = 70, h = 18;
      this._drawBench(x, y - h, w, h);
      const body = this.group.create(x, y - h / 2 - 2, null).setVisible(false);
      body.displayWidth = w;
      body.displayHeight = h + 4;
      body.refreshBody();
    } else if (kind === 'stone') {
      const w = 40 + rnd() * 20, h = 18 + rnd() * 8;
      this._drawStone(x, y - h / 2, w, h);
      const body = this.group.create(x, y - h / 2, null).setVisible(false);
      body.displayWidth = w;
      body.displayHeight = h;
      body.refreshBody();
    } else if (kind === 'log') {
      const w = 90, h = 22;
      this._drawLog(x, y - h, w, h);
      const body = this.group.create(x, y - h / 2 - 1, null).setVisible(false);
      body.displayWidth = w;
      body.displayHeight = h + 2;
      body.refreshBody();
    }
  }

  _drawBench(x, topY, w, h) {
    const g = this.decorGfx;
    g.fillStyle(0x6B4A2E, 1);
    // seat
    g.fillRoundedRect(x - w / 2, topY, w, 6, 2);
    // legs
    g.fillRect(x - w / 2 + 6, topY + 6, 5, h - 6);
    g.fillRect(x + w / 2 - 11, topY + 6, 5, h - 6);
    // highlight
    g.fillStyle(0xffffff, 0.12);
    g.fillRect(x - w / 2 + 2, topY + 1, w - 4, 2);
  }

  _drawStone(x, cy, w, h) {
    const g = this.decorGfx;
    g.fillStyle(0x7E8797, 1);
    g.fillEllipse(x, cy, w, h);
    g.fillStyle(0x9AA3B3, 0.9);
    g.fillEllipse(x - w * 0.2, cy - h * 0.2, w * 0.6, h * 0.5);
    // moss
    g.fillStyle(0x6FA05A, 0.75);
    g.fillEllipse(x + w * 0.15, cy - h * 0.25, w * 0.25, 3);
    g.fillEllipse(x - w * 0.3, cy - h * 0.15, w * 0.15, 2);
  }

  _drawLog(x, topY, w, h) {
    const g = this.decorGfx;
    g.fillStyle(0x7A4F30, 1);
    g.fillRoundedRect(x - w / 2, topY, w, h, h / 2);
    g.fillStyle(0x9C6B44, 1);
    g.fillCircle(x - w / 2 + h / 2, topY + h / 2, h / 2 - 2);
    g.fillCircle(x + w / 2 - h / 2, topY + h / 2, h / 2 - 2);
    g.lineStyle(1, 0x5E3C23, 1);
    g.strokeCircle(x - w / 2 + h / 2, topY + h / 2, h / 2 - 4);
    g.strokeCircle(x + w / 2 - h / 2, topY + h / 2, h / 2 - 4);
  }
}
