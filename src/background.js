// Locale-aware procedural backdrops. Each biome has its own sky colors,
// far-distance silhouette (mountain ridge or cityscape), signature
// landmarks (village + church / Winter Palace / stepped gables / Tower
// Bridge / canal houses + windmill), and atmospheric particles (managed
// in MainScene). Sky spans the whole world with a horizontal biome-
// blended gradient so each segment feels like a different time of day.

class Background {
  constructor(scene) {
    this.scene = scene;
  }

  build() {
    const s = this.scene;

    // Depth stack (back -> front):
    //   -100 sky     -80 far silhouette   -70 clouds
    //   -60 mid hills -58 water            -56 landmarks
    //   -55 trees    -40 ground           10 decor
    //
    // All biome-aware content lives at scrollFactor 1 so each biome's
    // scenery is locked to its world x-range and doesn't parallax-bleed
    // into the neighbouring biome (e.g. Siberian mountains lingering in
    // St Petersburg). Only the sky gradient (world-wide) and clouds
    // keep their gentle parallax for atmospheric depth.
    this.skyGfx      = s.add.graphics().setDepth(-100).setScrollFactor(1, 1);
    this.farGfx      = s.add.graphics().setDepth(-80).setScrollFactor(1, 1);
    this.cloudGfx    = s.add.graphics().setDepth(-70).setScrollFactor(0.35, 1);
    this.midGfx      = s.add.graphics().setDepth(-60).setScrollFactor(1, 1);
    this.waterGfx    = s.add.graphics().setDepth(-58).setScrollFactor(1, 1);
    this.landmarkGfx = s.add.graphics().setDepth(-56).setScrollFactor(1, 1);
    this.treeGfx     = s.add.graphics().setDepth(-55).setScrollFactor(1, 1);
    this.nearGfx     = s.add.graphics().setDepth(-40);
    this.decorGfx    = s.add.graphics().setDepth(10);

    this._paintWorldSky();
    this._paintFarSilhouettes();
    this._paintClouds();
    this._paintMidHills();
    this._paintWaterways();
    this._paintLandmarks();
    this._paintTrees();
    this._paintGround();
    this._paintDecor();
  }

  // --- biome lookup ---

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

  // Blend between current biome and next biome's color when near a transition.
  _blendedColor(x, key, fadeWidth = 500) {
    const currentIdx = this._biomeIndexAt(x);
    const current = BIOMES[currentIdx];
    const nextBoundary = MILESTONES.find((m) => m.x > x && m.biome !== currentIdx);
    if (nextBoundary && nextBoundary.x - x < fadeWidth) {
      const next = BIOMES[nextBoundary.biome];
      const t = 1 - (nextBoundary.x - x) / fadeWidth;
      return lerpColor(current[key], next[key], t);
    }
    return current[key];
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

  // --- sky + sun ---

  _paintWorldSky() {
    const g = this.skyGfx;
    const { width, viewH } = WORLD;
    g.clear();

    // Paint vertical gradient in horizontal strips. Each strip's sky colors
    // are biome-blended at that x, so the full journey shows a smooth
    // transition from Siberia morning -> SPB golden hour -> Belgium overcast
    // -> London grey -> Amsterdam clear blue.
    const stripW = 60;
    const vStrips = 32;
    for (let x = 0; x < width; x += stripW) {
      const midX = x + stripW / 2;
      const skyTop = this._blendedColor(midX, 'skyTop', 600);
      const skyBottom = this._blendedColor(midX, 'skyBottom', 600);
      for (let i = 0; i < vStrips; i++) {
        const vt = i / (vStrips - 1);
        g.fillStyle(lerpColor(skyTop, skyBottom, vt), 1);
        g.fillRect(x, Math.floor(i * viewH / vStrips), stripW + 2, Math.ceil(viewH / vStrips) + 1);
      }
    }

    // Paint a soft sun for each biome, baked into the sky. As the camera
    // scrolls horizontally, different suns come into view.
    BIOMES.forEach((biome) => {
      const span = this._regionSpan(BIOMES.indexOf(biome));
      const sunX = span.start + (span.end - span.start) * 0.6;
      this._paintSunInto(g, sunX, biome.sunY, biome.sunColor);
    });
  }

  _paintSunInto(g, cx, cy, color) {
    // soft halo
    for (let r = 140; r > 0; r -= 6) {
      g.fillStyle(color, (1 - r / 140) * 0.05);
      g.fillCircle(cx, cy, r);
    }
    // warm core
    g.fillStyle(color, 0.88);
    g.fillCircle(cx, cy, 42);
    g.fillStyle(0xffffff, 0.45);
    g.fillCircle(cx - 10, cy - 10, 18);
  }

  // --- clouds ---

  _paintClouds() {
    const g = this.cloudGfx;
    const rnd = mulberry32(98765);
    g.clear();

    for (let x = 140; x < WORLD.width; x += 180 + rnd() * 180) {
      const biome = this._biomeAt(x);
      const y = 70 + rnd() * 180;
      const scale = biome.name === 'london' ? 1 + rnd() * 1.2
                  : biome.name === 'belgium' ? 0.9 + rnd() * 0.9
                  : 0.6 + rnd() * 0.8;
      const highlight = biome.name === 'london' || biome.name === 'belgium' ? 0.2 : 0.45;

      g.fillStyle(biome.cloud, 0.88);
      g.fillEllipse(x, y, 130 * scale, 38 * scale);
      g.fillEllipse(x - 32 * scale, y + 4, 72 * scale, 28 * scale);
      g.fillEllipse(x + 40 * scale, y + 2, 86 * scale, 30 * scale);
      g.fillStyle(0xffffff, highlight);
      g.fillEllipse(x - 8 * scale, y - 8, 58 * scale, 12 * scale);
    }
  }

  // --- far silhouette layer (per biome) ---

  _paintFarSilhouettes() {
    const g = this.farGfx;
    g.clear();

    // Siberia far = jagged snowy ridge
    this._paintSiberiaFar(g);
    // St Petersburg far = long low pastel horizon
    this._paintStPetersburgFar(g);
    // Belgium far = rolling green hills
    this._paintBelgiumFar(g);
    // London far = modern skyline silhouette
    this._paintLondonFar(g);
    // Amsterdam far = flat with distant steeples
    this._paintAmsterdamFar(g);
  }

  _paintSiberiaFar(g) {
    const span = this._regionSpan(0);
    const biome = BIOMES[0];
    const baseY = WORLD.groundY - 160;
    const rnd = mulberry32(4411);

    // Mountains fade out smoothly before university (m4 at x=3300). No
    // mountains in St Petersburg — she's by the river + palaces there.
    const mountainEnd = 2800; // hard end
    const fadeStart   = 2300; // fade begins (just before school graduation)
    const fadeAt = (x) => {
      if (x <= fadeStart) return 1;
      if (x >= mountainEnd) return 0;
      return (mountainEnd - x) / (mountainEnd - fadeStart);
    };

    // jagged snowy mountain ridge across the faded span
    const points = [{ x: span.start - 40, y: WORLD.groundY }];
    for (let x = span.start - 40; x <= mountainEnd; x += 80) {
      const h = (110 + rnd() * 90) * fadeAt(x);
      points.push({ x, y: baseY - h });
      const dipX = x + 40 + rnd() * 20;
      const dipH = h * 0.6 - 40 - rnd() * 40;
      points.push({ x: dipX, y: baseY - dipH });
    }
    points.push({ x: mountainEnd, y: WORLD.groundY });
    g.fillStyle(biome.silhouetteFar, 0.88);
    g.fillPoints(points, true);

    // snow caps on peak points (only where peaks are tall enough to warrant)
    g.fillStyle(0xFFFFFF, 0.9);
    for (let i = 1; i < points.length - 1; i += 2) {
      const p = points[i];
      if (WORLD.groundY - p.y > 40) {
        g.fillTriangle(p.x - 14, p.y + 18, p.x + 14, p.y + 18, p.x, p.y - 2);
      }
    }

    // mid-distance lower snow ridge — also fades
    const lowRidge = [{ x: span.start - 40, y: WORLD.groundY }];
    for (let x = span.start - 40; x <= mountainEnd; x += 120) {
      const h = (30 + rnd() * 40) * fadeAt(x);
      lowRidge.push({ x, y: baseY + 30 - h });
    }
    lowRidge.push({ x: mountainEnd, y: WORLD.groundY });
    g.fillStyle(biome.silhouetteMid, 0.82);
    g.fillPoints(lowRidge, true);
  }

  _paintStPetersburgFar(g) {
    const span = this._regionSpan(1);
    const biome = BIOMES[1];
    // soft, low horizon suggesting distant city — warm pastel strip
    g.fillStyle(biome.silhouetteFar, 0.6);
    g.fillRect(span.start - 40, WORLD.groundY - 92, span.end - span.start + 80, 82);
    // silhouetted classical roofline: small repeating rectangles suggesting
    // far-away palace rooftops
    g.fillStyle(biome.silhouetteMid, 0.85);
    const rnd = mulberry32(2217);
    for (let x = span.start; x < span.end; x += 20) {
      const h = 22 + rnd() * 22;
      g.fillRect(x, WORLD.groundY - 20 - h, 18, h);
    }
  }

  _paintBelgiumFar(g) {
    const span = this._regionSpan(2);
    const biome = BIOMES[2];
    const baseY = WORLD.groundY - 90;
    const rnd = mulberry32(6677);

    // rolling far green hills
    const pts = [{ x: span.start - 40, y: WORLD.groundY }];
    for (let x = span.start - 40; x <= span.end + 40; x += 70) {
      const h = 50 + 30 * Math.sin(x * 0.011) + 20 * rnd();
      pts.push({ x, y: baseY - h });
    }
    pts.push({ x: span.end + 40, y: WORLD.groundY });
    g.fillStyle(biome.silhouetteFar, 0.88);
    g.fillPoints(pts, true);
  }

  _paintLondonFar(g) {
    const span = this._regionSpan(3);
    const biome = BIOMES[3];
    const baseY = WORLD.groundY - 60;
    const rnd = mulberry32(3321);

    // modern skyline silhouette — rectangular glass towers + a couple of
    // iconic shapes (Gherkin curve, Shard triangle)
    let x = span.start - 20;
    let shardDone = false, gherkinDone = false;
    while (x < span.end + 40) {
      const kind = rnd();
      if (!gherkinDone && x > span.start + 120) {
        // Gherkin — egg-shaped tower
        const cx = x + 28;
        const h = 150;
        g.fillStyle(biome.glassBuilding, 0.95);
        g.fillEllipse(cx, baseY - h * 0.55, 56, h);
        g.fillTriangle(cx - 6, baseY - h * 0.1, cx + 6, baseY - h * 0.1, cx, baseY - h * 0.05);
        // lines
        g.fillStyle(0x6F7D8A, 0.7);
        g.fillRect(cx - 26, baseY - h * 0.3, 52, 1);
        g.fillRect(cx - 24, baseY - h * 0.5, 48, 1);
        g.fillRect(cx - 20, baseY - h * 0.7, 40, 1);
        x = cx + 36 + rnd() * 30;
        gherkinDone = true;
        continue;
      }
      if (!shardDone && x > span.start + 260) {
        // Shard — tall triangular spike
        const cx = x + 18;
        const h = 220;
        g.fillStyle(biome.glassBuilding, 0.98);
        g.fillTriangle(cx - 22, baseY, cx + 22, baseY, cx, baseY - h);
        g.fillStyle(0x475360, 0.9);
        g.fillTriangle(cx - 8, baseY - h * 0.6, cx + 8, baseY - h * 0.6, cx, baseY - h);
        x = cx + 36 + rnd() * 30;
        shardDone = true;
        continue;
      }
      // rectangular glass tower
      const w = 24 + rnd() * 22;
      const h = 60 + rnd() * 110;
      g.fillStyle(biome.silhouetteFar, 0.95);
      g.fillRect(x, baseY - h, w, h);
      // grid of windows
      g.fillStyle(0x2A3038, 0.6);
      for (let wy = baseY - h + 8; wy < baseY - 6; wy += 10) {
        for (let wx = x + 3; wx < x + w - 3; wx += 7) {
          g.fillRect(wx, wy, 3, 4);
        }
      }
      if (rnd() > 0.7) {
        g.fillRect(x - 3, baseY - h - 12, w + 6, 12); // flat cap
      }
      x += w + 6 + rnd() * 18;
    }
  }

  _paintAmsterdamFar(g) {
    const span = this._regionSpan(4);
    const biome = BIOMES[4];
    const baseY = WORLD.groundY - 50;
    const rnd = mulberry32(8817);

    // very flat horizon with a couple of distant steeples
    g.fillStyle(biome.silhouetteFar, 0.85);
    g.fillRect(span.start - 40, baseY, span.end - span.start + 80, baseY);

    // occasional distant church steeples
    for (let x = span.start + 180; x < span.end; x += 320 + rnd() * 180) {
      const cx = x;
      g.fillStyle(biome.silhouetteMid, 0.9);
      g.fillRect(cx - 4, baseY - 40, 8, 40);
      g.fillTriangle(cx - 6, baseY - 40, cx + 6, baseY - 40, cx, baseY - 68);
      g.fillStyle(biome.domeGold, 0.7);
      g.fillCircle(cx, baseY - 70, 2);
    }
  }

  // --- mid hills (simple generic tinted layer) ---

  _paintMidHills() {
    const g = this.midGfx;
    const { width, groundY } = WORLD;
    g.clear();
    const step = 180;

    for (let x = -step; x <= width + step; x += step) {
      const nx = x / 220;
      const h = 55 + 35 * (0.5 + 0.5 * Math.sin(nx)) + 20 * Math.sin(nx * 2.1);
      const color = this._blendedColor(x, 'mid', 500);
      g.fillStyle(color, 0.85);
      g.fillRect(x, groundY - h, step + 1, h);
      g.fillStyle(lerpColor(color, 0x000000, 0.15), 0.5);
      g.fillRect(x, groundY - 8, step + 1, 8);
    }
  }

  // --- water (same as before, per-biome water strip) ---

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

  // --- Landmarks: each biome's signature structures ---

  _paintLandmarks() {
    this.landmarkGfx.clear();
    this._paintSiberiaLandmarks();
    this._paintStPetersburgLandmarks();
    this._paintBelgiumLandmarks();
    this._paintLondonLandmarks();
    this._paintAmsterdamLandmarks();
  }

  _paintSiberiaLandmarks() {
    const g = this.landmarkGfx;
    const span = this._regionSpan(0);
    const biome = BIOMES[0];
    const baseY = WORLD.groundY - 38;
    const rnd = mulberry32(1103);

    // a small village — scattered log cabins
    const cabinPositions = [];
    for (let x = span.start + 200; x < span.end - 80; x += 180 + rnd() * 120) {
      cabinPositions.push(x);
    }
    cabinPositions.forEach((x) => {
      this._drawLogCabin(g, x, baseY, biome, rnd);
    });

    // wooden orthodox church with gold dome, placed prominently
    const churchX = span.start + 720;
    this._drawWoodenChurch(g, churchX, baseY, biome);
  }

  _drawLogCabin(g, x, baseY, biome, rnd) {
    const w = 56 + rnd() * 20;
    const h = 32 + rnd() * 10;

    // body (logs)
    g.fillStyle(biome.building, 0.98);
    g.fillRect(x - w / 2, baseY - h, w, h);
    // log lines
    g.fillStyle(biome.buildingDark, 0.7);
    for (let y = baseY - h + 5; y < baseY - 2; y += 5) {
      g.fillRect(x - w / 2, y, w, 1);
    }
    // pitched snowy roof
    g.fillStyle(biome.buildingDark, 1);
    g.fillTriangle(x - w / 2 - 4, baseY - h + 4, x + w / 2 + 4, baseY - h + 4, x, baseY - h - 22);
    g.fillStyle(0xFFFFFF, 0.95);
    g.fillTriangle(x - w / 2 - 4, baseY - h + 4, x + w / 2 + 4, baseY - h + 4, x, baseY - h - 18);
    // door
    g.fillStyle(biome.buildingDark, 1);
    g.fillRect(x - 4, baseY - 18, 8, 16);
    // windows
    g.fillStyle(0xFFE090, 0.85);
    g.fillRect(x - w / 2 + 8, baseY - h + 14, 8, 8);
    g.fillRect(x + w / 2 - 16, baseY - h + 14, 8, 8);
    // chimney with smoke
    g.fillStyle(biome.buildingDark, 1);
    g.fillRect(x + w / 4, baseY - h - 14, 6, 14);
    g.fillStyle(0xE8EEF5, 0.75);
    g.fillCircle(x + w / 4 + 3, baseY - h - 24, 4);
    g.fillCircle(x + w / 4 + 6, baseY - h - 32, 5);
    g.fillCircle(x + w / 4 + 10, baseY - h - 42, 6);
  }

  _drawWoodenChurch(g, x, baseY, biome) {
    const w = 72;
    const h = 52;
    // body
    g.fillStyle(biome.building, 1);
    g.fillRect(x - w / 2, baseY - h, w, h);
    // log lines
    g.fillStyle(biome.buildingDark, 0.8);
    for (let y = baseY - h + 6; y < baseY - 2; y += 6) {
      g.fillRect(x - w / 2, y, w, 1);
    }
    // pitched snow roof
    g.fillStyle(biome.buildingDark, 1);
    g.fillTriangle(x - w / 2 - 5, baseY - h + 4, x + w / 2 + 5, baseY - h + 4, x, baseY - h - 26);
    g.fillStyle(0xFFFFFF, 0.95);
    g.fillTriangle(x - w / 2 - 5, baseY - h + 4, x + w / 2 + 5, baseY - h + 4, x, baseY - h - 22);
    // door
    g.fillStyle(biome.buildingDark, 1);
    g.fillRect(x - 6, baseY - 24, 12, 22);
    g.lineStyle(1, 0xD4A660, 0.9);
    g.strokeRect(x - 6, baseY - 24, 12, 22);
    // cross
    g.fillStyle(biome.domeGold, 1);
    g.fillRect(x - 1, baseY - 20, 2, 12);
    g.fillRect(x - 4, baseY - 17, 8, 2);
    // onion dome cluster on the left tower
    const domeX = x - w / 2 - 6;
    const domeBaseY = baseY - h - 4;
    // tower
    g.fillStyle(biome.building, 1);
    g.fillRect(domeX - 10, domeBaseY, 20, 40);
    g.fillStyle(biome.buildingDark, 0.7);
    for (let y = domeBaseY + 6; y < domeBaseY + 36; y += 6) {
      g.fillRect(domeX - 10, y, 20, 1);
    }
    // onion dome
    g.fillStyle(biome.domeGold, 1);
    g.fillEllipse(domeX, domeBaseY - 8, 28, 32);
    g.fillStyle(lerpColor(biome.domeGold, 0xffffff, 0.4), 0.8);
    g.fillEllipse(domeX - 4, domeBaseY - 14, 10, 12);
    // spire + cross
    g.fillStyle(biome.domeGold, 1);
    g.fillRect(domeX - 1, domeBaseY - 34, 2, 14);
    g.fillRect(domeX - 4, domeBaseY - 30, 8, 2);
  }

  _paintStPetersburgLandmarks() {
    const g = this.landmarkGfx;
    const span = this._regionSpan(1);
    const biome = BIOMES[1];
    const baseY = WORLD.groundY - 50;
    const rnd = mulberry32(9101);

    // A long classical palace facade (Winter Palace evocation) — stretches
    // horizontally across a portion of the span
    this._drawClassicalPalace(g, span.start + 600, span.start + 1700, baseY, biome);
    // Smaller baroque mansions scattered around
    const pastel = [biome.building, biome.buildingAlt1, biome.buildingAlt2, biome.buildingAlt3];
    for (let x = span.start + 80; x < span.start + 600; x += 150 + rnd() * 60) {
      this._drawBaroqueMansion(g, x, baseY, pastel[Math.floor(rnd() * pastel.length)], biome, rnd);
    }
    for (let x = span.start + 1760; x < span.end - 80; x += 150 + rnd() * 60) {
      this._drawBaroqueMansion(g, x, baseY, pastel[Math.floor(rnd() * pastel.length)], biome, rnd);
    }
    // Peter and Paul spire — very tall golden landmark
    this._drawGoldSpire(g, span.start + 2400, baseY);
    // one onion-dome cluster earlier in the span
    this._drawOnionDomeCluster(g, span.start + 1400, baseY, biome);
  }

  _drawClassicalPalace(g, x1, x2, baseY, biome) {
    const w = x2 - x1;
    const h = 96;
    const top = baseY - h;
    // main pastel body
    g.fillStyle(biome.building, 0.98);
    g.fillRect(x1, top, w, h);
    // lighter highlight
    g.fillStyle(lerpColor(biome.building, 0xffffff, 0.25), 0.7);
    g.fillRect(x1 + 4, top + 4, w - 8, h - 8);
    // trim color horizontal bands
    g.fillStyle(biome.buildingTrim, 0.85);
    g.fillRect(x1, top + 2, w, 2);
    g.fillRect(x1, top + h / 3 - 1, w, 2);
    g.fillRect(x1, baseY - 14, w, 3);
    // columned window rhythm
    g.fillStyle(biome.buildingTrim, 0.9);
    for (let wx = x1 + 12; wx < x2 - 12; wx += 14) {
      g.fillRect(wx, top + 8, 3, h - 26);
    }
    g.fillStyle(0xFFF3D7, 0.72);
    for (let wx = x1 + 16; wx < x2 - 12; wx += 14) {
      g.fillRect(wx, top + 18, 6, h - 46);
    }
    // green copper roof strip
    g.fillStyle(0x6C8E6F, 1);
    g.fillRect(x1, top - 12, w, 12);
    g.fillStyle(0x86A98A, 0.6);
    g.fillRect(x1, top - 12, w, 3);
    // small central cupola
    const cx = x1 + w / 2;
    g.fillStyle(biome.domeGold, 1);
    g.fillEllipse(cx, top - 24, 30, 28);
    g.fillStyle(lerpColor(biome.domeGold, 0xFFFFFF, 0.4), 0.7);
    g.fillEllipse(cx - 5, top - 30, 10, 10);
    // spire
    g.fillStyle(biome.domeGold, 1);
    g.fillRect(cx - 1, top - 50, 2, 16);
  }

  _drawBaroqueMansion(g, x, baseY, body, biome, rnd) {
    const w = 84 + rnd() * 34;
    const h = 60 + rnd() * 30;
    const top = baseY - h;
    // body
    g.fillStyle(body, 0.98);
    g.fillRect(x - w / 2, top, w, h);
    // lighter trim
    g.fillStyle(lerpColor(body, 0xffffff, 0.3), 0.75);
    g.fillRect(x - w / 2 + 3, top + 3, w - 6, h - 6);
    // windows
    g.fillStyle(0xFFF3D7, 0.82);
    for (let wy = top + 10; wy < baseY - 10; wy += 16) {
      for (let wx = x - w / 2 + 8; wx < x + w / 2 - 8; wx += 14) {
        g.fillRect(wx, wy, 7, 10);
      }
    }
    // copper or terracotta roof
    g.fillStyle(rnd() > 0.5 ? 0x6C8E6F : biome.roofAccent, 1);
    g.fillTriangle(x - w / 2 - 3, top + 5, x + w / 2 + 3, top + 5, x, top - 14);
  }

  _drawGoldSpire(g, x, baseY) {
    const biome = BIOMES[1];
    // tall stone base
    g.fillStyle(biome.buildingTrim, 1);
    g.fillRect(x - 14, baseY - 80, 28, 80);
    g.fillStyle(lerpColor(biome.buildingTrim, 0x000000, 0.2), 0.6);
    g.fillRect(x - 14, baseY - 8, 28, 8);
    // arched entrance
    g.fillStyle(biome.buildingDark, 0.8);
    g.fillRect(x - 5, baseY - 18, 10, 18);
    // central tower
    g.fillStyle(biome.buildingTrim, 1);
    g.fillRect(x - 10, baseY - 140, 20, 60);
    g.fillStyle(lerpColor(biome.buildingTrim, 0xffffff, 0.3), 0.6);
    g.fillRect(x - 8, baseY - 138, 16, 56);
    // onion base for spire
    g.fillStyle(biome.domeGold, 1);
    g.fillEllipse(x, baseY - 150, 24, 22);
    // long thin golden spire
    g.fillStyle(biome.domeGold, 1);
    g.fillTriangle(x - 3, baseY - 160, x + 3, baseY - 160, x, baseY - 230);
    // cross
    g.fillRect(x - 1, baseY - 238, 2, 10);
    g.fillRect(x - 4, baseY - 234, 8, 2);
    // highlight
    g.fillStyle(lerpColor(biome.domeGold, 0xffffff, 0.5), 0.7);
    g.fillRect(x - 2, baseY - 155, 1, 60);
  }

  _drawOnionDomeCluster(g, x, baseY, biome) {
    const domeY = baseY - 46;
    // tower base
    g.fillStyle(biome.buildingTrim, 1);
    g.fillRect(x - 16, baseY - 50, 32, 50);
    g.fillStyle(lerpColor(biome.buildingTrim, 0x000000, 0.15), 0.6);
    for (let wy = baseY - 40; wy < baseY - 4; wy += 10) {
      g.fillRect(x - 12, wy, 24, 1);
    }
    // central big dome
    g.fillStyle(0xB55464, 1);
    g.fillEllipse(x, domeY - 6, 36, 40);
    g.fillStyle(lerpColor(0xB55464, 0xffffff, 0.3), 0.6);
    g.fillEllipse(x - 6, domeY - 12, 12, 14);
    // spire
    g.fillStyle(biome.domeGold, 1);
    g.fillRect(x - 1, domeY - 32, 2, 10);
    // side smaller domes
    g.fillStyle(0x3F8AA0, 1);
    g.fillEllipse(x - 24, domeY - 2, 16, 20);
    g.fillStyle(0x7B9870, 1);
    g.fillEllipse(x + 24, domeY, 16, 20);
  }

  _paintBelgiumLandmarks() {
    const g = this.landmarkGfx;
    const span = this._regionSpan(2);
    const biome = BIOMES[2];
    const baseY = WORLD.groundY - 36;
    const rnd = mulberry32(7721);

    // belfry tower (Bruges-style) placed prominently
    this._drawBelfry(g, span.start + 180, baseY, biome);
    // stepped gable row
    let x = span.start + 320;
    const rowEnd = Math.min(span.end - 60, x + 520);
    while (x < rowEnd) {
      const w = 50 + rnd() * 14;
      const bodies = [biome.building, biome.buildingAlt1, biome.buildingAlt2, biome.buildingAlt3];
      const body = bodies[Math.floor(rnd() * bodies.length)];
      this._drawSteppedGable(g, x, baseY, w, body, biome, rnd);
      x += w + 2;
    }
  }

  _drawSteppedGable(g, x, baseY, w, body, biome, rnd) {
    const h = 78 + rnd() * 22;
    const top = baseY - h;
    // body
    g.fillStyle(body, 0.98);
    g.fillRect(x, top + 14, w, h - 14);
    g.fillStyle(lerpColor(body, 0x000000, 0.1), 0.5);
    g.fillRect(x, baseY - 4, w, 4);

    // brick texture
    g.fillStyle(lerpColor(body, 0x000000, 0.15), 0.35);
    for (let by = top + 20; by < baseY - 2; by += 6) {
      g.fillRect(x + ((Math.floor(by / 6) % 2) * 4), by, w - 4, 1);
    }

    // stepped gable top
    const steps = 3;
    const stepW = 6;
    const stepH = 5;
    g.fillStyle(body, 1);
    // left side step-down
    for (let i = 0; i < steps; i++) {
      const sy = top + i * stepH;
      const sxL = x + i * stepW;
      const sxR = x + w - i * stepW;
      g.fillRect(sxL, sy, stepW, stepH + 1);
      g.fillRect(sxR - stepW, sy, stepW, stepH + 1);
    }
    // central peak
    g.fillRect(x + steps * stepW, top - 6, w - 2 * steps * stepW, stepH + 6);

    // trim lines between steps
    g.fillStyle(biome.buildingTrim, 0.8);
    g.fillRect(x, top + 14, w, 1);
    g.fillRect(x, top + steps * stepH + 4, w, 1);

    // windows
    g.fillStyle(0xFFF0D0, 0.8);
    for (let wy = top + 20; wy < baseY - 14; wy += 16) {
      g.fillRect(x + w / 2 - 5, wy, 10, 10);
    }

    // door
    g.fillStyle(biome.buildingDark, 1);
    g.fillRect(x + w / 2 - 4, baseY - 12, 8, 12);
  }

  _drawBelfry(g, x, baseY, biome) {
    // tall stone tower
    const towerW = 40;
    const towerH = 170;
    g.fillStyle(biome.buildingTrim, 1);
    g.fillRect(x - towerW / 2, baseY - towerH, towerW, towerH);
    g.fillStyle(lerpColor(biome.buildingTrim, 0x000000, 0.15), 0.5);
    for (let y = baseY - towerH + 6; y < baseY - 6; y += 10) {
      g.fillRect(x - towerW / 2, y, towerW, 1);
    }
    // window arches
    g.fillStyle(biome.buildingDark, 0.85);
    for (let wy = baseY - towerH + 20; wy < baseY - 30; wy += 30) {
      g.fillRect(x - 10, wy, 6, 16);
      g.fillRect(x + 4, wy, 6, 16);
    }
    // crown
    g.fillStyle(biome.buildingTrim, 1);
    g.fillRect(x - towerW / 2 - 4, baseY - towerH - 10, towerW + 8, 10);
    // castellations
    for (let i = -18; i <= 18; i += 6) {
      g.fillRect(x + i, baseY - towerH - 16, 3, 6);
    }
    // spire
    g.fillStyle(biome.roofAccent, 1);
    g.fillTriangle(x - 14, baseY - towerH - 10, x + 14, baseY - towerH - 10, x, baseY - towerH - 50);
    // golden cap
    g.fillStyle(biome.domeGold, 1);
    g.fillCircle(x, baseY - towerH - 50, 3);
  }

  _paintLondonLandmarks() {
    const g = this.landmarkGfx;
    const span = this._regionSpan(3);
    const biome = BIOMES[3];
    const baseY = WORLD.groundY - 42;

    // Tower Bridge in the middle distance
    this._drawTowerBridge(g, span.start + 240, baseY, biome);
    // Big Ben clock tower
    this._drawClockTower(g, span.start + 720, baseY + 4, 170, biome.buildingTrim, 0xF1E7C4);
    // red-brick terrace houses
    let x = span.start + 860;
    const rnd = mulberry32(14411);
    while (x < span.end - 40) {
      const w = 56;
      this._drawBrickTerrace(g, x, baseY, w, biome, rnd);
      x += w + 2;
    }
  }

  _drawTowerBridge(g, x, baseY, biome) {
    // two gothic towers separated by a span
    const towerW = 36;
    const towerH = 120;
    const gap = 130;
    const centerX = x + gap / 2 + towerW;

    const drawTower = (tx) => {
      // main body
      g.fillStyle(biome.buildingTrim, 1);
      g.fillRect(tx - towerW / 2, baseY - towerH, towerW, towerH);
      g.fillStyle(lerpColor(biome.buildingTrim, 0x000000, 0.18), 0.4);
      g.fillRect(tx - towerW / 2, baseY - towerH + 30, towerW, 4);
      g.fillRect(tx - towerW / 2, baseY - towerH + 70, towerW, 4);
      // windows
      g.fillStyle(biome.buildingDark, 0.8);
      g.fillRect(tx - 6, baseY - towerH + 40, 4, 18);
      g.fillRect(tx + 2, baseY - towerH + 40, 4, 18);
      g.fillRect(tx - 6, baseY - towerH + 80, 4, 18);
      g.fillRect(tx + 2, baseY - towerH + 80, 4, 18);
      // top stone + spire
      g.fillStyle(biome.buildingTrim, 1);
      g.fillRect(tx - towerW / 2 - 3, baseY - towerH - 8, towerW + 6, 8);
      // four corner mini-spires
      [tx - towerW / 2 + 2, tx + towerW / 2 - 5, tx - towerW / 2 + 10, tx + towerW / 2 - 13].forEach((sx) => {
        g.fillRect(sx, baseY - towerH - 18, 3, 10);
        g.fillTriangle(sx - 1, baseY - towerH - 18, sx + 4, baseY - towerH - 18, sx + 1.5, baseY - towerH - 24);
      });
      // central tall spire
      g.fillStyle(0x3E4A52, 1);
      g.fillRect(tx - 2, baseY - towerH - 28, 4, 14);
      g.fillTriangle(tx - 5, baseY - towerH - 28, tx + 5, baseY - towerH - 28, tx, baseY - towerH - 44);
      // blue-grey roof base
      g.fillStyle(biome.roofAccent, 1);
      g.fillTriangle(tx - towerW / 2 - 5, baseY - towerH, tx + towerW / 2 + 5, baseY - towerH, tx, baseY - towerH - 14);
    };
    drawTower(x);
    drawTower(x + gap + towerW);

    // walkway between towers
    g.fillStyle(biome.buildingTrim, 0.95);
    g.fillRect(x + towerW / 2, baseY - towerH + 36, gap, 8);
    g.fillStyle(0x5A6C7A, 1);
    g.fillRect(x + towerW / 2, baseY - towerH + 28, gap, 6);

    // suspension cables (low arch between tower tops and road deck)
    g.lineStyle(2, 0x5A6C7A, 0.95);
    const deckY = baseY - 24;
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const sx = x + towerW / 2 + t * gap;
      const sy = deckY - Math.sin(t * Math.PI) * 26;
      if (i > 0) {
        const prev = {
          x: x + towerW / 2 + ((i - 1) / 10) * gap,
          y: deckY - Math.sin(((i - 1) / 10) * Math.PI) * 26,
        };
        g.lineBetween(prev.x, prev.y, sx, sy);
      }
    }

    // deck / road
    g.fillStyle(0x3D4750, 1);
    g.fillRect(x - 4, deckY, gap + towerW * 2 + 8, 6);
  }

  _drawClockTower(g, x, baseY, h, body, face) {
    const w = 30;
    const topY = baseY - h;
    const biome = BIOMES[3];
    g.fillStyle(body, 1);
    g.fillRect(x - w / 2, topY, w, h);
    g.fillStyle(lerpColor(body, 0x000000, 0.18), 0.35);
    for (let i = 0; i < 5; i++) {
      g.fillRect(x - w / 2, topY + 12 + i * 28, w, 2);
    }
    // clock face
    g.fillStyle(0xD0B26D, 1);
    g.fillRect(x - 20, topY + 16, 40, 22);
    g.fillStyle(face, 1);
    g.fillCircle(x, topY + 27, 8);
    g.fillStyle(0x32404C, 1);
    g.fillRect(x - 0.5, topY + 20, 1, 7);
    g.fillRect(x, topY + 27, 5, 1);
    // spire
    g.fillStyle(biome.roofAccent, 1);
    g.fillTriangle(x - 18, topY, x + 18, topY, x, topY - 30);
    g.fillStyle(biome.domeGold, 1);
    g.fillCircle(x, topY - 30, 3);
  }

  _drawBrickTerrace(g, x, baseY, w, biome, rnd) {
    const h = 72;
    const top = baseY - h;
    const colors = [biome.building, biome.buildingAlt1, biome.buildingAlt2];
    const body = colors[Math.floor(rnd() * colors.length)];

    g.fillStyle(body, 0.98);
    g.fillRect(x, top, w, h);
    // brick texture
    g.fillStyle(lerpColor(body, 0x000000, 0.18), 0.35);
    for (let by = top + 6; by < baseY - 2; by += 5) {
      g.fillRect(x + ((Math.floor(by / 5) % 2) * 3), by, w - 2, 1);
    }
    // pitched slate roof
    g.fillStyle(biome.roofAccent, 1);
    g.fillTriangle(x - 2, top + 2, x + w + 2, top + 2, x + w / 2, top - 18);
    // chimney
    g.fillStyle(biome.roofAccent, 1);
    g.fillRect(x + w - 12, top - 14, 6, 12);
    // white window trim
    g.fillStyle(biome.buildingTrim, 0.9);
    g.fillRect(x + 4, top + 12, w - 8, 3);
    // windows
    g.fillStyle(0xE8DEBE, 0.8);
    g.fillRect(x + 8, top + 18, w - 16, 12);
    g.fillRect(x + 8, top + 38, w - 16, 12);
    // red door for variety
    if (rnd() > 0.5) {
      g.fillStyle(biome.redBus, 1);
    } else {
      g.fillStyle(biome.buildingDark, 1);
    }
    g.fillRect(x + w / 2 - 4, baseY - 12, 8, 12);
  }

  _paintAmsterdamLandmarks() {
    const g = this.landmarkGfx;
    const span = this._regionSpan(4);
    const biome = BIOMES[4];
    const baseY = WORLD.groundY - 38;
    const rnd = mulberry32(14021);
    const bodies = [biome.building, biome.buildingAlt1, biome.buildingAlt2, biome.buildingAlt3, biome.buildingAlt4];

    // row of narrow canal houses
    for (let x = span.start + 40; x < span.end - 260; x += 52 + rnd() * 10) {
      const w = 38 + rnd() * 14;
      const h = 72 + rnd() * 50;
      const body = bodies[Math.floor(rnd() * bodies.length)];
      const roof = lerpColor(body, 0xF4D8A1, 0.3);
      this._drawCanalHouse(g, x, baseY, w, h, body, roof, biome);
    }

    // bridges over water
    for (let x = span.start + 180; x < span.end - 260; x += 420) {
      this._drawBridge(g, x, baseY + 8, 120, 0x5A3C30);
    }

    // parked bikes leaning against canal railing
    for (let x = span.start + 140; x < span.end - 280; x += 240 + rnd() * 140) {
      this._drawBikeSilhouette(g, x, baseY);
    }

    // prominent windmill near end of biome
    this._drawWindmill(g, span.end - 180, baseY + 14, biome);
  }

  _drawCanalHouse(g, x, baseY, w, h, body, roof, biome) {
    const left = x - w / 2;
    const topY = baseY - h;
    const style = Math.floor((x / 17) % 3);

    // body
    g.fillStyle(body, 0.98);
    g.fillRect(left, topY, w, h);
    g.fillStyle(lerpColor(body, 0xffffff, 0.2), 0.7);
    g.fillRect(left + 3, topY + 4, w - 6, h - 8);
    // brick stripes
    g.fillStyle(lerpColor(body, 0x000000, 0.18), 0.3);
    for (let by = topY + 8; by < baseY - 4; by += 5) {
      g.fillRect(left + ((Math.floor(by / 5) % 2) * 3), by, w - 2, 1);
    }
    // trim line between floors
    g.fillStyle(biome.buildingTrim, 0.8);
    g.fillRect(left, topY + h * 0.5, w, 1);

    // gable variants
    g.fillStyle(roof, 1);
    if (style === 0) {
      g.fillTriangle(left - 2, topY + 6, left + w + 2, topY + 6, x, topY - 18);
    } else if (style === 1) {
      // bell gable
      g.fillRect(left + 6, topY - 8, w - 12, 8);
      g.fillEllipse(x, topY - 8, w - 10, 20);
    } else {
      // stepped
      g.fillRect(left + 10, topY - 10, w - 20, 10);
      g.fillTriangle(left + 10, topY - 10, x, topY - 20, x, topY - 10);
      g.fillTriangle(x, topY - 20, left + w - 10, topY - 10, x, topY - 10);
    }

    // windows
    g.fillStyle(0xFFF5C9, 0.88);
    for (let wy = topY + 12; wy < baseY - 16; wy += 14) {
      g.fillRect(left + 6, wy, 6, 8);
      g.fillRect(left + w - 13, wy, 6, 8);
    }
    // window trim
    g.fillStyle(biome.buildingTrim, 0.9);
    for (let wy = topY + 12; wy < baseY - 16; wy += 14) {
      g.fillRect(left + 5, wy - 1, 9, 1);
      g.fillRect(left + w - 14, wy - 1, 9, 1);
    }

    // door
    g.fillStyle(0x3E2418, 0.95);
    g.fillRect(x - 5, baseY - 16, 10, 16);
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

  _drawBikeSilhouette(g, x, baseY) {
    const y = baseY - 2;
    // wheels
    g.lineStyle(2, 0x1a1a1a, 0.9);
    g.strokeCircle(x - 10, y - 9, 8);
    g.strokeCircle(x + 10, y - 9, 8);
    // frame
    g.lineStyle(2, 0x2A4A68, 0.92);
    g.lineBetween(x - 10, y - 9, x + 2, y - 20);
    g.lineBetween(x + 2, y - 20, x + 10, y - 9);
    g.lineBetween(x - 10, y - 9, x + 6, y - 9);
    // handle + seat
    g.lineStyle(2, 0x1a1a1a, 0.9);
    g.lineBetween(x + 2, y - 20, x + 6, y - 24);
    g.lineBetween(x - 2, y - 18, x - 6, y - 18);
  }

  _drawWindmill(g, x, baseY, biome) {
    const towerH = 126;
    // body
    g.fillStyle(biome.buildingTrim, 1);
    g.fillTriangle(x - 22, baseY, x + 22, baseY, x, baseY - towerH);
    g.fillStyle(lerpColor(biome.buildingTrim, 0x000000, 0.15), 0.5);
    g.fillTriangle(x - 22, baseY, x - 6, baseY, x - 4, baseY - towerH);
    // bricks
    g.fillStyle(biome.buildingDark, 0.4);
    for (let y = baseY - 10; y > baseY - towerH + 10; y -= 10) {
      const w = (y - (baseY - towerH)) / towerH * 40;
      g.fillRect(x - w / 2, y, w, 1);
    }
    // top hat
    g.fillStyle(biome.roofAccent, 1);
    g.fillTriangle(x - 26, baseY - towerH + 10, x + 26, baseY - towerH + 10, x, baseY - towerH - 28);
    // hub
    g.fillStyle(0x3F2A22, 1);
    g.fillCircle(x, baseY - towerH + 10, 6);
    // sails
    g.lineStyle(5, 0xC94B53, 0.98);
    g.lineBetween(x, baseY - towerH + 10, x + 56, baseY - towerH - 26);
    g.lineBetween(x, baseY - towerH + 10, x - 56, baseY - towerH - 26);
    g.lineBetween(x, baseY - towerH + 10, x + 56, baseY - towerH + 46);
    g.lineBetween(x, baseY - towerH + 10, x - 56, baseY - towerH + 46);
    // sail sheen
    g.lineStyle(2, 0xFFFFFF, 0.35);
    g.lineBetween(x + 8, baseY - towerH + 6, x + 52, baseY - towerH - 22);
    g.lineBetween(x - 8, baseY - towerH + 6, x - 52, baseY - towerH - 22);
    // door at base
    g.fillStyle(biome.buildingDark, 1);
    g.fillRect(x - 4, baseY - 12, 8, 12);
  }

  // --- trees per biome ---

  _paintTrees() {
    const g = this.treeGfx;
    const rnd = mulberry32(12345);
    g.clear();

    for (let x = 160; x < WORLD.width; x += 70 + rnd() * 55) {
      const biome = this._biomeAt(x);
      const y = WORLD.groundY - 36 - rnd() * 22;

      if (biome.name === 'siberia') {
        if (rnd() > 0.55) {
          this._drawPine(g, x, y, 58 + rnd() * 48, biome.tree);
        } else {
          this._drawBirch(g, x, y, 58 + rnd() * 28);
        }
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

  _drawBirch(g, x, y, h) {
    // white trunk with black spots
    g.fillStyle(0xF4F2ED, 0.95);
    g.fillRect(x - 2, y - h * 0.7, 4, h * 0.7);
    g.fillStyle(0x2A241E, 1);
    for (let yy = y - h * 0.6; yy < y - h * 0.1; yy += 10) {
      g.fillRect(x - 2, yy, 4, 1);
    }
    // sparse leaves
    g.fillStyle(0x5A7A3A, 0.92);
    g.fillCircle(x, y - h * 0.75, h * 0.15);
    g.fillCircle(x - h * 0.12, y - h * 0.6, h * 0.12);
    g.fillCircle(x + h * 0.14, y - h * 0.58, h * 0.12);
    // snow on foliage
    g.fillStyle(0xFFFFFF, 0.75);
    g.fillEllipse(x, y - h * 0.82, h * 0.22, 4);
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

  // --- ground + decor ---

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
        // solid snow top band with tiny grass blades peeking
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

      if (biome.name === 'st_petersburg' && Math.floor(x / step) % 4 === 0) {
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
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
