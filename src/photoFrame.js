// PhotoFrame — the floating memory frame that reveals at each milestone.
// Reveal animation stages (the emotional centerpiece):
//   1. Sparkle burst + shimmer ring + soft chime
//   2. Light beam descends from sky to anchor point
//   3. Frame materializes: scale from 0 with back-ease overshoot + tilt
//   4. Iris reveal of the grey photo placeholder
//   5. Shine sweep across the frame
//   6. Ribbon flourishes in + caption/year fade in
//   7. Frame settles into eternal gentle bob + slow sway
//
// Placeholders are elegant grey cards with subtle gradient + camera icon —
// designed to still look intentional until real photos are dropped in.

class PhotoFrame extends Phaser.GameObjects.Container {
  constructor(scene, x, y, milestone) {
    super(scene, x, y);
    scene.add.existing(this);
    this.milestone = milestone;
    this.setDepth(20);

    // doubled in size per request
    this.frameW = 360;
    this.frameH = 280;
    this.rotOffset = (Math.sin(milestone.id * 1.7) * 0.06);

    this._buildChildren();
    this.container.setScale(0);
    this.container.setAlpha(0);
    this.caption.setAlpha(0);
    this.year.setAlpha(0);

    this.revealed = false;
    this.bornAt = 0;
  }

  _buildChildren() {
    const s = this.scene;
    const w = this.frameW, h = this.frameH;

    this.container = s.add.container(0, 0);
    this.add(this.container);

    // glow halo behind frame (doubled radii + step)
    this.glow = s.add.graphics();
    const accent = Phaser.Display.Color.HexStringToColor(this.milestone.accent).color;
    for (let r = 160; r > 0; r -= 12) {
      const a = (1 - r / 160) * 0.04;
      this.glow.fillStyle(accent, a);
      this.glow.fillRoundedRect(-w / 2 - r, -h / 2 - r, w + r * 2, h + r * 2, 28);
    }
    this.container.add(this.glow);

    // drop shadow (offset scales with size)
    const shadow = s.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-w / 2 + 8, -h / 2 + 12, w, h, 18);
    this.container.add(shadow);

    // outer frame — painterly cream / white
    const frame = s.add.graphics();
    frame.fillStyle(0xFAF5E8, 1);
    frame.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    // inner bevel
    frame.lineStyle(3, 0xD4B88A, 0.9);
    frame.strokeRoundedRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 12);
    // corner flourishes
    const accentLight = this._lighten(accent, 0.4);
    frame.fillStyle(accentLight, 0.85);
    const coff = 16;
    [[ -w / 2 + coff, -h / 2 + coff ], [ w / 2 - coff, -h / 2 + coff ],
     [ -w / 2 + coff,  h / 2 - coff ], [ w / 2 - coff,  h / 2 - coff ]]
      .forEach(([cx, cy]) => frame.fillCircle(cx, cy, 5));
    this.container.add(frame);

    // inner photo area (grey placeholder, scaled 2x)
    const pw = w - 44, ph = h - 80;
    this.photoArea = s.add.graphics();
    // gradient grey
    const strips = 30;
    for (let i = 0; i < strips; i++) {
      const t = i / (strips - 1);
      const c = lerpColor(0x9AA3AD, 0xC8CED5, t);
      this.photoArea.fillStyle(c, 1);
      this.photoArea.fillRect(-pw / 2, -ph / 2 + Math.floor(i * ph / strips), pw, Math.ceil(ph / strips) + 1);
    }
    // camera icon (2x)
    this.photoArea.lineStyle(4, 0xffffff, 0.7);
    this.photoArea.strokeRoundedRect(-36, -36, 72, 48, 6);
    this.photoArea.fillStyle(0xffffff, 0.85);
    this.photoArea.fillCircle(0, -12, 14);
    this.photoArea.fillStyle(0x9AA3AD, 1);
    this.photoArea.fillCircle(0, -12, 8);
    this.photoArea.fillStyle(0xffffff, 0.9);
    this.photoArea.fillRect(16, -44, 16, 8);
    this.container.add(this.photoArea);

    // shine sweep overlay
    this.shine = s.add.graphics();
    this.shine.setAlpha(0);
    this.container.add(this.shine);

    // ribbon flourish at top (2x)
    this.ribbon = s.add.graphics();
    this.ribbon.fillStyle(accent, 1);
    this.ribbon.fillTriangle(-44, -h / 2 - 8, 44, -h / 2 - 8, 0, -h / 2 + 20);
    this.ribbon.fillStyle(0xffffff, 0.35);
    this.ribbon.fillTriangle(-44, -h / 2 - 8, 0, -h / 2 - 8, -22, -h / 2 + 6);
    this.ribbon.setAlpha(0);
    this.container.add(this.ribbon);

    // caption + year below the frame (bigger fonts to match 2x frame)
    this.caption = s.add.text(0, h / 2 + 28, this.milestone.title, {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#FAF5E8',
      stroke: '#2a1a0a',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5);
    this.add(this.caption);

    this.year = s.add.text(0, h / 2 + 54, this.milestone.year, {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: this.milestone.accent,
      stroke: '#2a1a0a',
      strokeThickness: 2,
      fontStyle: 'italic',
    }).setOrigin(0.5);
    this.add(this.year);

    // iris reveal start state
    this.photoArea.setScale(0);
  }

  _lighten(c, t) {
    return lerpColor(c, 0xFFFFFF, t);
  }

  reveal() {
    if (this.revealed) return;
    this.revealed = true;
    this.bornAt = this.scene.time.now;
    const s = this.scene;
    const accent = Phaser.Display.Color.HexStringToColor(this.milestone.accent).color;

    // 1. light beam from sky down to this.y
    const beam = s.add.graphics().setDepth(19);
    const bx = this.x;
    beam.fillStyle(accent, 0.35);
    beam.fillTriangle(bx - 4, 0, bx + 4, 0, bx + 48, this.y);
    beam.fillTriangle(bx - 4, 0, bx + 4, 0, bx - 48, this.y);
    beam.setAlpha(0);
    s.tweens.add({
      targets: beam, alpha: 0.9, duration: 200, yoyo: true, hold: 150,
      onComplete: () => beam.destroy(),
    });

    // 2. sparkle burst
    const burst = s.add.particles(this.x, this.y, '__DEFAULT', {
      speed: { min: 100, max: 280 },
      lifespan: { min: 600, max: 1100 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [accent, 0xFFFFFF, this._lighten(accent, 0.5)],
      quantity: 50,
      emitting: false,
    }).setDepth(25);
    burst.explode(50);
    s.time.delayedCall(1200, () => burst.destroy());

    // shimmer ring
    const ring = s.add.graphics().setDepth(21);
    ring.lineStyle(4, accent, 1);
    ring.strokeCircle(this.x, this.y, 8);
    s.tweens.add({
      targets: ring, scale: 18, alpha: 0, duration: 700,
      ease: 'Cubic.easeOut', onComplete: () => ring.destroy(),
    });

    // 3. frame materializes
    s.tweens.add({
      targets: this.container,
      scale: { from: 0, to: 1 },
      alpha: { from: 0, to: 1 },
      angle: { from: -15, to: this.rotOffset * 57.3 },
      duration: 540,
      ease: 'Back.easeOut',
      onStart: () => s.cameras.main.flash(150, 255, 240, 200, false),
    });

    // ribbon flourish
    s.tweens.add({
      targets: this.ribbon,
      alpha: { from: 0, to: 1 },
      y: { from: -14, to: 0 },
      delay: 320,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // 4. iris reveal of the photo placeholder
    s.tweens.add({
      targets: this.photoArea,
      scale: { from: 0, to: 1 },
      delay: 420,
      duration: 460,
      ease: 'Cubic.easeOut',
    });

    // 5. shine sweep
    s.time.delayedCall(700, () => {
      this.shine.clear();
      const sw = 72;
      this.shine.fillStyle(0xffffff, 0.5);
      this.shine.fillRect(-sw, -this.frameH / 2, sw, this.frameH);
      this.shine.setAlpha(1);
      this.shine.x = -this.frameW / 2 - sw;
      s.tweens.add({
        targets: this.shine, x: this.frameW / 2,
        duration: 480, ease: 'Sine.easeInOut',
        onComplete: () => this.shine.setAlpha(0),
      });
    });

    // 6. caption + year fade in
    s.tweens.add({
      targets: [this.caption, this.year],
      alpha: { from: 0, to: 1 },
      y: '+=8',
      delay: 780,
      duration: 380,
      ease: 'Sine.easeOut',
    });

    // 7. settle into bob
    s.time.delayedCall(700, () => this._startBob());

    // milestone-specific flair
    this._playMilestoneFlair();
  }

  _playMilestoneFlair() {
    const m = this.milestone;
    if (m.cradle)    this._emitCradle();
    if (m.airplane)  this._emitPaperAirplanes();
    if (m.hearts)    this._emitHearts();
    if (m.petals)    this._emitPetals();
    if (m.glow)      this._emitGoldenGlow();
    if (m.waffles)   this._emitWaffles();
    if (m.bus)       this._emitRedBus();
    if (m.keys)      this._emitKeys();
    if (m.fireworks) this._emitFireworks();
  }

  _emitCradle() {
    const s = this.scene;
    const p = s.add.particles(this.x, this.y, '__DEFAULT', {
      speed: { min: 30, max: 90 },
      lifespan: 2000,
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xFFB8D9, 0xB8E0FF, 0xFFE6A7, 0xFFFFFF],
      quantity: 1,
      frequency: 140,
      gravityY: -20,
    }).setDepth(22);
    s.time.delayedCall(4200, () => p.destroy());
  }

  _emitHearts() {
    const s = this.scene;
    const heartTex = this._ensureHeartTexture();
    const p = s.add.particles(this.x, this.y, heartTex, {
      speed: { min: 25, max: 70 },
      angle: { min: 240, max: 300 },
      lifespan: 1800,
      scale: { start: 0.6, end: 1.1 },
      alpha: { start: 1, end: 0 },
      quantity: 1,
      frequency: 150,
    }).setDepth(22);
    s.time.delayedCall(3800, () => p.destroy());
  }

  _emitPetals() {
    const s = this.scene;
    const tex = this._ensurePetalTexture();
    const p = s.add.particles(this.x, this.y - 140, tex, {
      speedX: { min: -25, max: 25 },
      speedY: { min: 25, max: 70 },
      lifespan: 2600,
      scale: 1.1,
      rotate: { start: 0, end: 360 },
      alpha: { start: 1, end: 0 },
      quantity: 1,
      frequency: 80,
    }).setDepth(22);
    s.time.delayedCall(4200, () => p.destroy());
  }

  _emitGoldenGlow() {
    const s = this.scene;
    const p = s.add.particles(this.x, this.y, '__DEFAULT', {
      speed: { min: 15, max: 45 },
      lifespan: 2400,
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: [0xFFE6A7, 0xFFF1C9],
      quantity: 1,
      frequency: 120,
    }).setDepth(22);
    s.time.delayedCall(4800, () => p.destroy());
  }

  _emitKeys() {
    const s = this.scene;
    const tex = this._ensureKeyTexture();
    for (let i = 0; i < 3; i++) {
      s.time.delayedCall(200 * i, () => {
        const k = s.add.image(this.x + (i - 1) * 14, this.y, tex).setDepth(22).setScale(1.6);
        s.tweens.add({
          targets: k, y: this.y - 90, alpha: 0, angle: 180,
          duration: 1500, ease: 'Sine.easeOut', onComplete: () => k.destroy(),
        });
      });
    }
  }

  _emitFireworks() {
    const s = this.scene;
    for (let i = 0; i < 8; i++) {
      s.time.delayedCall(i * 350, () => {
        const fx = this.x + (Math.random() - 0.5) * 440;
        const fy = this.y - 100 - Math.random() * 160;
        const colors = [0xFFD86B, 0xFF6B9D, 0x7DD3FC, 0xC4B5FD, 0xFF9EBB, 0x86EFAC];
        const tint = colors[i % colors.length];
        const p = s.add.particles(fx, fy, '__DEFAULT', {
          speed: { min: 130, max: 220 },
          lifespan: 1000,
          scale: { start: 0.8, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: [tint, 0xFFFFFF],
          quantity: 28,
          emitting: false,
          gravityY: 80,
        }).setDepth(25);
        p.explode(32);
        s.time.delayedCall(1400, () => p.destroy());
      });
    }
  }

  _emitPaperAirplanes() {
    // three paper airplanes fly out of the frame, curving upward.
    const s = this.scene;
    const tex = this._ensurePaperAirplaneTexture();
    for (let i = 0; i < 3; i++) {
      s.time.delayedCall(i * 320, () => {
        const dir = i - 1;                          // -1, 0, +1 -> left, center, right spread
        const plane = s.add.image(this.x, this.y, tex)
          .setDepth(22).setScale(1.2).setAngle(-10 + dir * 20);
        const targetX = this.x + dir * 220 + (40 - Math.random() * 20);
        const targetY = this.y - 160 - Math.random() * 80;
        s.tweens.add({
          targets: plane,
          x: targetX,
          y: targetY,
          angle: -40 + dir * 25,
          alpha: 0,
          duration: 2400,
          ease: 'Sine.easeOut',
          onComplete: () => plane.destroy(),
        });
        // gentle waver as it flies
        s.tweens.add({
          targets: plane,
          angle: `+=${6 + dir * 4}`,
          duration: 400,
          yoyo: true, repeat: 2,
          ease: 'Sine.easeInOut',
        });
      });
    }
  }

  _emitWaffles() {
    // warm Belgian waffles floating upward with a lazy rotation.
    const s = this.scene;
    const tex = this._ensureWaffleTexture();
    const p = s.add.particles(this.x, this.y + 40, tex, {
      speedX: { min: -25, max: 25 },
      speedY: { min: -70, max: -40 },
      lifespan: 2800,
      scale: { start: 0.8, end: 1.1 },
      alpha: { start: 1, end: 0 },
      rotate: { min: -180, max: 180 },
      quantity: 1,
      frequency: 240,
    }).setDepth(22);
    s.time.delayedCall(4200, () => p.destroy());
  }

  _emitRedBus() {
    // a London double-decker sails past in the middle distance.
    const s = this.scene;
    const tex = this._ensureBusTexture();
    const groundY = WORLD.groundY;
    const startX = this.x - 560;
    const bus = s.add.image(startX, groundY - 28, tex)
      .setDepth(7).setScale(0.85).setAlpha(0.95);
    s.tweens.add({
      targets: bus,
      x: this.x + 560,
      duration: 5200,
      ease: 'Sine.inOut',
      onComplete: () => bus.destroy(),
    });
    // tiny bounce as it rolls over cobbles
    s.tweens.add({
      targets: bus,
      y: groundY - 30,
      duration: 180,
      yoyo: true, repeat: 13,
      ease: 'Sine.easeInOut',
    });
  }

  _ensurePaperAirplaneTexture() {
    const key = 'tex_airplane';
    if (this.scene.textures.exists(key)) return key;
    const g = this.scene.add.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xFFFFFF, 1);
    g.fillTriangle(0, 10, 26, 2, 26, 18);
    g.fillStyle(0xE0E4EA, 1);
    g.fillTriangle(0, 10, 22, 10, 26, 18);
    g.lineStyle(1, 0xA8AEB8, 1);
    g.lineBetween(0, 10, 26, 10);
    g.generateTexture(key, 26, 20);
    g.destroy();
    return key;
  }

  _ensureWaffleTexture() {
    const key = 'tex_waffle';
    if (this.scene.textures.exists(key)) return key;
    const g = this.scene.add.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xC28049, 1);
    g.fillRoundedRect(0, 0, 24, 22, 4);
    g.fillStyle(0xD89960, 1);
    g.fillRoundedRect(2, 2, 20, 18, 3);
    g.fillStyle(0x8B5A2B, 1);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        g.fillRect(4 + c * 6, 4 + r * 5, 3, 3);
      }
    }
    // tiny syrup sheen
    g.fillStyle(0xFFF1A8, 0.4);
    g.fillEllipse(10, 5, 10, 3);
    g.generateTexture(key, 24, 22);
    g.destroy();
    return key;
  }

  _ensureBusTexture() {
    const key = 'tex_bus';
    if (this.scene.textures.exists(key)) return key;
    const w = 104, h = 56;
    const g = this.scene.add.graphics({ x: 0, y: 0, add: false });
    // body
    g.fillStyle(0xC83327, 1);
    g.fillRoundedRect(0, 6, w, h - 16, 4);
    // upper deck windows
    g.fillStyle(0xFFEEC8, 0.95);
    g.fillRect(6, 10, w - 12, 12);
    // lower deck windows
    g.fillRect(6, 28, w - 28, 12);
    // door
    g.fillStyle(0x6A1A12, 1);
    g.fillRect(w - 20, 28, 12, 14);
    // window dividers + panel gap
    g.fillStyle(0xC83327, 1);
    for (let i = 1; i < 6; i++) {
      g.fillRect(6 + i * ((w - 12) / 6) - 1, 10, 2, 12);
    }
    for (let i = 1; i < 5; i++) {
      g.fillRect(6 + i * ((w - 28) / 5) - 1, 28, 2, 12);
    }
    // highlight strip between decks
    g.fillStyle(0xE85547, 1);
    g.fillRect(2, 24, w - 4, 2);
    // headlight
    g.fillStyle(0xFFE8A8, 1);
    g.fillCircle(w - 4, 22, 2);
    // wheels
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(18, h - 8, 7);
    g.fillCircle(w - 22, h - 8, 7);
    g.fillStyle(0x606060, 1);
    g.fillCircle(18, h - 8, 3);
    g.fillCircle(w - 22, h - 8, 3);
    g.generateTexture(key, w, h);
    g.destroy();
    return key;
  }

  _ensureHeartTexture() {
    const key = 'tex_heart';
    if (this.scene.textures.exists(key)) return key;
    const g = this.scene.add.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xFF6B9D, 1);
    g.fillCircle(5, 5, 5); g.fillCircle(13, 5, 5); g.fillTriangle(0, 7, 18, 7, 9, 18);
    g.generateTexture(key, 18, 18); g.destroy();
    return key;
  }

  _ensurePetalTexture() {
    const key = 'tex_petal';
    if (this.scene.textures.exists(key)) return key;
    const g = this.scene.add.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xFFC6D9, 1);
    g.fillEllipse(6, 8, 10, 14);
    g.fillStyle(0xFFFFFF, 0.5);
    g.fillEllipse(4, 6, 4, 8);
    g.generateTexture(key, 12, 16); g.destroy();
    return key;
  }

  _ensureKeyTexture() {
    const key = 'tex_key';
    if (this.scene.textures.exists(key)) return key;
    const g = this.scene.add.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xFFD86B, 1);
    g.fillCircle(5, 5, 4);
    g.fillRect(8, 4, 12, 2);
    g.fillRect(16, 6, 2, 3);
    g.fillRect(13, 6, 2, 3);
    g.generateTexture(key, 22, 10); g.destroy();
    return key;
  }

  _startBob() {
    this.scene.tweens.add({
      targets: this.container,
      y: { from: 0, to: -10 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: this.container,
      angle: `+=${2 + this.milestone.id * 0.1}`,
      duration: 3800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
