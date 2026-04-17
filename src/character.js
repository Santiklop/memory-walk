// Procedural character — "Katya" — built as a Container of Graphics children.
// Two growth states: 'child' (small, round, schoolgirl) and 'teen' (taller, fashioned).
// Running = leg/arm swing + slight body bob.
// Jumping = arms up, legs tucked.
// Dark-haired, pretty, stylized — aiming for Rayman-like charm, not realism.

class Katya extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.state = 'child';
    this.facing = 1; // 1 = right, -1 = left
    this.runPhase = 0;

    // hitbox will be set per growth
    this._buildParts();
    this._applyGrowth('child', true);

    this.body.setMaxVelocity(320, 1200);
    this.body.setDragX(1400);
    this.body.setCollideWorldBounds(true);
  }

  _buildParts() {
    // draw order back-to-front

    // back-hair (long, behind head)
    this.backHair = this.scene.add.graphics();

    // body / dress
    this.bodyG = this.scene.add.graphics();

    // back arm
    this.armBack = this.scene.add.graphics();

    // back leg
    this.legBack = this.scene.add.graphics();
    // front leg
    this.legFront = this.scene.add.graphics();

    // front arm (over body)
    this.armFront = this.scene.add.graphics();

    // head (over body)
    this.head = this.scene.add.graphics();

    // hair bangs / side hair (over head)
    this.frontHair = this.scene.add.graphics();

    // face details
    this.face = this.scene.add.graphics();

    this.add([
      this.backHair,
      this.legBack,
      this.bodyG,
      this.armBack,
      this.legFront,
      this.armFront,
      this.head,
      this.frontHair,
      this.face,
    ]);
  }

  _applyGrowth(state, force) {
    if (!force && state === this.state) return;
    this.state = state;

    // size parameters
    const P = state === 'child' ? {
      headR: 14,
      bodyH: 26, bodyW: 26,
      dressColor: 0xFF9EBB,
      dressTrim: 0xFFFFFF,
      skin: 0xF4C8AA,
      hair: 0x2C1810,
      hairAccent: 0x3E2418,
      legH: 12, legW: 5,
      armH: 14, armW: 5,
      totalH: 56,
      bowColor: 0xFFE16B,
    } : {
      headR: 16,
      bodyH: 42, bodyW: 28,
      dressColor: 0xD94C7A,
      dressTrim: 0xFFC6D9,
      skin: 0xF4C8AA,
      hair: 0x1E0F07,
      hairAccent: 0x2E1A0F,
      legH: 24, legW: 6,
      armH: 22, armW: 6,
      totalH: 84,
      bowColor: null,
    };

    this.p = P;
    this._redrawStatic();

    // hitbox matches visual
    const body = this.body;
    body.setSize(P.bodyW + 6, P.totalH, true);
    body.setOffset(-(P.bodyW + 6) / 2, -P.totalH);
  }

  _redrawStatic() {
    const P = this.p;
    // We treat (0,0) as the character's feet.
    // Head sits above body. Y axis negative upward.

    const feetY = 0;
    const legTopY = feetY - P.legH;
    const bodyBottomY = legTopY;
    const bodyTopY = bodyBottomY - P.bodyH;
    const headCenterY = bodyTopY - P.headR + 2;

    this._anchors = { feetY, legTopY, bodyBottomY, bodyTopY, headCenterY };

    // --- back hair (long flowing piece behind head / shoulders) ---
    this.backHair.clear();
    this.backHair.fillStyle(P.hair, 1);
    if (this.state === 'child') {
      // bob cut — ends at chin
      this.backHair.fillEllipse(0, headCenterY + 2, P.headR * 2.2, P.headR * 2.2);
    } else {
      // longer hair down to shoulders
      this.backHair.fillRoundedRect(-P.headR - 2, headCenterY - 4, P.headR * 2 + 4, P.headR * 2 + 18, 6);
      this.backHair.fillEllipse(0, headCenterY + 2, P.headR * 2.4, P.headR * 2.2);
    }

    // --- body / dress ---
    this.bodyG.clear();
    // dress as rounded trapezoid (wider at bottom)
    const halfTop = P.bodyW * 0.35;
    const halfBot = P.bodyW * 0.55;
    this.bodyG.fillStyle(P.dressColor, 1);
    this.bodyG.beginPath();
    this.bodyG.moveTo(-halfTop, bodyTopY);
    this.bodyG.lineTo(halfTop, bodyTopY);
    this.bodyG.lineTo(halfBot, bodyBottomY);
    this.bodyG.lineTo(-halfBot, bodyBottomY);
    this.bodyG.closePath();
    this.bodyG.fillPath();
    // trim
    this.bodyG.fillStyle(P.dressTrim, 1);
    this.bodyG.fillRect(-halfBot, bodyBottomY - 2, halfBot * 2, 2);
    // collar
    this.bodyG.fillStyle(P.dressTrim, 1);
    this.bodyG.fillRect(-halfTop, bodyTopY, halfTop * 2, 2);
    // dress highlight
    this.bodyG.fillStyle(0xffffff, 0.15);
    this.bodyG.fillRect(-halfTop + 2, bodyTopY + 2, 3, P.bodyH - 4);

    // --- head ---
    this.head.clear();
    // neck
    this.head.fillStyle(P.skin, 1);
    this.head.fillRect(-3, bodyTopY - 4, 6, 5);
    // head oval
    this.head.fillStyle(P.skin, 1);
    this.head.fillEllipse(0, headCenterY, P.headR * 1.9, P.headR * 2);

    // --- front hair (bangs + side) ---
    this.frontHair.clear();
    this.frontHair.fillStyle(P.hair, 1);
    // bangs
    this.frontHair.fillEllipse(0, headCenterY - P.headR * 0.75, P.headR * 1.8, P.headR * 0.9);
    // side sweeps
    this.frontHair.fillEllipse(-P.headR * 0.85, headCenterY - P.headR * 0.25, P.headR * 0.7, P.headR * 1.2);
    this.frontHair.fillEllipse(P.headR * 0.85, headCenterY - P.headR * 0.25, P.headR * 0.7, P.headR * 1.2);
    // hair highlight
    this.frontHair.fillStyle(P.hairAccent, 0.6);
    this.frontHair.fillEllipse(-P.headR * 0.35, headCenterY - P.headR * 0.9, P.headR * 0.9, P.headR * 0.4);
    // bow (child only)
    if (P.bowColor) {
      const bowY = headCenterY - P.headR * 1.05;
      this.frontHair.fillStyle(P.bowColor, 1);
      this.frontHair.fillTriangle(-8, bowY, -2, bowY - 4, -2, bowY + 4);
      this.frontHair.fillTriangle(8, bowY, 2, bowY - 4, 2, bowY + 4);
      this.frontHair.fillCircle(0, bowY, 2.5);
    }

    // --- face ---
    this.face.clear();
    // eyes
    const eyeY = headCenterY + 1;
    this.face.fillStyle(0x1a1a1a, 1);
    this.face.fillEllipse(-P.headR * 0.35, eyeY, 2.2, 3);
    this.face.fillEllipse(P.headR * 0.35, eyeY, 2.2, 3);
    // eye shine
    this.face.fillStyle(0xffffff, 1);
    this.face.fillCircle(-P.headR * 0.35 + 0.6, eyeY - 0.6, 0.6);
    this.face.fillCircle(P.headR * 0.35 + 0.6, eyeY - 0.6, 0.6);
    // cheeks
    this.face.fillStyle(0xFF9FAE, 0.6);
    this.face.fillCircle(-P.headR * 0.7, eyeY + 5, 2.4);
    this.face.fillCircle(P.headR * 0.7, eyeY + 5, 2.4);
    // mouth
    this.face.fillStyle(0xC44A5C, 1);
    this.face.fillEllipse(0, eyeY + 7, 3.4, 1.4);

    // --- arms + legs initial pose ---
    this._drawLimb(this.armFront, P.armH, P.armW, P.skin, P.dressColor);
    this._drawLimb(this.armBack,  P.armH, P.armW, P.skin, P.dressColor);
    this._drawLimb(this.legFront, P.legH, P.legW, P.skin, 0xffffff);
    this._drawLimb(this.legBack,  P.legH, P.legW, P.skin, 0xffffff);

    // position pivot points
    this.armFront.setPosition(6, bodyTopY + 4);
    this.armBack.setPosition(-6, bodyTopY + 4);
    this.legFront.setPosition(4, legTopY);
    this.legBack.setPosition(-4, legTopY);
  }

  _drawLimb(g, len, w, skinColor, sleeveColor) {
    g.clear();
    // sleeve (top 30%)
    g.fillStyle(sleeveColor, 1);
    g.fillRoundedRect(-w / 2, 0, w, len * 0.35, w / 2);
    // skin (rest)
    g.fillStyle(skinColor, 1);
    g.fillRoundedRect(-w / 2, len * 0.3, w, len * 0.7, w / 2);
  }

  grow() {
    if (this.state === 'teen') return;
    // "puff" sparkle burst around her then rescale with warm tween
    const s = this.scene;
    const burst = s.add.particles(this.x, this.y - 30, '__DEFAULT', {
      speed: { min: 60, max: 160 },
      lifespan: 700,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xFFD86B, 0xFFFFFF, 0xFF9EBB],
      quantity: 24,
      emitting: false,
    });
    burst.explode(30);
    s.time.delayedCall(900, () => burst.destroy());

    s.tweens.add({
      targets: this,
      scaleX: 1.15, scaleY: 1.15,
      duration: 180, yoyo: true, ease: 'Sine.easeInOut',
      onYoyo: () => this._applyGrowth('teen'),
    });
  }

  update(dt, keys) {
    const speedMax = this.state === 'child' ? 220 : 280;
    let moving = false;

    if (keys.left.isDown) {
      this.body.setAccelerationX(-2200);
      this.facing = -1;
      moving = true;
    } else if (keys.right.isDown) {
      this.body.setAccelerationX(2200);
      this.facing = 1;
      moving = true;
    } else {
      this.body.setAccelerationX(0);
    }

    this.body.setMaxVelocity(speedMax, 1200);

    const onGround = this.body.blocked.down || this.body.touching.down;
    if ((keys.space.isDown || keys.up.isDown) && onGround) {
      this.body.setVelocityY(this.state === 'child' ? -470 : -540);
    }

    // face direction
    this.setScale(Math.sign(this.facing) * Math.abs(this.scaleX || 1), this.scaleY || 1);

    // animate limbs
    if (!onGround) {
      // jump pose — arms up, legs tucked
      this.armFront.setRotation(-0.9);
      this.armBack.setRotation(-1.1);
      this.legFront.setRotation(0.6);
      this.legBack.setRotation(-0.3);
      this.setY(this.y); // no bob in air
    } else if (moving) {
      this.runPhase += dt * 0.016;
      const sw = Math.sin(this.runPhase * 12) * 0.9;
      this.armFront.setRotation(-sw);
      this.armBack.setRotation(sw);
      this.legFront.setRotation(sw * 0.7);
      this.legBack.setRotation(-sw * 0.7);
      // slight bob via child positions
      const bob = Math.abs(Math.sin(this.runPhase * 24)) * -1.5;
      this.head.y = bob;
      this.face.y = bob;
      this.frontHair.y = bob;
      this.backHair.y = bob;
    } else {
      // idle — gentle breathe
      const t = this.scene.time.now * 0.002;
      const breath = Math.sin(t) * 0.5;
      this.armFront.setRotation(0.05 + breath * 0.02);
      this.armBack.setRotation(-0.05 - breath * 0.02);
      this.legFront.setRotation(0);
      this.legBack.setRotation(0);
      this.head.y = breath;
      this.face.y = breath;
      this.frontHair.y = breath;
      this.backHair.y = breath;
    }
  }
}
