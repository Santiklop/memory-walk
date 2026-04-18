// Locale-aware procedural parallax backgrounds.
// The journey now reads as a travelogue: Siberia -> St Petersburg -> Belgium
// -> London -> Amsterdam, all without external art assets.

class Background {
  constructor(scene) {
    this.scene = scene;
  }

  build() {
    const s = this.scene;
    const firstBiome = BIOMES[0];

    this.skyGfx = s.add.graphics().setScrollFactor(0).setDepth(-100);
    this.sunGfx = s.add.graphics().setScrollFactor(0).setDepth(-99);
    this.cloudGfx = s.add.graphics().setDepth(-70).setScrollFactor(0.3, 1);
    this.farGfx = s.add.graphics().setDepth(-80).setScrollFactor(0.25, 1);
    this.midGfx = s.add.graphics().setDepth(-60).setScrollFactor(0.5, 1);
    this.waterGfx = s.add.graphics().setDepth(-58).setScrollFactor(0.62, 1);
    this.landmarkGfx = s.add.graphics().setDepth(-56).setScrollFactor(0.54, 1);
    this.treeGfx = s.add.graphics().setDepth(-55).setScrollFactor(0.55, 1);
    this.nearGfx = s.add.graphics().setDepth(-40);
    this.decorGfx = s.add.graphics().setDepth(10);

    this._paintSky(firstBiome.skyTop, firstBiome.skyBottom);
    this._paintSun(firstBiome.sunColor, firstBiome.sunY);

    this._paintClouds();
    this._paintRollingRange(this.farGfx, {
      yBase: WORLD.groundY - 190,
      amplitude: 110,
      biomeKey: 'far',
    });
    this._paintRollingRange(this.midGfx, {
      yBase: WORLD.groundY - 98,
      amplitude: 72,
      biomeKey: 'mid',
    });
    this._paintWaterways();
    this._paintLandmarks();
    this._paintTrees();
    this._paintGround();
    this._paintDecor();
  }

  _biomeIndexAt(x) {
    let biome = 0;
    for (let i = 0; i < MILESTONES.length; i++) {
      if (x >= MILESTONES[i].x - 300) biome = MILESTONES[i].biome;
    }
    return biome;
  }

  _biomeAt(x) {
    return BIOMES[this._biomeIndexAt(x)];
  }

  _regionSpan(idx) {
    const matches = MILESTONES.filter((m) => m.biome === idx);
    if (!matches.length) return { start: 0, end: WORLD.width };

    const first = matches[0];
    const last = matches[matches.length - 1];
    const nextDifferent = MILESTONES.find((m) => m.x > last.x && m.biome !== idx);

    return {
      start: first.id === MILESTONES[0].id ? 0 : Math.max(0, first.x - 520),
      end: nextDifferent ? Math.min(WORLD.width, nextDifferent.x - 220) : WORLD.width,
    };
  }

  _terrainScaleForBiome(name, layer) {
    const map = {
      siberia: { far: 1.25, mid: 0.82 },
      st_petersburg: { far: 0.45, mid: 0.28 },
      belgium: { far: 0.78, mid: 0.58 },
      london: { far: 0.32, mid: 0.2 },
      amsterdam: { far: 0.25, mid: 0.16 },
    };
    return map[name][layer];
  }

  _paintSky(top, bottom) {
    const g = this.skyGfx;
    const { viewW, viewH } = WORLD;
    g.clear();

    for (let i = 0; i < 60; i++) {
      const t = i / 59;
      g.fillStyle(lerpColor(top, bottom, t), 1);
      g.fillRect(0, Math.floor(i * viewH / 60), viewW, Math.ceil(viewH / 60) + 1);
    }
  }

  _paintSun(color, y) {
    const g = this.sunGfx;
    const cx = WORLD.viewW - 220;
    g.clear();

    for (let r = 160; r > 0; r -= 6) {
      g.fillStyle(color, (1 - r / 160) * 0.06);
      g.fillCircle(cx, y, r);
    }
    g.fillStyle(color, 0.92);
    g.fillCircle(cx, y, 46);
    g.fillStyle(0xffffff, 0.45);
    g.fillCircle(cx - 12, y - 12, 18);
  }

  _paintRollingRange(g, opts) {
    const { width, groundY } = WORLD;
    const { yBase, amplitude, biomeKey } = opts;
    g.clear();

    const step = 180;
    const points = [];
    for (let x = -step; x <= width + step; x += step) {
      const biome = this._biomeAt(Math.max(0, x));
      const scale = this._terrainScaleForBiome(biome.name, biomeKey);
      const nx = x / 220;
      const ridge = 0.5 + 0.5 * Math.sin(nx);
      const wobble = 0.3 * Math.sin(nx * 2.1 + 0.5);
      points.push({
        x,
        y: yBase - amplitude * scale * (ridge + wobble),
      });
    }

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const mid = (p1.x + p2.x) * 0.5;
      const biome = this._biomeAt(mid);
      const currentBiome = this._biomeIndexAt(mid);
      const nextBiome = this._biomeAt(mid + step);
      let color = biome[biomeKey];

      const nextBoundary = MILESTONES.find((m) => m.x > mid && m.biome !== currentBiome);
      if (nextBoundary && nextBoundary.x - mid < 420) {
        const blend = 1 - (nextBoundary.x - mid) / 420;
        color = lerpColor(color, nextBiome[biomeKey], blend);
      }

      g.fillStyle(color, biomeKey === 'far' ? 0.88 : 0.95);
      g.beginPath();
      g.moveTo(p1.x, p1.y);
      g.lineTo(p2.x, p2.y);
      g.lineTo(p2.x, groundY);
      g.lineTo(p1.x, groundY);
      g.closePath();
      g.fillPath();
    }
  }

  _paintClouds() {
    const g = this.cloudGfx;
    const rnd = mulberry32(98765);
    g.clear();

    for (let x = 140; x < WORLD.width; x += 200 + rnd() * 170) {
      const biome = this._biomeAt(x);
      const y = 74 + rnd() * 170;
      const scale = biome.name === 'london' ? 1 + rnd() * 0.9 : 0.65 + rnd() * 0.75;

      g.fillStyle(biome.cloud, 0.86);
      g.fillEllipse(x, y, 120 * scale, 36 * scale);
      g.fillEllipse(x - 28 * scale, y + 3, 70 * scale, 28 * scale);
      g.fillEllipse(x + 36 * scale, y + 2, 82 * scale, 30 * scale);
      g.fillStyle(0xffffff, biome.name === 'london' ? 0.28 : 0.46);
      g.fillEllipse(x - 6 * scale, y - 8, 54 * scale, 12 * scale);
    }
  }

  _paintWaterways() {
    const g = this.waterGfx;
    g.clear();

    const step = 84;
    for (let x = 0; x < WORLD.width; x += step) {
      const biome = this._biomeAt(x + step * 0.5);
      if (!['st_petersburg', 'london', 'amsterdam'].includes(biome.name)) continue;

      const y = biome.name === 'amsterdam' ? WORLD.groundY - 28 : WORLD.groundY - 34;
      g.fillStyle(biome.buildingDark, 0.48);
      g.fillRect(x, y - 7, step + 1, 7);
      g.fillStyle(biome.water, 0.92);
      g.fillRect(x, y, step + 1, 17);
      g.fillStyle(0xffffff, 0.18);
      g.fillRect(x, y + 3, step + 1, 2);
      g.fillRect(x + 12, y + 10, 24, 1);
      g.fillRect(x + 46, y + 7, 18, 1);
    }
  }

  _paintLandmarks() {
    this.landmarkGfx.clear();
    this._paintStPetersburg();
    this._paintBelgium();
    this._paintLondon();
    this._paintAmsterdam();
  }

  _paintStPetersburg() {
    const g = this.landmarkGfx;
    const span = this._regionSpan(1);
    const rnd = mulberry32(9101);
    const baseY = WORLD.groundY - 50;
    const pastel = [0xE8D5BF, 0xDCC7D4, 0xE7E1C9, 0xD7D5E9];
    const roofs = [0xB45E67, 0x6E8EA1, 0x708C6D];

    for (let x = span.start + 70; x < span.end; x += 150 + rnd() * 34) {
      const w = 82 + rnd() * 42;
      const h = 66 + rnd() * 42;
      const body = pastel[Math.floor(rnd() * pastel.length)];
      const roof = roofs[Math.floor(rnd() * roofs.length)];
      const left = x - w / 2;

      g.fillStyle(body, 0.98);
      g.fillRect(left, baseY - h, w, h);
      g.fillStyle(lerpColor(body, 0xffffff, 0.35), 0.82);
      g.fillRect(left + 4, baseY - h + 4, w - 8, h - 8);
      g.fillStyle(roof, 0.98);
      g.fillTriangle(left - 4, baseY - h + 10, left + w + 4, baseY - h + 10, x, baseY - h - 14);

      g.fillStyle(0xFFF3D7, 0.84);
      for (let wy = baseY - h + 16; wy < baseY - 14; wy += 18) {
        for (let wx = left + 10; wx < left + w - 10; wx += 16) {
          g.fillRect(wx, wy, 8, 10);
        }
      }
    }

    g.lineStyle(2, 0xE8DCCF, 0.9);
    for (let x = span.start; x < span.end; x += 54) {
      g.lineBetween(x, baseY + 12, x + 26, baseY + 12);
    }

    this._drawOnionDome(g, span.start + 860, baseY + 6, 1.02, 0xE7D6C6, 0x3F849A);
    this._drawOnionDome(g, span.start + 1960, baseY + 4, 1.16, 0xE7D6C6, 0xC06C5D);
    this._drawOnionDome(g, span.start + 3080, baseY + 10, 0.92, 0xE7D6C6, 0x789870);
  }

  _paintBelgium() {
    const g = this.landmarkGfx;
    const span = this._regionSpan(2);
    const rnd = mulberry32(7721);
    const baseY = WORLD.groundY - 38;

    for (let x = span.start; x < span.end + 80; x += 56) {
      const h = 12 + rnd() * 20;
      g.fillStyle(0x4A7A3E, 0.95);
      g.fillCircle(x, baseY - h * 0.4, 16 + rnd() * 7);
      g.fillStyle(0x5E944D, 0.96);
      g.fillCircle(x - 10, baseY - h * 0.55, 12 + rnd() * 5);
      g.fillCircle(x + 12, baseY - h * 0.52, 11 + rnd() * 5);
    }

    for (let x = span.start + 40; x < span.end; x += 120) {
      g.fillStyle(0xD2C58E, 0.9);
      g.fillRect(x, baseY - 26, 3, 18);
      g.fillRect(x + 26, baseY - 26, 3, 18);
      g.fillRect(x, baseY - 26, 29, 3);
    }
  }

  _paintLondon() {
    const g = this.landmarkGfx;
    const span = this._regionSpan(3);
    const rnd = mulberry32(32003);
    const baseY = WORLD.groundY - 48;
    const body = BIOMES[3].building;
    const shadow = BIOMES[3].buildingDark;

    for (let x = span.start + 60; x < span.end; x += 82 + rnd() * 34) {
      const w = 28 + rnd() * 32;
      const h = 46 + rnd() * 110;
      g.fillStyle(shadow, 0.98);
      g.fillRect(x - w / 2, baseY - h, w, h);

      if (rnd() > 0.72) {
        g.fillTriangle(x - 6, baseY - h, x + 6, baseY - h, x, baseY - h - 20);
      } else if (rnd() > 0.45) {
        g.fillRect(x - 4, baseY - h - 14, 8, 14);
      }
    }

    this._drawClockTower(g, span.start + 240, baseY + 4, 140, body, 0xF1E7C4);
    this._drawBridge(g, span.start + 750, baseY + 10, 280, 0x516777);
    this._drawBridge(g, span.start + 1080, baseY + 6, 220, 0x445665);
  }

  _paintAmsterdam() {
    const g = this.landmarkGfx;
    const span = this._regionSpan(4);
    const rnd = mulberry32(14021);
    const baseY = WORLD.groundY - 38;
    const bodies = [0xAF6449, 0xC97A56, 0x8C4D39, 0xD68E61];

    for (let x = span.start + 40; x < span.end - 140; x += 90 + rnd() * 18) {
      const w = 38 + rnd() * 14;
      const h = 64 + rnd() * 46;
      const body = bodies[Math.floor(rnd() * bodies.length)];
      const roof = lerpColor(body, 0xF4D8A1, 0.3);
      this._drawCanalHouse(g, x, baseY, w, h, body, roof);
    }

    for (let x = span.start + 120; x < span.end - 140; x += 360) {
      this._drawBridge(g, x, baseY + 8, 120, 0x5A3C30);
    }

    this._drawWindmill(g, span.end - 210, baseY + 12, 0xD5C7AF, 0x5B4438);
  }

  _drawOnionDome(g, x, baseY, scale, stone, domeColor) {
    const towerW = 26 * scale;
    const towerH = 104 * scale;
    const topY = baseY - towerH;

    g.fillStyle(stone, 1);
    g.fillRect(x - towerW / 2, topY, towerW, towerH);
    g.fillStyle(lerpColor(stone, 0xffffff, 0.35), 0.82);
    g.fillRect(x - towerW / 2 + 3, topY + 4, towerW - 6, towerH - 8);

    g.fillStyle(domeColor, 1);
    g.fillEllipse(x, topY - 12 * scale, 34 * scale, 42 * scale);
    g.fillStyle(lerpColor(domeColor, 0xffffff, 0.4), 0.78);
    g.fillEllipse(x - 4 * scale, topY - 18 * scale, 12 * scale, 16 * scale);

    g.fillStyle(0xEBCB71, 0.96);
    g.fillRect(x - 1, topY - 42 * scale, 2, 14 * scale);
    g.fillRect(x - 7 * scale, topY - 34 * scale, 14 * scale, 2);
  }

  _drawClockTower(g, x, baseY, h, body, face) {
    const w = 30;
    const topY = baseY - h;

    g.fillStyle(body, 1);
    g.fillRect(x - w / 2, topY, w, h);
    g.fillStyle(lerpColor(body, 0xffffff, 0.25), 0.7);
    g.fillRect(x - w / 2 + 4, topY + 4, w - 8, h - 8);
    g.fillStyle(0xD0B26D, 1);
    g.fillRect(x - 20, topY + 16, 40, 22);
    g.fillStyle(face, 1);
    g.fillCircle(x, topY + 27, 8);
    g.fillStyle(0x32404C, 1);
    g.fillRect(x - 0.5, topY + 20, 1, 7);
    g.fillRect(x, topY + 27, 5, 1);
    g.fillStyle(0xD0B26D, 1);
    g.fillTriangle(x - 18, topY, x + 18, topY, x, topY - 26);
  }

  _drawBridge(g, x, y, w, color) {
    g.lineStyle(4, color, 0.95);
    const points = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const px = x - w / 2 + w * t;
      const py = y - Math.sin(t * Math.PI) * 26;
      points.push(new Phaser.Math.Vector2(px, py));
    }
    g.strokePoints(points, false, false);

    g.lineStyle(3, color, 0.8);
    for (let i = -2; i <= 2; i++) {
      const px = x + i * (w / 5);
      g.lineBetween(px, y, px, y - 18 + Math.abs(i) * 3);
    }
  }

  _drawCanalHouse(g, x, baseY, w, h, body, roof) {
    const left = x - w / 2;
    const topY = baseY - h;
    const style = Math.floor((x / 17) % 3);

    g.fillStyle(body, 0.98);
    g.fillRect(left, topY, w, h);
    g.fillStyle(lerpColor(body, 0xffffff, 0.2), 0.72);
    g.fillRect(left + 4, topY + 4, w - 8, h - 8);

    g.fillStyle(roof, 1);
    if (style === 0) {
      g.fillTriangle(left - 2, topY + 8, left + w + 2, topY + 8, x, topY - 18);
    } else if (style === 1) {
      g.fillRect(left + 6, topY - 10, w - 12, 10);
      g.fillTriangle(left + 2, topY, left + w - 2, topY, x, topY - 16);
    } else {
      g.fillRect(left + 10, topY - 12, w - 20, 12);
      g.fillTriangle(left + 10, topY - 12, x, topY - 22, x, topY - 12);
      g.fillTriangle(x, topY - 22, left + w - 10, topY - 12, x, topY - 12);
    }

    g.fillStyle(0xFFF5C9, 0.9);
    for (let wy = topY + 14; wy < baseY - 18; wy += 16) {
      g.fillRect(left + 8, wy, 7, 10);
      g.fillRect(left + w - 15, wy, 7, 10);
    }

    g.fillStyle(0x3E2418, 0.9);
    g.fillRect(x - 5, baseY - 17, 10, 17);
  }

  _drawWindmill(g, x, baseY, body, sail) {
    const towerH = 106;
    g.fillStyle(body, 1);
    g.fillTriangle(x - 18, baseY, x + 18, baseY, x, baseY - towerH);
    g.fillStyle(0x8A5D42, 1);
    g.fillTriangle(x - 20, baseY - towerH + 8, x + 20, baseY - towerH + 8, x, baseY - towerH - 20);
    g.fillStyle(0x3F2A22, 1);
    g.fillRect(x - 5, baseY - 20, 10, 20);

    g.lineStyle(4, sail, 0.95);
    g.lineBetween(x, baseY - towerH + 8, x + 44, baseY - towerH - 18);
    g.lineBetween(x, baseY - towerH + 8, x - 44, baseY - towerH - 18);
    g.lineBetween(x, baseY - towerH + 8, x + 44, baseY - towerH + 34);
    g.lineBetween(x, baseY - towerH + 8, x - 44, baseY - towerH + 34);
    g.fillStyle(sail, 1);
    g.fillCircle(x, baseY - towerH + 8, 5);
  }

  _paintTrees() {
    const g = this.treeGfx;
    const rnd = mulberry32(12345);
    g.clear();

    for (let x = 180; x < WORLD.width; x += 70 + rnd() * 55) {
      const biome = this._biomeAt(x);
      const y = WORLD.groundY - 36 - rnd() * 22;

      if (biome.name === 'siberia') {
        this._drawPine(g, x, y, 58 + rnd() * 48, biome.tree);
      } else if (biome.name === 'st_petersburg') {
        if (rnd() > 0.55) {
          this._drawRoundTree(g, x, y, 52 + rnd() * 24, biome.tree, 0x6D7C6C);
        } else {
          this._drawBareTree(g, x, y, 58 + rnd() * 30);
        }
      } else if (biome.name === 'belgium') {
        this._drawRoundTree(g, x, y, 68 + rnd() * 30, biome.tree, 0x6DA659);
      } else if (biome.name === 'london') {
        this._drawRoundTree(g, x, y, 54 + rnd() * 20, biome.tree, 0x5F735B);
      } else {
        this._drawPoplar(g, x, y, 80 + rnd() * 24, biome.tree);
      }
    }
  }

  _drawPine(g, x, y, h, color) {
    g.fillStyle(0x4B3B31, 0.9);
    g.fillRect(x - 3, y - h * 0.22, 6, h * 0.22);

    g.fillStyle(color, 0.96);
    g.fillTriangle(x - 18, y - h * 0.28, x + 18, y - h * 0.28, x, y - h * 0.7);
    g.fillTriangle(x - 22, y - h * 0.08, x + 22, y - h * 0.08, x, y - h * 0.52);
    g.fillTriangle(x - 28, y + 4, x + 28, y + 4, x, y - h * 0.34);

    g.fillStyle(0xF9FDFF, 0.92);
    g.fillEllipse(x, y - h * 0.68, 14, 5);
    g.fillEllipse(x - 8, y - h * 0.47, 12, 4);
    g.fillEllipse(x + 10, y - h * 0.3, 14, 4);
  }

  _drawRoundTree(g, x, y, h, color, highlight) {
    g.fillStyle(0x5A3B24, 0.9);
    g.fillRect(x - 4, y - h * 0.34, 8, h * 0.34);
    g.fillStyle(color, 0.96);
    g.fillCircle(x, y - h * 0.62, h * 0.22);
    g.fillCircle(x - h * 0.14, y - h * 0.48, h * 0.18);
    g.fillCircle(x + h * 0.16, y - h * 0.44, h * 0.19);
    g.fillStyle(highlight, 0.72);
    g.fillCircle(x - h * 0.08, y - h * 0.7, h * 0.1);
  }

  _drawPoplar(g, x, y, h, color) {
    g.fillStyle(0x62442B, 0.9);
    g.fillRect(x - 3, y - h * 0.26, 6, h * 0.26);
    g.fillStyle(color, 0.95);
    g.fillEllipse(x, y - h * 0.55, 28, h * 0.7);
    g.fillStyle(0xffffff, 0.08);
    g.fillEllipse(x - 5, y - h * 0.72, 12, h * 0.18);
  }

  _drawBareTree(g, x, y, h) {
    g.lineStyle(3, 0x5A463A, 0.95);
    g.lineBetween(x, y, x, y - h);
    g.lineBetween(x, y - h * 0.5, x - 18, y - h * 0.74);
    g.lineBetween(x, y - h * 0.62, x + 16, y - h * 0.86);
    g.lineBetween(x - 12, y - h * 0.68, x - 22, y - h * 0.92);
    g.lineBetween(x + 8, y - h * 0.76, x + 22, y - h * 0.98);
  }

  _paintGround() {
    const g = this.nearGfx;
    const step = 74;
    g.clear();

    for (let x = 0; x < WORLD.width; x += step) {
      const biome = this._biomeAt(x + step * 0.5);
      const y = WORLD.groundY;

      g.fillStyle(biome.grass, 1);
      g.fillRect(x, y, step + 1, WORLD.viewH - y);
      g.fillStyle(biome.grassDark, 1);
      g.fillRect(x, y + 16, step + 1, WORLD.viewH - y - 16);

      if (biome.name === 'siberia') {
        g.fillStyle(0xFFFFFF, 0.98);
        g.fillRect(x, y, step + 1, 14);
        for (let i = 0; i < 4; i++) {
          const gx = x + 8 + i * 16;
          g.fillTriangle(gx - 3, y + 2, gx, y - (3 + (i % 2)), gx + 3, y + 2);
        }
      } else {
        for (let i = 0; i < 4; i++) {
          const gx = x + 8 + i * 17;
          const gh = 4 + ((i + x / step) % 3) * 2;
          g.fillStyle(biome.grass, 1);
          g.fillTriangle(gx - 2, y, gx, y - gh, gx + 2, y);
        }
      }

      if (biome.name === 'st_petersburg' && (Math.floor(x / step) % 4 === 0)) {
        g.fillStyle(0xDDD0C2, 0.85);
        g.fillRect(x, y + 6, step + 1, 6);
      }

      if (biome.name === 'london') {
        g.fillStyle(0x556B59, 0.55);
        g.fillRect(x, y + 4, step + 1, 4);
      }
    }
  }

  _paintDecor() {
    const g = this.decorGfx;
    const rnd = mulberry32(42);
    g.clear();

    for (let x = 50; x < WORLD.width; x += 50 + rnd() * 64) {
      const biome = this._biomeAt(x);
      const y = WORLD.groundY - 2;

      if (biome.name === 'siberia') {
        g.fillStyle(0xFFFFFF, 0.9);
        g.fillRect(x, y - 8, 1, 8);
        g.fillRect(x - 3, y - 5, 7, 1);
        g.fillRect(x - 2, y - 7, 5, 1);
      } else if (biome.name === 'st_petersburg') {
        if (rnd() > 0.82) {
          g.fillStyle(0x4B3F38, 1);
          g.fillRect(x, y - 22, 2, 18);
          g.fillStyle(0xFFE3A8, 0.92);
          g.fillCircle(x + 1, y - 24, 4);
        } else {
          g.fillStyle(0x6C8D70, 1);
          g.fillRect(x, y - 7, 1, 7);
          g.fillRect(x + 3, y - 6, 1, 6);
        }
      } else if (biome.name === 'belgium') {
        g.fillStyle(0x4C7B3E, 1);
        g.fillRect(x - 0.5, y - 5, 1, 5);
        g.fillStyle(biome.flower, 1);
        for (let a = 0; a < 5; a++) {
          const ang = (a / 5) * Math.PI * 2;
          g.fillCircle(x + Math.cos(ang) * 3, y - 6 + Math.sin(ang) * 3, 2);
        }
        g.fillStyle(0xFFF4A0, 1);
        g.fillCircle(x, y - 6, 1.5);
      } else if (biome.name === 'london') {
        if (rnd() > 0.7) {
          g.fillStyle(0x384650, 1);
          g.fillRect(x, y - 18, 3, 16);
          g.fillStyle(0xE7C989, 0.8);
          g.fillCircle(x + 1.5, y - 20, 3);
        } else {
          g.fillStyle(0x556455, 1);
          g.fillRect(x, y - 4, 4, 4);
        }
      } else {
        this._drawTulip(g, x, y, biome.flower);
      }
    }
  }

  _drawTulip(g, x, y, color) {
    g.fillStyle(0x4E7C3F, 1);
    g.fillRect(x - 0.5, y - 8, 1, 8);
    g.fillRect(x + 4 - 0.5, y - 7, 1, 7);
    g.fillStyle(color, 1);
    g.fillTriangle(x - 3, y - 8, x, y - 15, x + 3, y - 8);
    g.fillTriangle(x + 1, y - 7, x + 4, y - 14, x + 7, y - 7);
  }
}

// small deterministic PRNG so layouts are stable across reloads
function mulberry32(a) {
  return function() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
