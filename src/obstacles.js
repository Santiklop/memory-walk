// Locale-specific obstacles. They stay gentle and readable, but now match the
// setting of each chapter: snowdrifts in Siberia, luggage and benches in
// St Petersburg / London, hedges in Belgium, bicycles and flower pots in
// Amsterdam.

class Obstacles {
  constructor(scene, groundY) {
    this.scene = scene;
    this.groundY = groundY;
    this.group = scene.physics.add.staticGroup();
    this.decorGfx = scene.add.graphics().setDepth(9);
  }

  build() {
    const rnd = mulberry32(77);

    for (let i = 0; i < MILESTONES.length - 1; i++) {
      const a = MILESTONES[i].x;
      const b = MILESTONES[i + 1].x;
      const biome = this._biomeIndexAt((a + b) * 0.5);
      const types = this._typesForBiome(biome);
      const count = 2 + Math.floor(rnd() * 2);

      for (let k = 0; k < count; k++) {
        const t = (k + 1) / (count + 1);
        const x = a + (b - a) * t + (rnd() - 0.5) * 70;
        const kind = types[Math.floor(rnd() * types.length)];
        this._placeObstacle(x, kind, biome, rnd);
      }
    }
  }

  _biomeIndexAt(x) {
    let biome = 0;
    for (let i = 0; i < MILESTONES.length; i++) {
      if (x >= MILESTONES[i].x - 300) biome = MILESTONES[i].biome;
    }
    return biome;
  }

  _typesForBiome(biome) {
    switch (biome) {
      case 0: return ['snowdrift', 'stone', 'log'];
      case 1: return ['bench', 'crate', 'suitcase', 'stone'];
      case 2: return ['hedge', 'stone', 'log'];
      case 3: return ['bench', 'umbrella', 'crate', 'suitcase'];
      case 4: return ['bicycle', 'flowerPot', 'crate', 'bench'];
      default: return ['stone', 'log'];
    }
  }

  _placeObstacle(x, kind, biome, rnd) {
    const y = this.groundY;

    if (kind === 'snowdrift') {
      const w = 76, h = 24;
      this._drawSnowdrift(x, y - 2, w, h);
      this._makeBody(x, y - h / 2 + 1, w - 4, h);
    } else if (kind === 'stone') {
      const w = 42 + rnd() * 22;
      const h = 18 + rnd() * 8;
      this._drawStone(x, y - h / 2, w, h, biome);
      this._makeBody(x, y - h / 2, w, h);
    } else if (kind === 'log') {
      const w = 92, h = 22;
      this._drawLog(x, y - h, w, h);
      this._makeBody(x, y - h / 2 - 1, w, h + 2);
    } else if (kind === 'bench') {
      const w = 72, h = 18;
      this._drawBench(x, y - h, w, h, biome);
      this._makeBody(x, y - h / 2 - 2, w, h + 4);
    } else if (kind === 'crate') {
      const w = 42, h = 38;
      this._drawCrate(x, y - h, w, h);
      this._makeBody(x, y - h / 2, w, h);
    } else if (kind === 'suitcase') {
      const w = 54, h = 30;
      this._drawSuitcase(x, y - h, w, h, biome);
      this._makeBody(x, y - h / 2, w, h);
    } else if (kind === 'hedge') {
      const w = 84, h = 28;
      this._drawHedge(x, y - 4, w, h);
      this._makeBody(x, y - h / 2 + 2, w - 6, h - 2);
    } else if (kind === 'umbrella') {
      const w = 28, h = 52;
      this._drawUmbrella(x, y - h, h);
      this._makeBody(x, y - h / 2, w, h - 4);
    } else if (kind === 'bicycle') {
      const w = 74, h = 36;
      this._drawBicycle(x, y - 4, biome);
      this._makeBody(x, y - h / 2 + 1, w, h);
    } else if (kind === 'flowerPot') {
      const w = 36, h = 46;
      this._drawFlowerPot(x, y - h, w, h);
      this._makeBody(x, y - h / 2 + 1, w - 4, h);
    }
  }

  _makeBody(x, y, w, h) {
    const body = this.group.create(x, y, null).setVisible(false);
    body.displayWidth = w;
    body.displayHeight = h;
    body.refreshBody();
    return body;
  }

  _drawSnowdrift(x, groundY, w, h) {
    const g = this.decorGfx;
    g.fillStyle(0xDCEAF5, 1);
    g.fillEllipse(x, groundY - h * 0.35, w, h);
    g.fillEllipse(x - w * 0.22, groundY - h * 0.25, w * 0.5, h * 0.78);
    g.fillEllipse(x + w * 0.18, groundY - h * 0.3, w * 0.46, h * 0.7);
    g.fillStyle(0xFFFFFF, 0.94);
    g.fillEllipse(x - 10, groundY - h * 0.55, w * 0.42, h * 0.34);
    g.fillEllipse(x + 12, groundY - h * 0.48, w * 0.28, h * 0.26);
  }

  _drawBench(x, topY, w, h, biome) {
    const g = this.decorGfx;
    const wood = biome === 3 ? 0x3D5664 : biome === 4 ? 0x5B7C53 : 0x6B4A2E;
    const legs = 0xD7CABC;

    g.fillStyle(wood, 1);
    g.fillRoundedRect(x - w / 2, topY, w, 6, 2);
    g.fillRect(x - w / 2 + 6, topY + 6, 5, h - 6);
    g.fillRect(x + w / 2 - 11, topY + 6, 5, h - 6);
    g.fillStyle(legs, 0.9);
    g.fillRect(x - w / 2 + 8, topY + 6, 1.5, h - 4);
    g.fillRect(x + w / 2 - 9, topY + 6, 1.5, h - 4);
    g.fillStyle(0xffffff, 0.14);
    g.fillRect(x - w / 2 + 2, topY + 1, w - 4, 2);
  }

  _drawStone(x, cy, w, h, biome) {
    const g = this.decorGfx;
    g.fillStyle(biome === 0 ? 0xA3B5C5 : 0x7E8797, 1);
    g.fillEllipse(x, cy, w, h);
    g.fillStyle(biome === 0 ? 0xD9E5F1 : 0x9AA3B3, 0.92);
    g.fillEllipse(x - w * 0.2, cy - h * 0.2, w * 0.58, h * 0.46);
    if (biome !== 0) {
      g.fillStyle(0x6FA05A, 0.74);
      g.fillEllipse(x + w * 0.15, cy - h * 0.24, w * 0.24, 3);
    }
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

  _drawCrate(x, topY, w, h) {
    const g = this.decorGfx;
    g.fillStyle(0x9B6C43, 1);
    g.fillRect(x - w / 2, topY, w, h);
    g.fillStyle(0xB88455, 1);
    g.fillRect(x - w / 2 + 3, topY + 3, w - 6, h - 6);
    g.fillStyle(0x7C5232, 1);
    g.fillRect(x - w / 2 + 6, topY + 2, 4, h - 4);
    g.fillRect(x + w / 2 - 10, topY + 2, 4, h - 4);
    g.fillRect(x - w / 2 + 2, topY + h / 2 - 2, w - 4, 4);
    g.lineStyle(2, 0x7C5232, 1);
    g.lineBetween(x - w / 2 + 6, topY + 5, x + w / 2 - 6, topY + h - 5);
    g.lineBetween(x + w / 2 - 6, topY + 5, x - w / 2 + 6, topY + h - 5);
  }

  _drawSuitcase(x, topY, w, h, biome) {
    const g = this.decorGfx;
    const bag = biome === 3 ? 0x4E6077 : 0x744B5D;

    g.fillStyle(bag, 1);
    g.fillRoundedRect(x - w / 2, topY + 6, w, h - 6, 6);
    g.fillStyle(0xE6C7A3, 0.95);
    g.fillRoundedRect(x - 9, topY, 18, 10, 4);
    g.fillStyle(0xffffff, 0.12);
    g.fillRect(x - w / 2 + 4, topY + 10, w - 8, 4);
    g.fillStyle(0xD8BA91, 0.9);
    g.fillRect(x - w / 2 + 8, topY + 14, 4, h - 12);
    g.fillRect(x + w / 2 - 12, topY + 14, 4, h - 12);
  }

  _drawHedge(x, groundY, w, h) {
    const g = this.decorGfx;
    g.fillStyle(0x467A38, 1);
    g.fillEllipse(x, groundY - h * 0.4, w, h);
    g.fillEllipse(x - w * 0.24, groundY - h * 0.46, w * 0.4, h * 0.72);
    g.fillEllipse(x + w * 0.23, groundY - h * 0.42, w * 0.36, h * 0.68);
    g.fillStyle(0x6CAA5A, 0.82);
    g.fillCircle(x - 18, groundY - h * 0.62, 5);
    g.fillCircle(x + 8, groundY - h * 0.55, 4);
    g.fillCircle(x + 22, groundY - h * 0.5, 3);
  }

  _drawUmbrella(x, topY, h) {
    const g = this.decorGfx;
    g.lineStyle(3, 0x394B63, 1);
    g.lineBetween(x, topY + 8, x, topY + h - 6);
    g.lineBetween(x, topY + h - 6, x + 8, topY + h - 2);
    g.fillStyle(0xC94B53, 1);
    g.fillTriangle(x - 14, topY + 10, x + 14, topY + 10, x, topY + 30);
    g.fillStyle(0xffffff, 0.16);
    g.fillTriangle(x - 10, topY + 12, x + 4, topY + 12, x - 2, topY + 22);
  }

  _drawBicycle(x, groundY, biome) {
    const g = this.decorGfx;
    const frame = biome === 4 ? 0xF28B47 : 0x3C5060;
    const wheelY = groundY - 8;

    g.lineStyle(3, 0x2B2B2B, 1);
    g.strokeCircle(x - 22, wheelY, 12);
    g.strokeCircle(x + 22, wheelY, 12);

    g.lineStyle(3, frame, 1);
    g.lineBetween(x - 22, wheelY, x, wheelY - 16);
    g.lineBetween(x, wheelY - 16, x + 18, wheelY - 2);
    g.lineBetween(x - 2, wheelY - 2, x + 22, wheelY);
    g.lineBetween(x - 2, wheelY - 2, x - 22, wheelY);
    g.lineBetween(x, wheelY - 16, x - 4, wheelY - 2);
    g.lineBetween(x + 2, wheelY - 18, x + 12, wheelY - 18);
    g.lineBetween(x + 8, wheelY - 12, x + 14, wheelY - 22);
    g.lineBetween(x - 6, wheelY - 20, x + 2, wheelY - 20);
  }

  _drawFlowerPot(x, topY, w, h) {
    const g = this.decorGfx;
    g.fillStyle(0xA85E3B, 1);
    g.fillRoundedRect(x - w / 2 + 2, topY + 12, w - 4, h - 12, 4);
    g.fillStyle(0xC97A52, 1);
    g.fillRect(x - w / 2, topY + 8, w, 8);
    g.fillStyle(0x4A7E3E, 1);
    g.fillRect(x - 1, topY - 2, 2, 16);
    g.fillRect(x - 7, topY + 2, 2, 14);
    g.fillRect(x + 5, topY + 1, 2, 15);
    g.fillStyle(0xFF6B73, 1);
    g.fillTriangle(x - 10, topY + 4, x - 6, topY - 4, x - 2, topY + 4);
    g.fillTriangle(x - 2, topY + 1, x + 2, topY - 8, x + 6, topY + 1);
    g.fillTriangle(x + 6, topY + 3, x + 10, topY - 4, x + 14, topY + 3);
  }
}
