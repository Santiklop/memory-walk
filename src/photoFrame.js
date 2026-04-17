// PhotoFrame — the floating memory frame that reveals at each milestone.
// The reveal is the emotional centerpiece. Animation steps:
//
//   1. Trigger → sparkle burst + soft chime
//   2. Light beam descends from sky to anchor point
//   3. Frame materializes: scale from 0 with back-ease overshoot,
//      dual rotation wobble, ribbon flourish
//   4. "Photo" placeholder does an iris/unfold reveal (grey card),
//      scanning light sweep across it
//   5. Year + title fade in beneath
//   6. Frame settles into eternal gentle bob + slow sway
//
// Placeholder photos are elegant grey cards with a subtle gradient and
// a tiny camera icon + "memory" — easy to swap for real images later.

class PhotoFrame extends Phaser.GameObjects.Container {
  constructor(scene, x, y, milestone) {
    super(scene, x, y);
    scene.add.existing(this);
    this.milestone = milestone;
    this.setDepth(20);

    this.frameW = 180;
    this.frameH = 140;
    this.rotOffset = (Math.sin(milestone.id * 1.7) * 0.06); // gentle variance

    // container children (built but hidden until reveal)
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

    // glow halo behind frame
    this.glow = s.add.graphics();
    const accent = Phaser.Display.Color.HexStringToColor(this.milestone.accent).color;
    for (let r = 80; r > 0; r -= 8) {
      const a = (1 - r / 80) * 0.04;
      this.glow.fillStyle(accent, a);
      this.glow.fillRoundedRect(-w / 2 - r, -h / 2 - r, w + r * 2, h + r * 2, 18);
    }
    this.container.add(this.glow);

    // frame drop shadow
    const shadow = s.add.graphics();
    shadow.fillStyle(0x000000, 0.25);
    shadow.fillRoundedRect(-w / 2 + 4, -h / 2 + 6, w, h, 10);
    this.container.add(shadow);

    // outer frame (painterly white)
    const frame = s.add.graphics();
    frame.fillStyle(0xFAF5E8, 1);
    frame.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    // inner frame bevel
    frame.lineStyle(1.5, 0xD4B88A, 0.9);
    frame.strokeRoundedRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 6);
    // corner flourishes
    frame.fillStyle(this._lighten(Phaser.Display.Color.HexStringToColor(this.milestone.accent).color, 0.4), 0.85);
    const corners = [
      [-w / 2 + 8, -h / 2 + 8],
      [ w / 2 - 8, -h / 2 + 8],
      [-w / 2 + 8,  h / 2 - 8],
      [ w / 2 - 8,  h / 2 - 8],
    ];
    corners.forEach(([cx, cy]) => frame.fillCircle(cx, cy, 2.5));
    this.container.add(frame);

    // inner photo area (grey placeholder)
    const pw = w - 22, ph = h - 40;
    this.photoArea = s.add.graphics();
    // base grey
    for (let i = 0; i < 20; i++) {
      const t = i / 19;
      const c = lerpColor(0x9AA3AD, 0xC8CED5, t);
      this.photoArea.fillStyle(c, 1);
      this.photoArea.fillRect(-pw / 2, -ph / 2 - 8 + Math.floor(i * ph / 20), pw, Math.ceil(ph / 20) + 1);
    }
    // camera icon
    this.photoArea.lineStyle(2, 0xffffff, 0.7);
    this.photoArea.strokeRoundedRect(-18, -18, 36, 24, 3);
    this.photoArea.fillStyle(0xffffff, 0.85);
    this.photoArea.fillCircle(0, -6, 7);
    this.photoArea.fillStyle(0x9AA3AD, 1);
    this.photoArea.fillCircle(0, -6, 4);
    this.photoArea.fillStyle(0xffffff, 0.9);
    this.photoArea.fillRect(8, -22, 8, 4);
    this.container.add(this.photoArea);

    // mask for iris reveal
    this.photoMask = s.make.graphics({ x: 0, y: 0, add: false });
    const maskG = this.photoMask;
    maskG.fillStyle(0xffffff, 1);
    maskG.fillRect(-pw / 2 - 4, 8 - 8, pw + 8, 2); // will expand
    // actually use geometryMask - build a rect we animate
    // we'll animate this.photoArea directly via scissor via crop — simpler: scale photoArea from 0.
    // revert: no mask, will animate photoArea scale

    // shine sweep overlay
    this.shine = s.add.graphics();
    this.shine.setAlpha(0);
    this.container.add(this.shine);

    // ribbon at top
    this.ribbon = s.add.graphics();
    this.ribbon.fillStyle(Phaser.Display.Color.HexStringToColor(this.milestone.accent).color, 1);
    this.ribbon.fillTriangle(-22, -h / 2 - 4, 22, -h / 2 - 4, 0, -h / 2 + 10);
    this.ribbon.fillStyle(0xffffff, 0.35);
    this.ribbon.fillTriangle(-22, -h / 2 - 4, 0, -h / 2 - 4, -11, -h / 2 + 3);
    this.ribbon.setAlpha(0);
    this.container.add(this.ribbon);

    // caption + year below the frame
    this.caption = s.add.text(0, h / 2 + 18, this.milestone.title, {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#FAF5E8',
      stroke: '#2a1a0a',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5);
    this.add(this.caption);

    this.year = s.add.text(0, h / 2 + 36, this.milestone.year, {
      fontFamily: 'Georgia, serif',
      fontSize: '11px',
      color: this.milestone.accent,
      stroke: '#2a1a0a',
      strokeThickness: 2,
      fontStyle: 'italic',
    }).setOrigin(0.5);
    this.add(this.year);

    // initial photoArea scale 0 for iris reveal
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
    beam.fillTriangle(bx - 4, 0, bx + 4, 0, bx + 36, this.y);
    beam.fillTriangle(bx - 4, 0, bx + 4, 0, bx - 36, this.y);
    beam.setAlpha(0);
    s.tweens.add({
      targets: beam,
      alpha: 0.9,
      duration: 180,
      yoyo: true,
      hold: 120,
      onComplete: () => beam.destroy(),
    });

    // 2. sparkle burst
    const burst = s.add.particles(this.x, this.y, '__DEFAULT', {
      speed: { min: 80, max: 220 },
      lifespan: { min: 500, max: 900 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [accent, 0xFFFFFF, this._lighten(accent, 0.5)],
      quantity: 40,
      emitting: false,
    }).setDepth(25);
    burst.explode(40);
    s.time.delayedCall(1000, () => burst.destroy());

    // small poof ring
    const ring = s.add.graphics().setDepth(21);
    ring.lineStyle(3, accent, 1);
    ring.strokeCircle(this.x, this.y, 6);
    s.tweens.add({
      targets: ring,
      scale: 12,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    // 3. frame materializes
    s.tweens.add({
      targets: this.container,
      scale: { from: 0, to: 1 },
      alpha: { from: 0, to: 1 },
      angle: { from: -15, to: this.rotOffset * 57.3 },
      duration: 480,
      ease: 'Back.easeOut',
      onStart: () => s.cameras.main.flash(150, 255, 240, 200, false),
    });

    // ribbon flourish slightly delayed
    s.tweens.add({
      targets: this.ribbon,
      alpha: { from: 0, to: 1 },
      y: { from: -10, to: 0 },
      delay: 280,
      duration: 260,
      ease: 'Back.easeOut',
    });

    // 4. iris reveal of the photo placeholder
    s.tweens.add({
      targets: this.photoArea,
      scale: { from: 0, to: 1 },
      delay: 380,
      duration: 420,
      ease: 'Cubic.easeOut',
    });

    // 5. shine sweep across frame
    s.time.delayedCall(620, () => {
      this.shine.clear();
      const sw = 36;
      this.shine.fillStyle(0xffffff, 0.5);
      this.shine.fillRect(-sw, -this.frameH / 2, sw, this.frameH);
      this.shine.setAlpha(1);
      this.shine.x = -this.frameW / 2 - sw;
      s.tweens.add({
        targets: this.shine,
        x: this.frameW / 2,
        duration: 420,
        ease: 'Sine.easeInOut',
        onComplete: () => this.shine.setAlpha(0),
      });
    });

    // 6. caption + year fade in
    s.tweens.add({
      targets: [this.caption, this.year],
      alpha: { from: 0, to: 1 },
      y: '+=6',
      delay: 700,
      duration: 360,
      ease: 'Sine.easeOut',
    });

    // 7. start bob loop (gentle levitation)
    s.time.delayedCall(600, () => this._startBob());

    // optional per-milestone flairs
    this._playMilestoneFlair();
  }

  _playMilestoneFlair() {
    const s = this.scene;
    const m = this.milestone;
    if (m.hearts) this._emitHearts();
    if (m.petals) this._emitPetals();
    if (m.glow) this._emitGoldenGlow();
    if (m.keys) this._emitKeys();
    if (m.fireworks) this._emitFireworks();
  }

  _emitHearts() {
    const s = this.scene;
    const heartTex = this._ensureHeartTexture();
    const p = s.add.particles(this.x, this.y, heartTex, {
      speed: { min: 20, max: 60 },
      angle: { min: 240, max: 300 },
      lifespan: 1600,
      scale: { start: 0.5, end: 0.9 },
      alpha: { start: 1, end: 0 },
      quantity: 1,
      frequency: 160,
    }).setDepth(22);
    s.time.delayedCall(3500, () => p.destroy());
  }
  _emitPetals() {
    const s = this.scene;
    const tex = this._ensurePetalTexture();
    const p = s.add.particles(this.x, this.y - 80, tex, {
      speedX: { min: -20, max: 20 },
      speedY: { min: 20, max: 60 },
      lifespan: 2400,
      scale: 0.9,
      rotate: { start: 0, end: 360 },
      alpha: { start: 1, end: 0 },
      quantity: 1,
      frequency: 90,
    }).setDepth(22);
    s.time.delayedCall(4000, () => p.destroy());
  }
  _emitGoldenGlow() {
    const s = this.scene;
    const burst = s.add.particles(this.x, this.y, '__DEFAULT', {
      speed: { min: 10, max: 40 },
      lifespan: 2200,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: [0xFFE6A7, 0xFFF1C9],
      quantity: 1,
      frequency: 120,
    }).setDepth(22);
    s.time.delayedCall(4500, () => burst.destroy());
  }
  _emitKeys() {
    const s = this.scene;
    const tex = this._ensureKeyTexture();
    for (let i = 0; i < 3; i++) {
      s.time.delayedCall(200 * i, () => {
        const k = s.add.image(this.x + (i - 1) * 10, this.y, tex).setDepth(22);
        s.tweens.add({
          targets: k, y: this.y - 60, alpha: 0, angle: 180,
          duration: 1400, ease: 'Sine.easeOut', onComplete: () => k.destroy(),
        });
      });
    }
  }
  _emitFireworks() {
    const s = this.scene;
    for (let i = 0; i < 6; i++) {
      s.time.delayedCall(i * 400, () => {
        const fx = this.x + (Math.random() - 0.5) * 300;
        const fy = this.y - 80 - Math.random() * 120;
        const colors = [0xFFD86B, 0xFF6B9D, 0x7DD3FC, 0xC4B5FD, 0xFF9EBB];
        const tint = colors[i % colors.length];
        const p = s.add.particles(fx, fy, '__DEFAULT', {
          speed: { min: 120, max: 200 },
          lifespan: 900,
          scale: { start: 0.7, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: [tint, 0xFFFFFF],
          quantity: 24,
          emitting: false,
        }).setDepth(25);
        p.explode(30);
        s.time.delayedCall(1200, () => p.destroy());
      });
    }
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
      y: { from: 0, to: -6 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: this.container,
      angle: `+=${2 + this.milestone.id * 0.1}`,
      duration: 3500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
