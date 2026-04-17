// Procedural parallax backgrounds — painterly Rayman-inspired look,
// drawn with Phaser Graphics. No external art needed.
//
// 4 layers from back to front:
//   0: sky gradient + sun/moon + stars (fixed / very slow)
//   1: far mountains (slow parallax)
//   2: mid hills + trees (medium parallax)
//   3: near foreground grass + foliage + flowers (full world speed)
//
// Palette cross-fades between biomes are handled by drawing each biome
// slice edge-to-edge and interpolating color at biome boundaries.

class Background {
  constructor(scene) {
    this.scene = scene;
    this.layers = [];
  }

  build() {
    const { viewW, viewH, width, groundY } = WORLD;
    const s = this.scene;

    // --- layer 0: sky + sun (camera-locked, repaints as biome changes) ---
    this.skyGfx = s.add.graphics().setScrollFactor(0).setDepth(-100);
    this.sunGfx = s.add.graphics().setScrollFactor(0).setDepth(-99);
    this.currentSky = { top: BIOMES[0].skyTop, bottom: BIOMES[0].skyBottom, sun: BIOMES[0].sunColor };
    this._paintSky(this.currentSky.top, this.currentSky.bottom);
    this._paintSun(this.currentSky.sun, BIOMES[0].sunY);

    // --- layer 1: far mountains ---
    this.farGfx = s.add.graphics().setDepth(-80);
    this._paintRollingRange(this.farGfx, {
      yBase: groundY - 180,
      amplitude: 120,
      step: 260,
      biomeKey: 'far',
      alpha: 0.85,
    });

    // --- layer 2: mid hills ---
    this.midGfx = s.add.graphics().setDepth(-60);
    this._paintRollingRange(this.midGfx, {
      yBase: groundY - 90,
      amplitude: 70,
      step: 180,
      biomeKey: 'mid',
      alpha: 0.95,
    });

    // scattered trees on mid layer
    this.treeGfx = s.add.graphics().setDepth(-55);
    this._paintTrees();

    // clouds (mid layer, scrolling with slight parallax)
    this.cloudGfx = s.add.graphics().setDepth(-70);
    this._paintClouds();

    // --- layer 3: near ground + grass ---
    this.nearGfx = s.add.graphics().setDepth(-40);
    this._paintGround();

    // foreground decoration (flowers, bushes)
    this.decorGfx = s.add.graphics().setDepth(10);
    this._paintDecor();

    // parallax factors
    this.farGfx.setScrollFactor(0.25, 1);
    this.midGfx.setScrollFactor(0.5, 1);
    this.treeGfx.setScrollFactor(0.55, 1);
    this.cloudGfx.setScrollFactor(0.3, 1);
  }

  _paintSky(top, bottom) {
    const g = this.skyGfx;
    g.clear();
    const { viewW, viewH } = WORLD;
    // vertical gradient using 60 horizontal strips
    const strips = 60;
    for (let i = 0; i < strips; i++) {
      const t = i / (strips - 1);
      const c = lerpColor(top, bottom, t);
      g.fillStyle(c, 1);
      g.fillRect(0, Math.floor(i * viewH / strips), viewW, Math.ceil(viewH / strips) + 1);
    }
  }

  _paintSun(color, y) {
    const g = this.sunGfx;
    g.clear();
    // soft glow using concentric circles
    const cx = WORLD.viewW - 220, cy = y;
    for (let r = 160; r > 0; r -= 6) {
      const alpha = (1 - r / 160) * 0.06;
      g.fillStyle(color, alpha);
      g.fillCircle(cx, cy, r);
    }
    g.fillStyle(color, 0.95);
    g.fillCircle(cx, cy, 46);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(cx - 10, cy - 12, 22);
  }

  // biome-aware wavy range drawing for mountains/hills
  _paintRollingRange(g, opts) {
    const { width, groundY } = WORLD;
    const { yBase, amplitude, step, biomeKey, alpha } = opts;
    g.clear();

    const points = [];
    for (let x = -step; x <= width + step; x += step) {
      const nx = x / 180;
      const h = yBase - amplitude * (0.5 + 0.5 * Math.sin(nx)) - amplitude * 0.3 * Math.sin(nx * 2.3);
      points.push({ x, y: h });
    }

    // draw segmented polygons per biome-stretch so color shifts between biomes
    const biomeOfX = (x) => {
      // biome boundaries defined by milestones
      let b = 0;
      for (let i = 0; i < MILESTONES.length; i++) {
        if (x >= MILESTONES[i].x - 300) b = MILESTONES[i].biome;
      }
      return b;
    };

    // draw fills in overlapping tiled strokes; we'll approximate by
    // drawing per-segment quads with lerped color.
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const mid = (p1.x + p2.x) / 2;
      const bIdx = biomeOfX(mid);
      const nextBIdx = biomeOfX(mid + step);
      const color = BIOMES[bIdx][biomeKey];
      // blend toward next biome near its threshold
      let blendT = 0;
      const nextBoundary = MILESTONES.find(m => m.x > mid && m.biome !== bIdx);
      if (nextBoundary && nextBoundary.x - mid < 400) {
        blendT = 1 - (nextBoundary.x - mid) / 400;
      }
      const finalColor = nextBIdx !== bIdx
        ? lerpColor(color, BIOMES[nextBIdx][biomeKey], blendT)
        : color;

      g.fillStyle(finalColor, alpha);
      g.beginPath();
      g.moveTo(p1.x, p1.y);
      g.lineTo(p2.x, p2.y);
      g.lineTo(p2.x, groundY);
      g.lineTo(p1.x, groundY);
      g.closePath();
      g.fillPath();
    }
  }

  _paintTrees() {
    const g = this.treeGfx;
    const { width, groundY } = WORLD;
    g.clear();

    // deterministic pseudo-random
    const rnd = mulberry32(12345);

    for (let x = 200; x < width; x += 90 + rnd() * 60) {
      const biomeIdx = (() => {
        let b = 0;
        for (let i = 0; i < MILESTONES.length; i++) if (x >= MILESTONES[i].x - 300) b = MILESTONES[i].biome;
        return b;
      })();
      const biome = BIOMES[biomeIdx];
      const y = groundY - 40 - rnd() * 20;
      const h = 55 + rnd() * 40;
      const w = 28 + rnd() * 16;

      // trunk
      g.fillStyle(0x5A3B24, 0.9);
      g.fillRect(x - 4, y - h * 0.35, 8, h * 0.35);

      // canopy — 3 overlapping circles
      g.fillStyle(biome.tree, 0.95);
      g.fillCircle(x, y - h * 0.6, w * 0.9);
      g.fillCircle(x - w * 0.55, y - h * 0.45, w * 0.7);
      g.fillCircle(x + w * 0.5, y - h * 0.4, w * 0.75);

      // highlight
      g.fillStyle(0xffffff, 0.08);
      g.fillCircle(x - w * 0.2, y - h * 0.75, w * 0.4);
    }
  }

  _paintClouds() {
    const g = this.cloudGfx;
    g.clear();
    const rnd = mulberry32(98765);
    const { width } = WORLD;
    for (let x = 150; x < width; x += 200 + rnd() * 160) {
      const y = 80 + rnd() * 180;
      const biomeIdx = (() => {
        let b = 0;
        for (let i = 0; i < MILESTONES.length; i++) if (x >= MILESTONES[i].x - 300) b = MILESTONES[i].biome;
        return b;
      })();
      const cloud = BIOMES[biomeIdx].cloud;
      const scale = 0.7 + rnd() * 0.8;
      g.fillStyle(cloud, 0.85);
      g.fillEllipse(x, y, 120 * scale, 38 * scale);
      g.fillEllipse(x - 30 * scale, y + 4, 70 * scale, 28 * scale);
      g.fillEllipse(x + 40 * scale, y + 2, 80 * scale, 30 * scale);
      g.fillStyle(0xffffff, 0.5);
      g.fillEllipse(x - 10 * scale, y - 8, 60 * scale, 14 * scale);
    }
  }

  _paintGround() {
    const g = this.nearGfx;
    g.clear();
    const { width, groundY, viewH } = WORLD;

    // per-segment fill to allow biome gradients
    const step = 80;
    for (let x = 0; x < width; x += step) {
      const mid = x + step / 2;
      let bIdx = 0;
      for (let i = 0; i < MILESTONES.length; i++) if (mid >= MILESTONES[i].x - 300) bIdx = MILESTONES[i].biome;
      const biome = BIOMES[bIdx];

      // grass top band
      g.fillStyle(biome.grass, 1);
      g.fillRect(x, groundY, step + 1, viewH - groundY);
      // darker below
      g.fillStyle(biome.grassDark, 1);
      g.fillRect(x, groundY + 14, step + 1, viewH - groundY - 14);

      // grass tufts
      const rnd = mulberry32(x + 7);
      for (let i = 0; i < 4; i++) {
        const gx = x + rnd() * step;
        const gh = 4 + rnd() * 6;
        g.fillStyle(biome.grass, 1);
        g.fillTriangle(gx - 2, groundY, gx, groundY - gh, gx + 2, groundY);
      }
    }
  }

  _paintDecor() {
    const g = this.decorGfx;
    g.clear();
    const rnd = mulberry32(42);
    const { width, groundY } = WORLD;
    for (let x = 60; x < width; x += 45 + rnd() * 80) {
      const biomeIdx = (() => {
        let b = 0;
        for (let i = 0; i < MILESTONES.length; i++) if (x >= MILESTONES[i].x - 300) b = MILESTONES[i].biome;
        return b;
      })();
      const flowerColors = [0xFF6B9D, 0xFFD86B, 0xFFFFFF, 0xC4B5FD, 0xFCA5A5];
      const c = flowerColors[Math.floor(rnd() * flowerColors.length)];
      const y = groundY - 2;

      // little flower — 5 petals + center
      g.fillStyle(c, 1);
      const r = 3.5;
      for (let a = 0; a < 5; a++) {
        const ang = (a / 5) * Math.PI * 2;
        g.fillCircle(x + Math.cos(ang) * r, y - 4 + Math.sin(ang) * r, 2.2);
      }
      g.fillStyle(0xFFF4A0, 1);
      g.fillCircle(x, y - 4, 1.8);
      // stem
      g.fillStyle(0x4C7B3E, 1);
      g.fillRect(x - 0.5, y - 4, 1, 4);
    }
  }
}

// small deterministic PRNG so layouts are stable across reloads
function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
