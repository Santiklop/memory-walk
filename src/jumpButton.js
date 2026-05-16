// JumpButton — a memory cairn Katya can jump onto to cycle the photos in
// the floating frame above. Visual matches the painterly world style:
// a small stone pedestal with a moss tuft + heart sigil, topped by a
// bobbing flower bloom in the milestone's accent color.

class JumpButton {
  constructor(scene, x, y, frame, group) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.frame = frame;
    // Debounce so a single physical landing can't trigger more than one
    // cycle (Phaser arcade physics occasionally registers a tiny bounce
    // when the body comes to rest, briefly clearing touching.down and
    // re-triggering the fresh-land detector). Set just under the photo
    // animation length so it can never be perceived as a missed press.
    this._cooldownUntil = 0;

    const accent = Phaser.Display.Color.HexStringToColor(frame.milestone.accent).color;
    const accentLight = lerpColor(accent, 0xFFFFFF, 0.4);

    // Stone pedestal — drawn directly in world coordinates because it
    // never moves.
    this.pedestalGfx = scene.add.graphics().setDepth(12);
    this._drawPedestal(accentLight);

    // Flower bloom — drawn around local (0,0), positioned over the pedestal
    // so it can bob and pulse on its own transform.
    this.bloomGfx = scene.add.graphics().setDepth(13);
    this._drawBloom(accent, accentLight);
    this.bloomGfx.setPosition(x, y - 34);

    scene.tweens.add({
      targets: this.bloomGfx,
      y: y - 40,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: this.bloomGfx,
      angle: 8,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Static body — bottom resting on the ground, top flush with the
    // pedestal cap so Katya appears to stand on the stone.
    const W = 44, H = 22;
    this.body = group.create(x, y - H / 2, null).setVisible(false);
    this.body.displayWidth = W;
    this.body.displayHeight = H;
    this.body.refreshBody();
  }

  _drawPedestal(accentLight) {
    const g = this.pedestalGfx;
    const x = this.x, y = this.y;

    // ground shadow
    g.fillStyle(0x000000, 0.28);
    g.fillEllipse(x, y + 2, 54, 7);

    const stoneBase  = 0x8B7A5E;
    const stoneLight = 0xB5A286;
    const stoneShade = 0x5F5040;
    const moss       = 0x6CAA5A;
    const mossLight  = 0x9ED080;

    // wide base plinth
    g.fillStyle(stoneShade, 1);
    g.fillRoundedRect(x - 22, y - 6, 44, 6, 2);
    // main pedestal body
    g.fillStyle(stoneBase, 1);
    g.fillRoundedRect(x - 19, y - 18, 38, 13, 2);
    // top cap
    g.fillStyle(stoneShade, 1);
    g.fillRoundedRect(x - 22, y - 22, 44, 5, 2);
    // light edge highlight along the cap
    g.fillStyle(stoneLight, 0.9);
    g.fillRect(x - 21, y - 22, 42, 1);
    // vertical highlight stripe on the body
    g.fillStyle(stoneLight, 0.45);
    g.fillRect(x - 17, y - 16, 2, 10);
    // weathered speckles (a painterly touch)
    g.fillStyle(stoneShade, 0.55);
    g.fillCircle(x + 6,  y - 13, 1);
    g.fillCircle(x + 11, y - 10, 0.8);
    g.fillCircle(x - 9,  y - 8,  1);

    // moss tuft hugging one corner of the base
    g.fillStyle(moss, 0.9);
    g.fillEllipse(x - 14, y - 5, 9, 3.5);
    g.fillStyle(mossLight, 1);
    g.fillCircle(x - 17, y - 6, 1.5);
    g.fillCircle(x - 12, y - 7, 1.2);

    // small carved heart sigil on the front (accent-lit)
    g.fillStyle(accentLight, 0.85);
    g.fillCircle(x - 3, y - 13, 2);
    g.fillCircle(x + 3, y - 13, 2);
    g.fillTriangle(x - 4.5, y - 12.5, x + 4.5, y - 12.5, x, y - 7.5);
  }

  _drawBloom(accent, accentLight) {
    const g = this.bloomGfx;

    // stem hanging down from the bloom
    g.lineStyle(2, 0x4A7E3E, 1);
    g.lineBetween(0, 6, 0, 0);
    // single leaf
    g.fillStyle(0x6CAA5A, 1);
    g.fillEllipse(-4, 4, 6, 3);
    g.fillStyle(0x9ED080, 0.7);
    g.fillEllipse(-5, 3, 3, 1.2);

    // five petals around the center
    g.fillStyle(accent, 1);
    for (let i = 0; i < 5; i++) {
      const ang = i * (Math.PI * 2 / 5) - Math.PI / 2;
      g.fillCircle(Math.cos(ang) * 5, Math.sin(ang) * 5, 4.2);
    }
    // soft petal highlight
    g.fillStyle(accentLight, 0.6);
    g.fillCircle(-3, -3, 2.2);
    // pollen center
    g.fillStyle(0xFFF1A8, 1);
    g.fillCircle(0, 0, 2.2);
    g.fillStyle(0xFFD86B, 1);
    g.fillCircle(0, 0, 1.1);
  }

  // Called by MainScene on every fresh landing. Returns true if the caller
  // should play the celebratory sound.
  press() {
    if (!this.frame.revealed) return false;
    // performance.now() is monotonic wall-clock time — unaffected by scene
    // pauses or game-loop throttling, so the cooldown is reliable even
    // across background tab transitions.
    const now = performance.now();
    if (now < this._cooldownUntil) return false;
    this._cooldownUntil = now + 400;

    // bloom pop — visual confirmation of the press
    this.scene.tweens.add({
      targets: this.bloomGfx,
      scaleX: 1.35, scaleY: 1.35,
      duration: 140,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });

    // sparkle burst around the bloom
    const accent = Phaser.Display.Color.HexStringToColor(this.frame.milestone.accent).color;
    const accentLight = lerpColor(accent, 0xFFFFFF, 0.4);
    const burst = this.scene.add.particles(this.bloomGfx.x, this.bloomGfx.y, '__DEFAULT', {
      speed: { min: 40, max: 110 },
      lifespan: { min: 320, max: 520 },
      scale: { start: 0.55, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [accent, accentLight, 0xFFFFFF],
      quantity: 14,
      emitting: false,
    }).setDepth(14);
    burst.explode(14);
    this.scene.time.delayedCall(700, () => burst.destroy());

    // If there are multiple photos, cycle. Otherwise just pulse the single
    // existing photo (if any). Either way the caller plays the sound.
    if (this.frame.canCycle()) {
      this.frame.cyclePhoto();
    } else if (this.frame.photoImage) {
      this.frame.pulseCurrentPhoto();
    }
    return true;
  }
}
