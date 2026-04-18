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

    // character — depth 15 keeps her in front of the passing bus (depth 7)
    // and obstacles (depth 9-10), but behind photo frames (depth 20).
    this.katya = new Katya(this, 200, groundY - 10);
    this.katya.setDepth(15);
    this.physics.add.collider(this.katya, this.ground);
    this.physics.add.collider(this.katya, this.obs.group);

    // camera
    this.cameras.main.startFollow(this.katya, true, 0.1, 0.1, 0, 80);
    this.cameras.main.setDeadzone(80, 40);

    // photo frames at each milestone — raised higher to match 2x size.
    // Reveals are triggered by x-position in update() (not physics overlap),
    // because a tall jump can take Katya's hitbox entirely above a ground-
    // level trigger zone and miss it.
    this.frames = [];
    MILESTONES.forEach(m => {
      const frame = new PhotoFrame(this, m.x, groundY - 340, m);
      this.frames.push(frame);
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

    // atmospheric particles per biome (snow / leaves / mist / rain / petals)
    this._setupBiomeParticles();
    this._lastParticleBiome = null;

    // Amsterdam ambient bikes — a cyclist periodically rides across the
    // viewport while Katya is in the Amsterdam segment.
    this._bikeTimer = 0;
    this._bikeInterval = 3500; // first bike comes sooner
  }

  _setupBiomeParticles() {
    const { viewW } = WORLD;

    // textures for each particle type
    const mkTex = (key, drawer, w, h) => {
      if (this.textures.exists(key)) return key;
      const g = this.add.graphics({ x: 0, y: 0, add: false });
      drawer(g);
      g.generateTexture(key, w, h);
      g.destroy();
      return key;
    };

    const snowTex = mkTex('tex_snow', (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(3, 3, 3);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(3, 3, 5);
    }, 6, 6);
    const rainTex = mkTex('tex_rain', (g) => {
      g.fillStyle(0xC5D0DC, 0.9);
      g.fillRect(0, 0, 1, 10);
    }, 1, 10);
    const leafTex = mkTex('tex_ambleaf', (g) => {
      g.fillStyle(0xD4A560, 1);
      g.fillTriangle(0, 3, 4, 0, 8, 3);
      g.fillTriangle(0, 3, 4, 6, 8, 3);
      g.fillStyle(0x9B6A2A, 0.8);
      g.fillRect(3.5, 3, 1, 3);
    }, 8, 8);
    const mistTex = mkTex('tex_mist', (g) => {
      g.fillStyle(0xE8E8E8, 0.5);
      g.fillEllipse(20, 8, 36, 12);
    }, 40, 16);
    const petalTex = mkTex('tex_atulip', (g) => {
      g.fillStyle(0xFF8A3D, 1);
      g.fillEllipse(4, 5, 6, 10);
      g.fillStyle(0xE63946, 0.6);
      g.fillEllipse(3, 3, 3, 5);
    }, 8, 10);

    // emitter configs — all scrollFactor 0 so particles fill the visible screen
    this.biomeEmitters = {
      siberia: this.add.particles(0, -10, snowTex, {
        x: { min: -30, max: viewW + 30 },
        y: { min: -20, max: -10 },
        speedY: { min: 25, max: 55 },
        speedX: { min: -15, max: 15 },
        lifespan: { min: 9000, max: 14000 },
        scale: { min: 0.6, max: 1.2 },
        alpha: { start: 0.9, end: 0.9 },
        frequency: 90,
        emitting: false,
      }).setScrollFactor(0).setDepth(900),

      st_petersburg: this.add.particles(0, -10, leafTex, {
        x: { min: -30, max: viewW + 30 },
        y: { min: -20, max: -10 },
        speedY: { min: 30, max: 55 },
        speedX: { min: -35, max: 35 },
        lifespan: { min: 9000, max: 13000 },
        scale: { min: 0.8, max: 1.4 },
        rotate: { min: 0, max: 360 },
        alpha: { start: 0.95, end: 0.95 },
        frequency: 260,
        emitting: false,
      }).setScrollFactor(0).setDepth(900),

      belgium: this.add.particles(0, 0, mistTex, {
        x: { min: -40, max: viewW + 40 },
        y: { min: 260, max: 520 },
        speedX: { min: 18, max: 34 },
        speedY: { min: -2, max: 4 },
        lifespan: { min: 10000, max: 15000 },
        scale: { min: 1, max: 1.8 },
        // onUpdate callback drives the alpha envelope (in-out fade across lifespan)
        alpha: {
          onEmit: () => 0,
          onUpdate: (_particle, _key, t) => Math.sin(t * Math.PI) * 0.42,
        },
        frequency: 500,
        emitting: false,
      }).setScrollFactor(0).setDepth(900),

      london: this.add.particles(0, -10, rainTex, {
        x: { min: -40, max: viewW + 60 },
        y: { min: -20, max: -10 },
        speedY: { min: 520, max: 700 },
        speedX: { min: -80, max: -60 }, // slight slant
        lifespan: { min: 1400, max: 1700 },
        scale: { start: 1, end: 0.9 },
        alpha: 0.7,
        frequency: 20,
        emitting: false,
      }).setScrollFactor(0).setDepth(900),

      amsterdam: this.add.particles(0, -10, petalTex, {
        x: { min: -30, max: viewW + 30 },
        y: { min: -20, max: -10 },
        speedY: { min: 30, max: 55 },
        speedX: { min: -25, max: 25 },
        lifespan: { min: 9000, max: 13000 },
        scale: { min: 0.8, max: 1.4 },
        rotate: { min: 0, max: 360 },
        alpha: 0.95,
        frequency: 420,
        emitting: false,
      }).setScrollFactor(0).setDepth(900),
    };
  }

  _updateBiomeParticles() {
    const biome = this.bg._biomeAt(this.katya.x);
    if (!biome || biome.name === this._lastParticleBiome) return;
    if (this._lastParticleBiome && this.biomeEmitters[this._lastParticleBiome]) {
      this.biomeEmitters[this._lastParticleBiome].stop();
    }
    const next = this.biomeEmitters[biome.name];
    if (next) next.start();
    this._lastParticleBiome = biome.name;
  }

  _updateAmsterdamBikes(delta) {
    if (this._lastParticleBiome !== 'amsterdam') {
      this._bikeTimer = 0;
      return;
    }
    this._bikeTimer += delta;
    if (this._bikeTimer >= this._bikeInterval) {
      this._bikeTimer = 0;
      this._bikeInterval = 3500 + Math.random() * 4500; // 3.5 – 8s between bikes
      this._spawnAmsterdamBike();
    }
  }

  _spawnAmsterdamBike() {
    const { viewW, groundY } = WORLD;
    const tex = this._ensureBikeTexture();
    const dir = Math.random() > 0.5 ? 1 : -1;
    const startX = dir === 1 ? -70 : viewW + 70;
    const endX = dir === 1 ? viewW + 70 : -70;
    const y = groundY - 14;
    // A bike heading the same direction as Katya rides behind her (depth 12),
    // an oncoming one rides in front (depth 18) — creates a believable
    // two-lane street feel.
    const depth = dir === 1 ? 12 : 18;
    const bike = this.add.image(startX, y, tex)
      .setScrollFactor(0)
      .setDepth(depth)
      .setScale(0.95);
    if (dir === -1) bike.setFlipX(true);
    const duration = 5000 + Math.random() * 2500;
    this.tweens.add({
      targets: bike,
      x: endX,
      duration: duration,
      ease: 'Linear',
      onComplete: () => bike.destroy(),
    });
    // tiny bob as she rides over cobbles
    this.tweens.add({
      targets: bike,
      y: { from: y, to: y - 1.2 },
      duration: 110,
      yoyo: true,
      repeat: Math.floor(duration / 220),
    });
  }

  _ensureBikeTexture() {
    const key = 'tex_cyclist';
    if (this.textures.exists(key)) return key;
    const g = this.add.graphics({ x: 0, y: 0, add: false });
    const W = 48, H = 44;
    // wheels
    g.lineStyle(1.6, 0x1A1A1A, 1);
    g.strokeCircle(9, 34, 8);
    g.strokeCircle(37, 34, 8);
    // spokes hint
    g.lineStyle(0.5, 0x606060, 0.9);
    [0, Math.PI / 2].forEach((a) => {
      g.lineBetween(9 + Math.cos(a) * 7, 34 + Math.sin(a) * 7, 9 - Math.cos(a) * 7, 34 - Math.sin(a) * 7);
      g.lineBetween(37 + Math.cos(a) * 7, 34 + Math.sin(a) * 7, 37 - Math.cos(a) * 7, 34 - Math.sin(a) * 7);
    });
    g.fillStyle(0x2A2A2A, 1);
    g.fillCircle(9, 34, 1.4);
    g.fillCircle(37, 34, 1.4);
    // frame (Dutch city-bike style — navy blue)
    const frame = 0x2B4A6F;
    g.lineStyle(2, frame, 1);
    g.lineBetween(9, 34, 24, 18);  // down-tube
    g.lineBetween(24, 18, 37, 34); // seat-tube
    g.lineBetween(9, 34, 28, 34);  // chain-stay
    g.lineBetween(24, 18, 32, 17); // top-tube to handlebar
    // handlebar post + bars
    g.lineBetween(33, 16, 33, 9);
    g.lineBetween(29, 9, 37, 9);
    // seat
    g.fillStyle(0x1A1A1A, 1);
    g.fillRect(20, 16, 8, 2.5);
    // pedal crank
    g.lineStyle(1.5, frame, 1);
    g.lineBetween(23, 32, 23, 36);
    g.fillStyle(0x1A1A1A, 1);
    g.fillRect(21, 35, 4, 1.5);
    // front basket
    g.lineStyle(1.2, 0x8B5A2B, 1);
    g.strokeRect(33, 11, 9, 6);
    g.lineBetween(34, 11, 34, 17);
    g.lineBetween(37, 11, 37, 17);
    g.lineBetween(40, 11, 40, 17);
    // flowers in basket
    g.fillStyle(0xE63946, 1);
    g.fillCircle(35, 10, 1.5);
    g.fillStyle(0xFFD86B, 1);
    g.fillCircle(38, 10, 1.3);
    g.fillStyle(0xE879A7, 1);
    g.fillCircle(40, 11, 1.4);
    // rider torso (cream shirt)
    g.fillStyle(0xFDF6E3, 1);
    g.fillRect(19, 6, 9, 12);
    g.fillStyle(frame, 0.25);
    g.fillRect(19, 14, 9, 4); // shadow into frame
    // arm reaching forward
    g.lineStyle(2, 0xFDF6E3, 1);
    g.lineBetween(27, 10, 32, 11);
    // rider head
    g.fillStyle(0xF4C8AA, 1);
    g.fillCircle(24, 2, 3.5);
    // hair
    g.fillStyle(0x2C1810, 1);
    g.fillEllipse(24, -1, 8, 3);
    g.fillEllipse(26, 1, 4, 5);
    // rider legs (navy jeans)
    g.fillStyle(frame, 1);
    g.fillRect(20, 18, 2.5, 14);
    g.fillRect(25, 18, 2.5, 14);
    g.generateTexture(key, W, H);
    g.destroy();
    return key;
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

    // Form sync based on her current x — so walking back reverts her outfit
    // through the same transitions in reverse.
    const targetForm = this._computeFormAt(this.katya.x);
    if (targetForm && this.katya.state !== targetForm && !this.katya._growing) {
      this.katya.grow(targetForm);
    }

    // Swap atmospheric particles when Katya crosses into a new biome.
    this._updateBiomeParticles();

    // Spawn the occasional cyclist while she's in Amsterdam.
    this._updateAmsterdamBikes(delta);

    // Photo reveals based on x-position — vertical position doesn't matter,
    // so jumps over milestones no longer skip them.
    const katyaX = this.katya.x;
    for (const frame of this.frames) {
      if (!frame.revealed && Math.abs(katyaX - frame.milestone.x) < 32) {
        frame.reveal();
        this._chime(frame.milestone.accent);
        this.cameras.main.shake(120, 0.003);
      }
    }

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

  // Returns the character form that should apply at a given world x.
  // Walks through milestones in order, keeping the latest growTo whose x
  // we've already reached. Naturally supports walk-back (fewer milestones
  // applied as x shrinks, so form steps back through the history).
  _computeFormAt(x) {
    let form = 'baby';
    for (let i = 0; i < MILESTONES.length; i++) {
      const m = MILESTONES[i];
      if (m.x <= x && m.growTo) form = m.growTo;
    }
    return form;
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

    const katyaName = this.add.text(viewW / 2, viewH / 2 + 75, 'Katya', {
      fontFamily: 'Georgia, serif',
      fontSize: '120px',
      color: '#FFD86B',
      fontStyle: 'italic',
      stroke: '#2a1a0a',
      strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002).setAlpha(0).setScale(0.6);

    // flourish underline — sits below Katya's text
    const flourishY = viewH / 2 + 150;
    const flourish = this.add.graphics().setScrollFactor(0).setDepth(1002).setAlpha(0);
    flourish.lineStyle(2, 0xFFD86B, 0.95);
    flourish.lineBetween(viewW / 2 - 200, flourishY, viewW / 2 + 200, flourishY);
    flourish.fillStyle(0xFFD86B, 1);
    flourish.fillCircle(viewW / 2, flourishY, 3);
    flourish.fillCircle(viewW / 2 - 70, flourishY, 2);
    flourish.fillCircle(viewW / 2 + 70, flourishY, 2);

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
      // banner + Katya fade to a softer presence; flourish fully disappears
      this.tweens.add({
        targets: [banner, katyaName],
        alpha: 0.55,
        duration: 1200,
      });
      // shrink + move banner to top
      this.tweens.add({
        targets: banner,    y: 70,  scale: 0.45, duration: 1200, ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: katyaName, y: 130, scale: 0.45, duration: 1200, ease: 'Sine.easeInOut',
      });
      // flourish fades out and lifts up — nothing else tweens its alpha
      this.tweens.add({
        targets: flourish,  y: -40, alpha: 0, duration: 700, ease: 'Sine.easeIn',
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
    // keep confetti falling forever — celebratory backdrop for the walk back
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
