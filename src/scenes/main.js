class MainScene extends Phaser.Scene {
  constructor() {
    super('Main');
    this.keysCombined = {};
  }

  create() {
    const { width, height, groundY, viewW, viewH } = WORLD;

    this.physics.world.setBounds(0, 0, width, height + 200);
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setBackgroundColor('#FFE5C2');

    // background
    this.bg = new Background(this);
    this.bg.build();

    // invisible ground collider spanning the world
    this.ground = this.physics.add.staticGroup();
    const groundBody = this.ground.create(width / 2, groundY + 40, null).setVisible(false);
    groundBody.displayWidth = width;
    groundBody.displayHeight = 80;
    groundBody.refreshBody();

    // obstacles
    this.obs = new Obstacles(this, groundY);
    this.obs.build();

    // character
    this.katya = new Katya(this, 200, groundY - 10);
    this.physics.add.collider(this.katya, this.ground);
    this.physics.add.collider(this.katya, this.obs.group);

    // camera
    this.cameras.main.startFollow(this.katya, true, 0.1, 0.1, 0, 80);
    this.cameras.main.setDeadzone(80, 40);

    // photo frames at each milestone — raised higher to match 2x size
    this.frames = [];
    MILESTONES.forEach(m => {
      const frame = new PhotoFrame(this, m.x, groundY - 340, m);
      this.frames.push(frame);

      const zone = this.add.zone(m.x, groundY - 40, 60, 80);
      this.physics.add.existing(zone, true);
      zone.milestone = m;
      zone.frame = frame;

      this.physics.add.overlap(this.katya, zone, () => {
        if (!frame.revealed) {
          frame.reveal();
          if (m.growth) {
            this.time.delayedCall(300, () => this.katya.grow());
          }
          this._chime(m.accent);
          this.cameras.main.shake(120, 0.003);
        }
      });
    });

    // HUD
    this._buildHUD();

    // input
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
    });

    const k = this.keys;
    const tk = () => window.touchKeys || { left: false, right: false, jump: false };
    Object.defineProperty(this.keysCombined, 'left',  { get: () => ({ isDown: k.left.isDown  || k.a.isDown || tk().left }) });
    Object.defineProperty(this.keysCombined, 'right', { get: () => ({ isDown: k.right.isDown || k.d.isDown || tk().right }) });
    Object.defineProperty(this.keysCombined, 'up',    { get: () => ({ isDown: k.up.isDown    || k.w.isDown || tk().jump }) });
    Object.defineProperty(this.keysCombined, 'space', { get: () => ({ isDown: k.space.isDown                || tk().jump }) });

    this.cameras.main.fadeIn(600, 255, 240, 200);

    this.finaleTriggered = false;
  }

  _buildHUD() {
    const { viewW } = WORLD;
    const barX = 32, barY = 24, barW = viewW - 64, barH = 10;

    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(1000);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.35);
    bg.fillRoundedRect(barX - 4, barY - 4, barW + 8, barH + 8, 6);
    this.hud.add(bg);

    const track = this.add.graphics();
    track.fillStyle(0xFAF5E8, 0.25);
    track.fillRoundedRect(barX, barY, barW, barH, 5);
    this.hud.add(track);

    this.hudFill = this.add.graphics();
    this.hud.add(this.hudFill);

    MILESTONES.forEach((m) => {
      const t = m.x / WORLD.width;
      const px = barX + t * barW;
      const accent = Phaser.Display.Color.HexStringToColor(m.accent).color;
      const pip = this.add.circle(px, barY + barH / 2, 5, accent, 0.6).setStrokeStyle(1.5, 0xFAF5E8, 0.9);
      pip.m = m;
      this.hud.add(pip);
      m._pip = pip;
    });

    this.hudLabel = this.add.text(barX, barY + barH + 10,
      `0 / ${MILESTONES.length} memories`, {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#FAF5E8',
      fontStyle: 'italic',
    });
    this.hud.add(this.hudLabel);
  }

  update(time, delta) {
    this.katya.update(delta, this.keysCombined);

    const p = Phaser.Math.Clamp(this.katya.x / WORLD.width, 0, 1);
    this.hudFill.clear();
    this.hudFill.fillStyle(0xFFD86B, 0.85);
    this.hudFill.fillRoundedRect(32, 24, (WORLD.viewW - 64) * p, 10, 5);

    const revealedCount = this.frames.filter(f => f.revealed).length;
    this.hudLabel.setText(`${revealedCount} / ${MILESTONES.length} memories`);
    MILESTONES.forEach(m => {
      if (m._pip && this.frames.find(f => f.milestone.id === m.id).revealed) {
        m._pip.setFillStyle(Phaser.Display.Color.HexStringToColor(m.accent).color, 1);
      }
    });

    const last = this.frames[this.frames.length - 1];
    if (last.revealed && !this.finaleTriggered && time - last.bornAt > 2200) {
      this.finaleTriggered = true;
      this._onFinale();
    }
  }

  _chime() {
    try {
      const ctx = this.sound.context;
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [880, 1318.5, 1760];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0, now + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.14, now + i * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.9);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 1.0);
      });
    } catch (e) {}
  }

  // --- Finale ---
  _onFinale() {
    const { viewW, viewH } = WORLD;

    // dim overlay behind the banner so text pops
    const dim = this.add.graphics().setScrollFactor(0).setDepth(1000);
    dim.fillStyle(0x000000, 0);
    dim.fillRect(0, 0, viewW, viewH);
    this.tweens.add({ targets: dim, alpha: 0.32, duration: 800 });

    // Big "Happy Birthday, Katya" banner
    const banner = this.add.text(viewW / 2, viewH / 2 - 40, 'Happy Birthday,', {
      fontFamily: 'Georgia, serif',
      fontSize: '42px',
      color: '#FAF5E8',
      fontStyle: 'italic',
      stroke: '#2a1a0a',
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002).setAlpha(0).setScale(0.7);

    const katyaName = this.add.text(viewW / 2, viewH / 2 + 30, 'Katya', {
      fontFamily: 'Georgia, serif',
      fontSize: '120px',
      color: '#FFD86B',
      fontStyle: 'italic',
      stroke: '#2a1a0a',
      strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002).setAlpha(0).setScale(0.6);

    // flourish underline
    const flourish = this.add.graphics().setScrollFactor(0).setDepth(1002).setAlpha(0);
    flourish.lineStyle(2, 0xFFD86B, 0.95);
    flourish.lineBetween(viewW / 2 - 200, viewH / 2 + 100, viewW / 2 + 200, viewH / 2 + 100);
    flourish.fillStyle(0xFFD86B, 1);
    flourish.fillCircle(viewW / 2, viewH / 2 + 100, 3);
    flourish.fillCircle(viewW / 2 - 70, viewH / 2 + 100, 2);
    flourish.fillCircle(viewW / 2 + 70, viewH / 2 + 100, 2);

    this.tweens.add({ targets: banner,    alpha: 1, scale: 1, duration: 800, ease: 'Back.easeOut', delay: 200 });
    this.tweens.add({ targets: katyaName, alpha: 1, scale: 1, duration: 1000, ease: 'Back.easeOut', delay: 700 });
    this.tweens.add({ targets: flourish,  alpha: 1,           duration: 800, delay: 1400 });

    // gentle glow pulse on Katya
    this.tweens.add({
      targets: katyaName, scale: { from: 1, to: 1.06 },
      duration: 1800, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut', delay: 1800,
    });

    // Fireworks show — periodic bursts across the sky for ~6 seconds
    const fireworksEnd = this.time.now + 6500;
    const scheduleBurst = (delay) => {
      this.time.delayedCall(delay, () => {
        this._fireworkBurst();
        if (this.time.now + 350 < fireworksEnd) scheduleBurst(220 + Math.random() * 280);
      });
    };
    scheduleBurst(0);
    scheduleBurst(180);
    scheduleBurst(360);

    // confetti from the top, screen-space
    this._confettiShower();

    // finale fanfare sound
    this._fanfare();

    // After celebration — fade dim, shrink banner to top, start walk-back pan
    this.time.delayedCall(6500, () => {
      this.tweens.add({ targets: dim, alpha: 0, duration: 1000 });
      this.tweens.add({
        targets: [banner, katyaName, flourish],
        alpha: 0.55,
        duration: 1200,
      });
      // shrink + move banner to top
      this.tweens.add({
        targets: banner,    y: 70,  scale: 0.45, duration: 1200, ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: katyaName, y: 105, scale: 0.45, duration: 1200, ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: flourish,  y: -20, alpha: 0, duration: 1000,
      });

      const hint = this.add.text(viewW / 2, viewH - 44,
        '↩  walk back through your memories', {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#FAF5E8',
        fontStyle: 'italic',
        stroke: '#2a1a0a',
        strokeThickness: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setAlpha(0);
      this.tweens.add({ targets: hint, alpha: 1, duration: 1200, delay: 600 });
    });
  }

  _fireworkBurst() {
    const { viewW, viewH } = WORLD;
    const fx = 80 + Math.random() * (viewW - 160);
    const fy = 60 + Math.random() * (viewH * 0.5);
    const colors = [0xFFD86B, 0xFF6B9D, 0x7DD3FC, 0xC4B5FD, 0xFF9EBB, 0x86EFAC, 0xFFFFFF];
    const tint = colors[Math.floor(Math.random() * colors.length)];

    // rising trail
    const trail = this.add.particles(fx, viewH, '__DEFAULT', {
      speedY: -600,
      lifespan: 260,
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [tint],
      quantity: 6,
      emitting: false,
    }).setScrollFactor(0).setDepth(1000);
    trail.explode(6);
    this.time.delayedCall(400, () => trail.destroy());

    // main burst after trail
    this.time.delayedCall(220, () => {
      const p = this.add.particles(fx, fy, '__DEFAULT', {
        speed: { min: 150, max: 260 },
        lifespan: 1100,
        scale: { start: 0.9, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [tint, 0xFFFFFF],
        quantity: 50,
        emitting: false,
        gravityY: 180,
      }).setScrollFactor(0).setDepth(1000);
      p.explode(50);
      this.time.delayedCall(1400, () => p.destroy());
      this._popSound();
    });
  }

  _confettiShower() {
    const tex = this._ensureConfettiTex();
    const { viewW } = WORLD;
    const confetti = this.add.particles(0, -10, tex, {
      x: { min: 0, max: viewW },
      y: -30,
      speedY: { min: 70, max: 200 },
      speedX: { min: -40, max: 40 },
      lifespan: 5000,
      scale: { start: 1, end: 0.9 },
      alpha: { start: 1, end: 0 },
      rotate: { start: 0, end: 720 },
      tint: [0xFFD86B, 0xFF6B9D, 0x7DD3FC, 0xC4B5FD, 0x86EFAC, 0xFFFFFF],
      frequency: 45,
    }).setScrollFactor(0).setDepth(999);
    this.time.delayedCall(8500, () => confetti.destroy());
  }

  _ensureConfettiTex() {
    const key = 'tex_confetti';
    if (this.textures.exists(key)) return key;
    const g = this.add.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 6, 10);
    g.generateTexture(key, 6, 10);
    g.destroy();
    return key;
  }

  _popSound() {
    try {
      const ctx = this.sound.context;
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  _fanfare() {
    try {
      const ctx = this.sound.context;
      if (!ctx) return;
      const now = ctx.currentTime;
      // C major triad arpeggio → octave
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        const start = now + i * 0.1;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.14, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 1.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 1.5);
      });
    } catch (e) {}
  }
}
