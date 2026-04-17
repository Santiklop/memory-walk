class MainScene extends Phaser.Scene {
  constructor() { super('Main'); }

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

    // camera follows katya
    this.cameras.main.startFollow(this.katya, true, 0.1, 0.1, 0, 80);
    this.cameras.main.setDeadzone(80, 40);

    // milestone trigger zones + photo frames
    this.frames = [];
    MILESTONES.forEach(m => {
      const frame = new PhotoFrame(this, m.x, groundY - 170, m);
      this.frames.push(frame);

      // trigger zone at ground level — character walks through
      const zone = this.add.zone(m.x, groundY - 40, 40, 80);
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
          // tiny screen shake as emphasis
          this.cameras.main.shake(120, 0.003);
        }
      });
    });

    // progress bar HUD (locked to camera)
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

    // combine WASD into the same key flags
    const k = this.keys;
    Object.defineProperty(this.keysCombined, 'left', { get: () => ({ isDown: k.left.isDown || k.a.isDown }) });
    Object.defineProperty(this.keysCombined, 'right', { get: () => ({ isDown: k.right.isDown || k.d.isDown }) });
    Object.defineProperty(this.keysCombined, 'up',    { get: () => ({ isDown: k.up.isDown || k.w.isDown }) });
    Object.defineProperty(this.keysCombined, 'space', { get: () => ({ isDown: k.space.isDown }) });

    this.cameras.main.fadeIn(600, 255, 240, 200);

    // finale watcher — when she reaches the last milestone + a bit
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

    // milestone pips
    MILESTONES.forEach((m, i) => {
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

  keysCombined = {};

  update(time, delta) {
    this.katya.update(delta, this.keysCombined);

    // update HUD fill
    const p = Phaser.Math.Clamp(this.katya.x / WORLD.width, 0, 1);
    this.hudFill.clear();
    this.hudFill.fillStyle(0xFFD86B, 0.85);
    this.hudFill.fillRoundedRect(32, 24, (WORLD.viewW - 64) * p, 10, 5);

    // brighten pips once reached
    const revealedCount = this.frames.filter(f => f.revealed).length;
    this.hudLabel.setText(`${revealedCount} / ${MILESTONES.length} memories`);
    MILESTONES.forEach(m => {
      if (m._pip && this.frames.find(f => f.milestone.id === m.id).revealed) {
        m._pip.setFillStyle(Phaser.Display.Color.HexStringToColor(m.accent).color, 1);
      }
    });

    // finale trigger: reached last milestone and ~1 sec passed
    const last = this.frames[this.frames.length - 1];
    if (last.revealed && !this.finaleTriggered && time - last.bornAt > 2500) {
      this.finaleTriggered = true;
      this._onFinale();
    }
  }

  _chime(hexColor) {
    // WebAudio chime — soft bell tied to milestone accent hue
    try {
      const ctx = this.sound.context;
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [880, 1318.5, 1760]; // A5 E6 A6 — sparkly
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
    } catch (e) {
      // silent fail — audio context may not be allowed yet
    }
  }

  _onFinale() {
    // slow camera pan back to the start so all memories are visible
    const cam = this.cameras.main;
    this.tweens.add({
      targets: cam,
      scrollX: 0,
      duration: 12000,
      ease: 'Sine.easeInOut',
    });
    // fade in a "look back" ribbon text
    const text = this.add.text(WORLD.viewW / 2, 70, '↩  Walk back through your memories',
      { fontFamily: 'Georgia, serif', fontSize: '18px', color: '#FAF5E8', fontStyle: 'italic',
        stroke: '#2a1a0a', strokeThickness: 3 })
      .setOrigin(0.5).setScrollFactor(0).setDepth(1001).setAlpha(0);
    this.tweens.add({ targets: text, alpha: 1, duration: 1200 });

    // after pan, allow free play — no end scene takeover so she can keep exploring
  }
}
