class IntroScene extends Phaser.Scene {
  constructor() { super('Intro'); }

  preload() {
    // Background music via a plain HTML5 <Audio> — bypasses Phaser's audio
    // pipeline entirely, which means no weird scene-shutdown interactions
    // and no AudioContext lock fights. The element lives on `window` so it
    // persists across every scene transition.
    const { viewW, viewH } = WORLD;
    const loading = this.add.text(viewW / 2, viewH - 36, 'loading…', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#FAF5E8',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0.6);

    if (!window.__bgmAudio) {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0;
      window.__bgmAudio = audio;
      audio.addEventListener('canplaythrough', () => loading.destroy(), { once: true });
      audio.addEventListener('error', () => loading.destroy(), { once: true });
      audio.src = 'assets/music/Background%20song.mp3';
    } else {
      loading.destroy();
    }
  }

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

    // twinkling stars
    for (let i = 0; i < 80; i++) {
      const sx = Math.random() * viewW;
      const sy = Math.random() * viewH * 0.55;
      const star = this.add.circle(sx, sy, 0.8 + Math.random() * 1.4, 0xffffff, 0.8);
      this.tweens.add({
        targets: star, alpha: 0.2,
        duration: 800 + Math.random() * 2000,
        yoyo: true, repeat: -1,
      });
    }

    // decorative frame silhouettes floating in the background
    for (let i = 0; i < 7; i++) {
      const fx = 80 + Math.random() * (viewW - 160);
      const fy = 260 + Math.random() * 220;
      const fr = this.add.graphics();
      fr.fillStyle(0xFAF5E8, 0.12);
      fr.fillRoundedRect(-60, -45, 120, 90, 8);
      fr.setPosition(fx, fy);
      fr.setAngle((Math.random() - 0.5) * 20);
      this.tweens.add({
        targets: fr, y: fy - 12,
        duration: 3000 + Math.random() * 2000,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // main title — "Memory Walk"
    const title = this.add.text(viewW / 2, viewH / 2 - 30, 'Memory Walk', {
      fontFamily: 'Georgia, serif',
      fontSize: '96px',
      color: '#FFD86B',
      stroke: '#2a1a0a',
      strokeThickness: 4,
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0).setScale(0.8);

    // decorative underline (thin gold flourish)
    const flourish = this.add.graphics();
    flourish.lineStyle(1.5, 0xFFD86B, 0.9);
    flourish.lineBetween(viewW / 2 - 140, viewH / 2 + 36, viewW / 2 + 140, viewH / 2 + 36);
    flourish.fillStyle(0xFFD86B, 1);
    flourish.fillCircle(viewW / 2, viewH / 2 + 36, 2.5);
    flourish.setAlpha(0);

    const subtitle = this.add.text(viewW / 2, viewH / 2 + 78,
      'A stroll through the years, one memory at a time.', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#FFE6A7',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    const promptText = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
      ? 'tap to begin'
      : 'press SPACE or tap to begin';

    const prompt = this.add.text(viewW / 2, viewH - 80, promptText, {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    // animate in
    this.tweens.add({ targets: title, alpha: 1, scale: 1, duration: 1100, ease: 'Back.easeOut', delay: 300 });
    this.tweens.add({ targets: flourish, alpha: 1, duration: 1000, delay: 1100 });
    this.tweens.add({ targets: subtitle, alpha: 1, y: '-=8', duration: 1000, ease: 'Sine.easeOut', delay: 1400 });
    this.tweens.add({
      targets: prompt, alpha: 0.9, duration: 800, delay: 2100,
      onComplete: () => {
        this.tweens.add({ targets: prompt, alpha: 0.3, duration: 900, yoyo: true, repeat: -1 });
      }
    });

    // petals drifting
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

    // input
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

    // Start background music. Called inside the user's tap/SPACE handler,
    // which satisfies the browser's autoplay gate.
    const audio = window.__bgmAudio;
    if (audio && audio.paused) {
      audio.volume = 0.4;
      const playPromise = audio.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch((err) => console.warn('bgm play failed:', err));
      }
      // fade in from 0 to 0.4 over ~2.2s using setInterval (scene-independent)
      audio.volume = 0.05;
      let v = 0.05;
      const target = 0.4;
      const id = setInterval(() => {
        v += 0.015;
        if (v >= target) {
          v = target;
          clearInterval(id);
        }
        audio.volume = v;
      }, 60);
    }

    this.cameras.main.fadeOut(600, 255, 240, 200);
    this.time.delayedCall(650, () => this.scene.start('Main'));
  }
}
