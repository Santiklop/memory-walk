class IntroScene extends Phaser.Scene {
  constructor() { super('Intro'); }

  create() {
    const { viewW, viewH } = WORLD;

    // soft dawn gradient background
    const g = this.add.graphics();
    const strips = 60;
    for (let i = 0; i < strips; i++) {
      const t = i / (strips - 1);
      const c = lerpColor(0x2A1C3F, 0xFFB86B, t);
      g.fillStyle(c, 1);
      g.fillRect(0, Math.floor(i * viewH / strips), viewW, Math.ceil(viewH / strips) + 1);
    }

    // distant twinkling stars (upper half)
    for (let i = 0; i < 70; i++) {
      const sx = Math.random() * viewW;
      const sy = Math.random() * viewH * 0.5;
      const star = this.add.circle(sx, sy, 0.8 + Math.random() * 1.4, 0xffffff, 0.8);
      this.tweens.add({
        targets: star,
        alpha: 0.2,
        duration: 800 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
      });
    }

    // decorative frame silhouettes floating in the background
    for (let i = 0; i < 6; i++) {
      const fx = 80 + Math.random() * (viewW - 160);
      const fy = 280 + Math.random() * 180;
      const fr = this.add.graphics();
      fr.fillStyle(0xFAF5E8, 0.12);
      fr.fillRoundedRect(-45, -35, 90, 70, 6);
      fr.setPosition(fx, fy);
      fr.setAngle((Math.random() - 0.5) * 20);
      this.tweens.add({
        targets: fr,
        y: fy - 10,
        duration: 3000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // title
    const title = this.add.text(viewW / 2, viewH / 2 - 60, 'Happy Birthday,', {
      fontFamily: 'Georgia, serif',
      fontSize: '42px',
      color: '#FAF5E8',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    const name = this.add.text(viewW / 2, viewH / 2, 'Katya', {
      fontFamily: 'Georgia, serif',
      fontSize: '96px',
      color: '#FFD86B',
      stroke: '#2a1a0a',
      strokeThickness: 4,
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0).setScale(0.8);

    const subtitle = this.add.text(viewW / 2, viewH / 2 + 90,
      'A walk through your life, one memory at a time.', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#FFE6A7',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    const prompt = this.add.text(viewW / 2, viewH - 80,
      'press SPACE to begin', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    // animate in
    this.tweens.add({ targets: title, alpha: 1, y: '-=10', duration: 1200, ease: 'Sine.easeOut', delay: 200 });
    this.tweens.add({ targets: name, alpha: 1, scale: 1, duration: 900, ease: 'Back.easeOut', delay: 900 });
    this.tweens.add({ targets: subtitle, alpha: 1, y: '-=8', duration: 1000, ease: 'Sine.easeOut', delay: 1800 });
    this.tweens.add({
      targets: prompt, alpha: 0.9, duration: 800, delay: 2500,
      onComplete: () => {
        this.tweens.add({ targets: prompt, alpha: 0.3, duration: 900, yoyo: true, repeat: -1 });
      }
    });

    // petal-like particles drifting
    const tex = this._petalTex();
    this.add.particles(0, -20, tex, {
      x: { min: 0, max: viewW },
      y: -20,
      speedY: { min: 20, max: 50 },
      speedX: { min: -20, max: 20 },
      lifespan: 8000,
      scale: 0.9,
      alpha: { start: 0.9, end: 0 },
      rotate: { start: 0, end: 360 },
      frequency: 260,
    });

    // input to start
    this.input.keyboard.once('keydown-SPACE', () => this._begin());
    this.input.keyboard.once('keydown-ENTER', () => this._begin());
    this.input.once('pointerdown', () => this._begin());
  }

  _petalTex() {
    const key = 'tex_intro_petal';
    if (this.textures.exists(key)) return key;
    const g = this.add.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xFFD86B, 1);
    g.fillEllipse(6, 8, 10, 14);
    g.fillStyle(0xFFF1A8, 0.8);
    g.fillEllipse(4, 6, 4, 8);
    g.generateTexture(key, 12, 16);
    g.destroy();
    return key;
  }

  _begin() {
    if (this._starting) return;
    this._starting = true;
    this.cameras.main.fadeOut(600, 255, 240, 200);
    this.time.delayedCall(650, () => this.scene.start('Main'));
  }
}
