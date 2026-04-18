// Procedural character — "Katya" — built as a Container of Graphics children.
// Four growth states:
//   baby   — smallest, big head, yellow bow          (milestone 1)
//   child  — slightly bigger, still with bow          (milestone 2)
//   teen   — taller, longer hair, cerise dress        (milestone 3, big puff)
//   adult  — longer hair, teal dress, more refined    (milestone 5, subtle)
// Running = leg/arm swing + slight body bob. Jumping = arms up, legs tucked.

const KATYA_PARAMS = {
  baby: {
    headR: 13,
    bodyH: 20, bodyW: 22,
    dressColor: 0xFFA7C2, dressTrim: 0xFFFFFF,
    skin: 0xF4C8AA, hair: 0x2C1810, hairAccent: 0x3E2418,
    legH: 10, legW: 5, armH: 12, armW: 5,
    totalH: 48, bowColor: 0xFFE16B,
    hairLen: 0,
  },
  child: {
    headR: 14,
    bodyH: 26, bodyW: 26,
    dressColor: 0xFF9EBB, dressTrim: 0xFFFFFF,
    skin: 0xF4C8AA, hair: 0x2C1810, hairAccent: 0x3E2418,
    legH: 12, legW: 5, armH: 14, armW: 5,
    totalH: 56, bowColor: 0xFFE16B,
    hairLen: 0,
  },
  teen: {
    headR: 16,
    bodyH: 42, bodyW: 28,
    dressColor: 0xD94C7A, dressTrim: 0xFFC6D9,
    skin: 0xF4C8AA, hair: 0x1E0F07, hairAccent: 0x2E1A0F,
    legH: 24, legW: 6, armH: 22, armW: 6,
    totalH: 84, bowColor: null,
    hairLen: 18,
  },
  adult: {
    headR: 16,
    bodyH: 44, bodyW: 30,
    dressColor: 0x3F8A82, dressTrim: 0xEFF7F5,
    skin: 0xF4C8AA, hair: 0x1E0F07, hairAccent: 0x2E1A0F,
    legH: 26, legW: 6, armH: 24, armW: 6,
    totalH: 88, bowColor: null,
    hairLen: 30,
  },
};

class Katya extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.state = 'baby';
    this.facing = 1; // 1 = right, -1 = left
    this.runPhase = 0;
    this._growing = false; // true while a grow() tween owns the scale

    this._buildParts();
    this._applyGrowth('baby', true);
    this.setScale(1, 1);

    this.body.setMaxVelocity(320, 1200);
    this.body.setDragX(1400);
    this.body.setCollideWorldBounds(true);
  }

  _buildParts() {
    // draw order back-to-front
    this.backHair = this.scene.add.graphics();
    this.bodyG    = this.scene.add.graphics();
    this.armBack  = this.scene.add.graphics();
    this.legBack  = this.scene.add.graphics();
    this.legFront = this.scene.add.graphics();
    this.armFront = this.scene.add.graphics();
    this.head     = this.scene.add.graphics();
    this.frontHair = this.scene.add.graphics();
    this.face     = this.scene.add.graphics();

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
    const params = KATYA_PARAMS[state];
    if (!params) return;
    this.state = state;
    this.p = params;
    this._redrawStatic();

    const body = this.body;
    body.setSize(this.p.bodyW + 6, this.p.totalH, true);
    body.setOffset(-(this.p.bodyW + 6) / 2, -this.p.totalH);
  }

  _redrawStatic() {
    const P = this.p;
    // (0,0) = feet. y axis: negative = up.
    const feetY       = 0;
    const legTopY     = feetY - P.legH;
    const bodyBottomY = legTopY;
    const bodyTopY    = bodyBottomY - P.bodyH;
    const headCenterY = bodyTopY - P.headR + 2;

    // --- back hair ---
    this.backHair.clear();
    this.backHair.fillStyle(P.hair, 1);
    if (P.hairLen <= 2) {
      // bob — ends at chin
      this.backHair.fillEllipse(0, headCenterY + 2, P.headR * 2.2, P.headR * 2.2);
    } else {
      // longer hair — reaches past shoulders
      this.backHair.fillRoundedRect(
        -P.headR - 2, headCenterY - 4,
        P.headR * 2 + 4, P.headR * 2 + P.hairLen, 6,
      );
      this.backHair.fillEllipse(0, headCenterY + 2, P.headR * 2.4, P.headR * 2.2);
    }

    // --- body / dress ---
    this.bodyG.clear();
    const halfTop = P.bodyW * 0.35;
    const halfBot = P.bodyW * 0.55;
    this.bodyG.fillStyle(P.dressColor, 1);
    this.bodyG.beginPath();
    this.bodyG.moveTo(-halfTop, bodyTopY);
    this.bodyG.lineTo( halfTop, bodyTopY);
    this.bodyG.lineTo( halfBot, bodyBottomY);
    this.bodyG.lineTo(-halfBot, bodyBottomY);
    this.bodyG.closePath();
    this.bodyG.fillPath();
    this.bodyG.fillStyle(P.dressTrim, 1);
    this.bodyG.fillRect(-halfBot, bodyBottomY - 2, halfBot * 2, 2);
    this.bodyG.fillStyle(P.dressTrim, 1);
    this.bodyG.fillRect(-halfTop, bodyTopY, halfTop * 2, 2);
    this.bodyG.fillStyle(0xffffff, 0.15);
    this.bodyG.fillRect(-halfTop + 2, bodyTopY + 2, 3, P.bodyH - 4);

    // adult gets a subtle necklace
    if (this.state === 'adult') {
      this.bodyG.lineStyle(1, 0xF4D28A, 0.95);
      this.bodyG.strokeEllipse(0, bodyTopY + 3, P.bodyW * 0.55, 6);
      this.bodyG.fillStyle(0xF4D28A, 1);
      this.bodyG.fillCircle(0, bodyTopY + 6, 1.3);
    }

    // --- head ---
    this.head.clear();
    this.head.fillStyle(P.skin, 1);
    this.head.fillRect(-3, bodyTopY - 4, 6, 5);
    this.head.fillStyle(P.skin, 1);
    this.head.fillEllipse(0, headCenterY, P.headR * 1.9, P.headR * 2);

    // --- front hair (bangs + side) ---
    this.frontHair.clear();
    this.frontHair.fillStyle(P.hair, 1);
    this.frontHair.fillEllipse(0, headCenterY - P.headR * 0.75, P.headR * 1.8, P.headR * 0.9);
    this.frontHair.fillEllipse(-P.headR * 0.85, headCenterY - P.headR * 0.25, P.headR * 0.7, P.headR * 1.2);
    this.frontHair.fillEllipse( P.headR * 0.85, headCenterY - P.headR * 0.25, P.headR * 0.7, P.headR * 1.2);
    this.frontHair.fillStyle(P.hairAccent, 0.6);
    this.frontHair.fillEllipse(-P.headR * 0.35, headCenterY - P.headR * 0.9, P.headR * 0.9, P.headR * 0.4);
    if (P.bowColor) {
      const bowY = headCenterY - P.headR * 1.05;
      this.frontHair.fillStyle(P.bowColor, 1);
      this.frontHair.fillTriangle(-8, bowY, -2, bowY - 4, -2, bowY + 4);
      this.frontHair.fillTriangle( 8, bowY,  2, bowY - 4,  2, bowY + 4);
      this.frontHair.fillCircle(0, bowY, 2.5);
    }

    // --- face ---
    this.face.clear();
    const eyeY = headCenterY + 1;
    this.face.fillStyle(0x1a1a1a, 1);
    this.face.fillEllipse(-P.headR * 0.35, eyeY, 2.2, 3);
    this.face.fillEllipse( P.headR * 0.35, eyeY, 2.2, 3);
    this.face.fillStyle(0xffffff, 1);
    this.face.fillCircle(-P.headR * 0.35 + 0.6, eyeY - 0.6, 0.6);
    this.face.fillCircle( P.headR * 0.35 + 0.6, eyeY - 0.6, 0.6);
    this.face.fillStyle(0xFF9FAE, 0.6);
    this.face.fillCircle(-P.headR * 0.7, eyeY + 5, 2.4);
    this.face.fillCircle( P.headR * 0.7, eyeY + 5, 2.4);
    this.face.fillStyle(0xC44A5C, 1);
    this.face.fillEllipse(0, eyeY + 7, 3.4, 1.4);

    // --- arms + legs ---
    this._drawLimb(this.armFront, P.armH, P.armW, P.skin, P.dressColor);
    this._drawLimb(this.armBack,  P.armH, P.armW, P.skin, P.dressColor);
    this._drawLimb(this.legFront, P.legH, P.legW, P.skin, 0xffffff);
    this._drawLimb(this.legBack,  P.legH, P.legW, P.skin, 0xffffff);

    this.armFront.setPosition( 6, bodyTopY + 4);
    this.armBack.setPosition(-6, bodyTopY + 4);
    this.legFront.setPosition( 4, legTopY);
    this.legBack.setPosition(-4, legTopY);
  }

  _drawLimb(g, len, w, skinColor, sleeveColor) {
    g.clear();
    g.fillStyle(sleeveColor, 1);
    g.fillRoundedRect(-w / 2, 0, w, len * 0.35, w / 2);
    g.fillStyle(skinColor, 1);
    g.fillRoundedRect(-w / 2, len * 0.3, w, len * 0.7, w / 2);
  }

  // triggered when Katya reaches a milestone with `growTo: <state>`.
  grow(targetState) {
    if (!targetState || this.state === targetState) return;
    const s = this.scene;

    // bigger puff for the dramatic child -> teen jump; subtler otherwise
    const isDramatic = (this.state === 'child' && targetState === 'teen');
    const count = isDramatic ? 30 : 14;
    const scaleUp = isDramatic ? 1.22 : 1.08;
    const duration = isDramatic ? 200 : 160;
    const tint = isDramatic
      ? [0xFFD86B, 0xFFFFFF, 0xFF9EBB]
      : [0xFFD86B, 0xFFFFFF, 0xFFE6A7];

    const burst = s.add.particles(this.x, this.y - 30, '__DEFAULT', {
      speed: { min: 60, max: 160 },
      lifespan: 700,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: tint,
      quantity: count,
      emitting: false,
    });
    burst.explode(count);
    s.time.delayedCall(900, () => burst.destroy());

    // tween scale directly. while _growing is true, update() leaves scale alone
    // so the tween has exclusive control and the form change actually lands.
    this._growing = true;
    const startSign = Math.sign(this.facing) || 1;

    s.tweens.add({
      targets: this,
      scaleX: startSign * scaleUp,
      scaleY: scaleUp,
      duration: duration, yoyo: true, ease: 'Sine.easeInOut',
      onYoyo: () => this._applyGrowth(targetState),
      onComplete: () => {
        // apply even if onYoyo was missed for any reason, then hand scale back
        if (this.state !== targetState) this._applyGrowth(targetState);
        const sign = Math.sign(this.facing) || 1;
        this.setScale(sign, 1);
        this._growing = false;
      },
    });
  }

  update(dt, keys) {
    const speedMax =
      this.state === 'baby'  ? 180 :
      this.state === 'child' ? 220 :
      this.state === 'teen'  ? 280 :
                               300;
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
      const jumpV =
        this.state === 'baby'  ? -420 :
        this.state === 'child' ? -470 :
        this.state === 'teen'  ? -540 :
                                 -560;
      this.body.setVelocityY(jumpV);
    }

    // face direction — only touch scale when we're NOT in a grow tween,
    // so the tween can fully drive the scale during the form transition.
    if (!this._growing) {
      const sign = Math.sign(this.facing) || 1;
      if (Math.sign(this.scaleX) !== sign) {
        this.setScale(sign, 1);
      }
    }

    // animate limbs
    if (!onGround) {
      this.armFront.setRotation(-0.9);
      this.armBack.setRotation(-1.1);
      this.legFront.setRotation(0.6);
      this.legBack.setRotation(-0.3);
    } else if (moving) {
      this.runPhase += dt * 0.016;
      const sw = Math.sin(this.runPhase * 12) * 0.9;
      this.armFront.setRotation(-sw);
      this.armBack.setRotation(sw);
      this.legFront.setRotation(sw * 0.7);
      this.legBack.setRotation(-sw * 0.7);
      const bob = Math.abs(Math.sin(this.runPhase * 24)) * -1.5;
      this.head.y = bob;
      this.face.y = bob;
      this.frontHair.y = bob;
      this.backHair.y = bob;
    } else {
      const t = this.scene.time.now * 0.002;
      const breath = Math.sin(t) * 0.5;
      this.armFront.setRotation( 0.05 + breath * 0.02);
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
