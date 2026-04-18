// Procedural character — "Katya" — built as a Container of Graphics children.
//
// 10 form states drive body size + outfit + accessories:
//   baby        small, pink dress, yellow bow
//   child       medium-small, pink dress, yellow bow
//   teen        taller, cerise dress, shoulder hair, no bow
//   teen_grad   teen + graduation mortarboard + tassel
//   adult       full size, teal dress, long hair, gold necklace
//   office      adult body, white blouse + navy pencil skirt, no necklace
//   wedding     adult body, white flared dress, white veil, tiny tiara
//   withBaby    adult body, teal dress, baby bundle in arms
//   london      adult body, pink sweater + blue jeans
//   amsterdam   adult body, orange dress (same silhouette as teal)
//
// Running = leg/arm swing + slight head bob. Jumping = arms up, legs tucked.

const ADULT_BASE = {
  headR: 16,
  bodyH: 44, bodyW: 30,
  skin: 0xF4C8AA, hair: 0x1E0F07, hairAccent: 0x2E1A0F,
  legH: 26, legW: 6, armH: 24, armW: 6,
  totalH: 88,
  hairLen: 30,
};

const TEEN_BASE = {
  headR: 16,
  bodyH: 42, bodyW: 28,
  skin: 0xF4C8AA, hair: 0x1E0F07, hairAccent: 0x2E1A0F,
  legH: 24, legW: 6, armH: 22, armW: 6,
  totalH: 84,
  hairLen: 18,
};

const KATYA_PARAMS = {
  baby: {
    headR: 13, bodyH: 20, bodyW: 22,
    skin: 0xF4C8AA, hair: 0x2C1810, hairAccent: 0x3E2418,
    legH: 10, legW: 5, armH: 12, armW: 5,
    totalH: 48, hairLen: 0,
    outfit: 'dress', dressColor: 0xFFA7C2, dressTrim: 0xFFFFFF,
    bowColor: 0xFFE16B,
  },
  child: {
    headR: 14, bodyH: 26, bodyW: 26,
    skin: 0xF4C8AA, hair: 0x2C1810, hairAccent: 0x3E2418,
    legH: 12, legW: 5, armH: 14, armW: 5,
    totalH: 56, hairLen: 0,
    outfit: 'dress', dressColor: 0xFF9EBB, dressTrim: 0xFFFFFF,
    bowColor: 0xFFE16B,
  },
  teen: {
    ...TEEN_BASE,
    outfit: 'dress', dressColor: 0xD94C7A, dressTrim: 0xFFC6D9,
  },
  teen_grad: {
    ...TEEN_BASE,
    outfit: 'dress', dressColor: 0xD94C7A, dressTrim: 0xFFC6D9,
    gradHat: true,
  },
  adult: {
    ...ADULT_BASE,
    outfit: 'dress', dressColor: 0x3F8A82, dressTrim: 0xEFF7F5,
    necklace: true,
  },
  adult_grad: {
    ...ADULT_BASE,
    outfit: 'dress', dressColor: 0x3F8A82, dressTrim: 0xEFF7F5,
    necklace: true,
    gradHat: true,
  },
  office: {
    ...ADULT_BASE,
    outfit: 'office',
  },
  wedding: {
    ...ADULT_BASE,
    outfit: 'wedding',
    veil: true,
  },
  withBaby: {
    ...ADULT_BASE,
    outfit: 'dress', dressColor: 0x3F8A82, dressTrim: 0xEFF7F5,
    necklace: true,
    babyBundle: true,
  },
  london: {
    ...ADULT_BASE,
    outfit: 'london',
  },
  amsterdam: {
    ...ADULT_BASE,
    outfit: 'dress', dressColor: 0xEA8A3D, dressTrim: 0xFFE4CC,
    necklace: true,
  },
  pink_dress: {
    ...ADULT_BASE,
    outfit: 'dress', dressColor: 0xEC7DA5, dressTrim: 0xFFE6EE,
    necklace: true,
  },
};

class Katya extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.state = 'baby';
    this.facing = 1;
    this.runPhase = 0;
    this._growing = false;

    this._buildParts();
    this._applyGrowth('baby', true);
    this.setScale(1, 1);

    this.body.setMaxVelocity(320, 1200);
    this.body.setDragX(1400);
    this.body.setCollideWorldBounds(true);
  }

  _buildParts() {
    this.backHair  = this.scene.add.graphics();
    this.bodyG     = this.scene.add.graphics();
    this.armBack   = this.scene.add.graphics();
    this.legBack   = this.scene.add.graphics();
    this.legFront  = this.scene.add.graphics();
    this.armFront  = this.scene.add.graphics();
    this.head      = this.scene.add.graphics();
    this.frontHair = this.scene.add.graphics();
    this.face      = this.scene.add.graphics();
    this.accessory = this.scene.add.graphics(); // on-top accessories (hat, bundle)

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
      this.accessory,
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
    const feetY       = 0;
    const legTopY     = feetY - P.legH;
    const bodyBottomY = legTopY;
    const bodyTopY    = bodyBottomY - P.bodyH;
    const headCenterY = bodyTopY - P.headR + 2;

    this._drawBackHair(P, headCenterY);
    this._drawBody(P, bodyTopY, bodyBottomY);
    this._drawArms(P);
    this._drawLegs(P);
    this._drawHead(P, bodyTopY, headCenterY);
    this._drawFrontHair(P, headCenterY);
    this._drawFace(P, headCenterY);
    this._drawAccessories(P, headCenterY, bodyTopY, bodyBottomY);

    this.armFront.setPosition( 6, bodyTopY + 4);
    this.armBack.setPosition(-6, bodyTopY + 4);
    this.legFront.setPosition( 4, legTopY);
    this.legBack.setPosition(-4, legTopY);
  }

  // --- drawing helpers ---

  _drawBackHair(P, headCenterY) {
    const g = this.backHair;
    g.clear();

    // wedding veil draws into backHair behind the head, long and flowing
    if (P.veil) {
      g.fillStyle(0xFFFCF0, 0.92);
      g.fillRoundedRect(
        -P.headR * 1.35, headCenterY - 2,
        P.headR * 2.7, P.headR * 2 + 52, 10,
      );
      g.fillStyle(0xFFFFFF, 0.4);
      g.fillRoundedRect(
        -P.headR * 1.0, headCenterY + 4,
        P.headR * 2.0, P.headR * 2 + 40, 8,
      );
    }

    g.fillStyle(P.hair, 1);
    if (P.hairLen <= 2) {
      g.fillEllipse(0, headCenterY + 2, P.headR * 2.2, P.headR * 2.2);
    } else {
      g.fillRoundedRect(
        -P.headR - 2, headCenterY - 4,
        P.headR * 2 + 4, P.headR * 2 + P.hairLen, 6,
      );
      g.fillEllipse(0, headCenterY + 2, P.headR * 2.4, P.headR * 2.2);
    }
  }

  _drawBody(P, bodyTopY, bodyBottomY) {
    const g = this.bodyG;
    g.clear();

    if (P.outfit === 'office') {
      this._drawOfficeOutfit(g, P, bodyTopY, bodyBottomY);
    } else if (P.outfit === 'wedding') {
      this._drawWeddingDress(g, P, bodyTopY, bodyBottomY);
    } else if (P.outfit === 'london') {
      this._drawSweaterOutfit(g, P, bodyTopY, bodyBottomY);
    } else {
      this._drawDress(g, P, bodyTopY, bodyBottomY);
    }

    if (P.necklace) {
      g.lineStyle(1.2, 0xF4D28A, 0.95);
      g.strokeEllipse(0, bodyTopY + 3, P.bodyW * 0.55, 6);
      g.fillStyle(0xF4D28A, 1);
      g.fillCircle(0, bodyTopY + 6, 1.4);
    }

    if (P.babyBundle) {
      this._drawBabyBundle(g, P, bodyTopY, bodyBottomY);
    }
  }

  _drawDress(g, P, bodyTopY, bodyBottomY) {
    const halfTop = P.bodyW * 0.35;
    const halfBot = P.bodyW * 0.55;

    g.fillStyle(P.dressColor, 1);
    g.beginPath();
    g.moveTo(-halfTop, bodyTopY);
    g.lineTo( halfTop, bodyTopY);
    g.lineTo( halfBot, bodyBottomY);
    g.lineTo(-halfBot, bodyBottomY);
    g.closePath();
    g.fillPath();

    g.fillStyle(P.dressTrim, 1);
    g.fillRect(-halfBot, bodyBottomY - 2, halfBot * 2, 2);
    g.fillStyle(P.dressTrim, 1);
    g.fillRect(-halfTop, bodyTopY, halfTop * 2, 2);
    g.fillStyle(0xffffff, 0.15);
    g.fillRect(-halfTop + 2, bodyTopY + 2, 3, P.bodyH - 4);
  }

  _drawOfficeOutfit(g, P, bodyTopY, bodyBottomY) {
    const halfTop = P.bodyW * 0.35;
    const halfWaist = P.bodyW * 0.40;
    const halfHip = P.bodyW * 0.44;
    const waistY = bodyTopY + P.bodyH * 0.55;

    // white blouse (top)
    g.fillStyle(0xFDFBF5, 1);
    g.beginPath();
    g.moveTo(-halfTop, bodyTopY);
    g.lineTo( halfTop, bodyTopY);
    g.lineTo( halfWaist, waistY);
    g.lineTo(-halfWaist, waistY);
    g.closePath();
    g.fillPath();

    // navy pencil skirt
    g.fillStyle(0x2E4B6B, 1);
    g.beginPath();
    g.moveTo(-halfWaist, waistY);
    g.lineTo( halfWaist, waistY);
    g.lineTo( halfHip, bodyBottomY);
    g.lineTo(-halfHip, bodyBottomY);
    g.closePath();
    g.fillPath();

    // belt
    g.fillStyle(0x2A2A2A, 1);
    g.fillRect(-halfWaist - 0.5, waistY - 1.5, halfWaist * 2 + 1, 3);
    g.fillStyle(0xCFA35C, 1);
    g.fillRect(-1.5, waistY - 1.5, 3, 3);

    // blouse buttons
    g.fillStyle(0xC0C0C0, 1);
    g.fillCircle(0, bodyTopY + 8, 1);
    g.fillCircle(0, bodyTopY + 16, 1);
    g.fillCircle(0, bodyTopY + 24, 1);

    // collar V
    g.fillStyle(0xE0DBC8, 1);
    g.fillTriangle(-4, bodyTopY, 4, bodyTopY, 0, bodyTopY + 8);

    // blouse highlight
    g.fillStyle(0xffffff, 0.35);
    g.fillRect(-halfTop + 2, bodyTopY + 2, 2, P.bodyH * 0.4);
  }

  _drawWeddingDress(g, P, bodyTopY, bodyBottomY) {
    const halfTop = P.bodyW * 0.32;
    const halfBot = P.bodyW * 0.75; // wide flare

    // full white gown
    g.fillStyle(0xFFFCF0, 1);
    g.beginPath();
    g.moveTo(-halfTop, bodyTopY);
    g.lineTo( halfTop, bodyTopY);
    g.lineTo( halfBot, bodyBottomY);
    g.lineTo(-halfBot, bodyBottomY);
    g.closePath();
    g.fillPath();

    // lace layers
    g.fillStyle(0xE6DCC8, 0.45);
    for (let i = 0; i < 4; i++) {
      const y = bodyTopY + P.bodyH * 0.3 + i * 7;
      const halfW = halfTop + (halfBot - halfTop) * ((y - bodyTopY) / P.bodyH);
      g.fillRect(-halfW + 1, y, halfW * 2 - 2, 1);
    }

    // bottom trim
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(-halfBot, bodyBottomY - 3, halfBot * 2, 3);

    // sweetheart neckline
    g.fillStyle(P.skin, 1);
    g.fillEllipse(0, bodyTopY - 1, 10, 5);

    // sheen
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(-halfTop + 3, bodyTopY + 4, 2, P.bodyH - 10);

    // small bouquet she's holding — pink flower cluster on front
    const bqY = bodyTopY + P.bodyH * 0.6;
    g.fillStyle(0x4C7B3E, 1);
    g.fillRect(-1, bqY, 2, 8);
    g.fillStyle(0xFF9FAE, 1);
    g.fillCircle(-3, bqY - 2, 2.2);
    g.fillCircle( 3, bqY - 2, 2.2);
    g.fillCircle( 0, bqY - 4, 2.5);
    g.fillCircle(-2, bqY + 1, 2);
    g.fillCircle( 2, bqY + 1, 2);
    g.fillStyle(0xFFF4A0, 1);
    g.fillCircle(0, bqY - 3, 1);
  }

  _drawSweaterOutfit(g, P, bodyTopY, bodyBottomY) {
    const halfSweater = P.bodyW * 0.42;
    const waistY = bodyTopY + P.bodyH * 0.58;

    // chunky pink sweater — rectangular with rounded bottom
    g.fillStyle(0xF48FB1, 1);
    g.fillRoundedRect(
      -halfSweater, bodyTopY - 2,
      halfSweater * 2, waistY - bodyTopY + 4, 5,
    );

    // knit ribbing at bottom
    g.fillStyle(0xE57FA2, 1);
    g.fillRect(-halfSweater, waistY - 2, halfSweater * 2, 3);
    for (let i = -halfSweater + 2; i < halfSweater; i += 3) {
      g.fillRect(i, waistY - 2, 1, 3);
    }

    // collar / turtleneck hint
    g.fillStyle(0xD16A8F, 1);
    g.fillRoundedRect(-6, bodyTopY - 3, 12, 4, 2);

    // sweater highlight
    g.fillStyle(0xffffff, 0.2);
    g.fillRect(-halfSweater + 3, bodyTopY + 1, 2, P.bodyH * 0.4);

    // jeans (high-waisted, covers below waistY to bodyBottomY — but most of
    // the jean length actually shows in the legs)
    g.fillStyle(0x3D5E82, 1);
    g.beginPath();
    g.moveTo(-halfSweater * 0.9, waistY);
    g.lineTo( halfSweater * 0.9, waistY);
    g.lineTo( halfSweater * 0.95, bodyBottomY);
    g.lineTo(-halfSweater * 0.95, bodyBottomY);
    g.closePath();
    g.fillPath();

    // denim seam
    g.lineStyle(1, 0x2A476B, 0.9);
    g.lineBetween(0, waistY, 0, bodyBottomY);

    // belt line (thin leather)
    g.fillStyle(0x5A3A2A, 1);
    g.fillRect(-halfSweater * 0.9, waistY - 1, halfSweater * 1.8, 1.5);
  }

  _drawBabyBundle(g, P, bodyTopY) {
    const bY = bodyTopY + P.bodyH * 0.35;
    const bX = -2;

    // blanket (rounded bundle shape)
    g.fillStyle(0xFFD9E4, 1);
    g.fillEllipse(bX, bY, 28, 22);
    g.fillStyle(0xFFB8D9, 0.9);
    g.fillEllipse(bX, bY + 3, 24, 16);

    // baby face
    g.fillStyle(P.skin, 1);
    g.fillCircle(bX + 6, bY - 3, 7);

    // tiny tuft of hair
    g.fillStyle(0x2C1810, 1);
    g.fillEllipse(bX + 6, bY - 8, 6, 3);

    // eyes (closed, asleep)
    g.lineStyle(0.8, 0x1a1a1a, 1);
    g.lineBetween(bX + 3, bY - 3, bX + 5, bY - 3);
    g.lineBetween(bX + 7, bY - 3, bX + 9, bY - 3);

    // tiny smile
    g.fillStyle(0xC44A5C, 1);
    g.fillCircle(bX + 6, bY + 1, 0.7);

    // pacifier / bundle edge sheen
    g.fillStyle(0xffffff, 0.4);
    g.fillEllipse(bX - 6, bY - 2, 8, 4);
  }

  _drawArms(P) {
    // Sleeve color + ratio varies by outfit:
    //   dress        short sleeves in dress color (top 35%)
    //   office       short sleeves in white blouse
    //   wedding      short sleeves in white
    //   london       FULL-length sweater pink (covers whole arm)
    let sleeveColor, sleeveRatio;
    if (P.outfit === 'office') {
      sleeveColor = 0xFDFBF5;
      sleeveRatio = 0.35;
    } else if (P.outfit === 'wedding') {
      sleeveColor = 0xFFFCF0;
      sleeveRatio = 0.4;
    } else if (P.outfit === 'london') {
      sleeveColor = 0xF48FB1;
      sleeveRatio = 1.0;
    } else {
      sleeveColor = P.dressColor;
      sleeveRatio = 0.35;
    }

    this._drawLimb(this.armFront, P.armH, P.armW, P.skin, sleeveColor, sleeveRatio);
    this._drawLimb(this.armBack,  P.armH, P.armW, P.skin, sleeveColor, sleeveRatio);
  }

  _drawLegs(P) {
    if (P.outfit === 'london') {
      // jeans — full-length blue legs with a hint of shoe at the bottom
      this._drawJeanLeg(this.legFront, P);
      this._drawJeanLeg(this.legBack, P);
    } else {
      this._drawLimb(this.legFront, P.legH, P.legW, P.skin, 0xffffff, 0.35);
      this._drawLimb(this.legBack,  P.legH, P.legW, P.skin, 0xffffff, 0.35);
    }
  }

  _drawJeanLeg(g, P) {
    g.clear();
    const len = P.legH;
    const w = P.legW + 1;
    // jeans
    g.fillStyle(0x3D5E82, 1);
    g.fillRoundedRect(-w / 2, 0, w, len * 0.92, w / 2);
    // denim seam
    g.lineStyle(0.8, 0x2A476B, 0.9);
    g.lineBetween(0, 2, 0, len * 0.9);
    // shoe
    g.fillStyle(0x2A2A2A, 1);
    g.fillRoundedRect(-w / 2 - 1, len * 0.85, w + 2, len * 0.22, 2);
  }

  _drawLimb(g, len, w, skinColor, sleeveColor, sleeveRatio = 0.35) {
    g.clear();
    g.fillStyle(sleeveColor, 1);
    g.fillRoundedRect(-w / 2, 0, w, len * sleeveRatio, w / 2);
    if (sleeveRatio < 1) {
      g.fillStyle(skinColor, 1);
      g.fillRoundedRect(-w / 2, len * (sleeveRatio - 0.05), w, len * (1 - sleeveRatio + 0.05), w / 2);
    }
  }

  _drawHead(P, bodyTopY, headCenterY) {
    const g = this.head;
    g.clear();
    g.fillStyle(P.skin, 1);
    g.fillRect(-3, bodyTopY - 4, 6, 5);
    g.fillStyle(P.skin, 1);
    g.fillEllipse(0, headCenterY, P.headR * 1.9, P.headR * 2);
  }

  _drawFrontHair(P, headCenterY) {
    const g = this.frontHair;
    g.clear();
    g.fillStyle(P.hair, 1);
    g.fillEllipse(0, headCenterY - P.headR * 0.75, P.headR * 1.8, P.headR * 0.9);
    g.fillEllipse(-P.headR * 0.85, headCenterY - P.headR * 0.25, P.headR * 0.7, P.headR * 1.2);
    g.fillEllipse( P.headR * 0.85, headCenterY - P.headR * 0.25, P.headR * 0.7, P.headR * 1.2);
    g.fillStyle(P.hairAccent, 0.6);
    g.fillEllipse(-P.headR * 0.35, headCenterY - P.headR * 0.9, P.headR * 0.9, P.headR * 0.4);
  }

  _drawFace(P, headCenterY) {
    const g = this.face;
    g.clear();
    const eyeY = headCenterY + 1;
    g.fillStyle(0x1a1a1a, 1);
    g.fillEllipse(-P.headR * 0.35, eyeY, 2.2, 3);
    g.fillEllipse( P.headR * 0.35, eyeY, 2.2, 3);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-P.headR * 0.35 + 0.6, eyeY - 0.6, 0.6);
    g.fillCircle( P.headR * 0.35 + 0.6, eyeY - 0.6, 0.6);
    g.fillStyle(0xFF9FAE, 0.6);
    g.fillCircle(-P.headR * 0.7, eyeY + 5, 2.4);
    g.fillCircle( P.headR * 0.7, eyeY + 5, 2.4);
    g.fillStyle(0xC44A5C, 1);
    g.fillEllipse(0, eyeY + 7, 3.4, 1.4);
  }

  _drawAccessories(P, headCenterY, bodyTopY) {
    const g = this.accessory;
    g.clear();

    // yellow bow on top of head (baby + child)
    if (P.bowColor) {
      const bowY = headCenterY - P.headR * 1.05;
      g.fillStyle(P.bowColor, 1);
      g.fillTriangle(-8, bowY, -2, bowY - 4, -2, bowY + 4);
      g.fillTriangle( 8, bowY,  2, bowY - 4,  2, bowY + 4);
      g.fillCircle(0, bowY, 2.5);
    }

    // graduation mortarboard cap
    if (P.gradHat) {
      const capY = headCenterY - P.headR * 0.9;
      // band
      g.fillStyle(0x1a1a1a, 1);
      g.fillRect(-P.headR * 0.95, capY, P.headR * 1.9, 4);
      // top (flat square, slight tilt)
      g.fillStyle(0x0E0E0E, 1);
      g.fillRect(-P.headR * 1.3, capY - 3, P.headR * 2.6, 3);
      // button
      g.fillStyle(0xFFD86B, 1);
      g.fillCircle(0, capY - 2, 1.5);
      // tassel
      g.lineStyle(1.2, 0xFFD86B, 1);
      g.lineBetween(P.headR * 1.15, capY - 1, P.headR * 1.25, capY + 10);
      g.fillStyle(0xFFD86B, 1);
      g.fillCircle(P.headR * 1.25, capY + 11, 2);
    }

    // tiara for the bride
    if (P.veil) {
      const tY = headCenterY - P.headR * 1.05;
      g.fillStyle(0xF4D28A, 1);
      g.fillTriangle(-6, tY + 2, 0, tY - 3, 6, tY + 2);
      g.fillTriangle(-10, tY + 3, -6, tY - 1, -3, tY + 3);
      g.fillTriangle( 3, tY + 3,  6, tY - 1, 10, tY + 3);
      g.fillStyle(0xFFFFFF, 0.95);
      g.fillCircle(0, tY - 3, 1.2);
      g.fillCircle(-6, tY - 1, 0.9);
      g.fillCircle( 6, tY - 1, 0.9);
    }
  }

  // --- growth / transitions ---

  grow(targetState) {
    if (!targetState || this.state === targetState) return;
    const s = this.scene;

    // bigger puff for dramatic child -> teen jump; subtler for smaller changes
    const isDramatic = (this.state === 'child' && targetState === 'teen_grad')
                    || (this.state === 'child' && targetState === 'teen');
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

    this._growing = true;
    const startSign = Math.sign(this.facing) || 1;

    s.tweens.add({
      targets: this,
      scaleX: startSign * scaleUp,
      scaleY: scaleUp,
      duration: duration, yoyo: true, ease: 'Sine.easeInOut',
      onYoyo: () => this._applyGrowth(targetState),
      onComplete: () => {
        if (this.state !== targetState) this._applyGrowth(targetState);
        const sign = Math.sign(this.facing) || 1;
        this.setScale(sign, 1);
        this._growing = false;
      },
    });
  }

  update(dt, keys) {
    // movement speed loosely scales with age / body size
    const speedMax =
      this.state === 'baby'  ? 180 :
      this.state === 'child' ? 220 :
      (this.state === 'teen' || this.state === 'teen_grad') ? 280 :
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
        (this.state === 'teen' || this.state === 'teen_grad') ? -540 :
                                 -560;
      this.body.setVelocityY(jumpV);
    }

    // face direction — only touch scale when NOT in a grow tween
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
      // cradling mothers don't swing their front arm fully
      const armFrontAmp = this.p.babyBundle ? 0.3 : 1;
      this.armFront.setRotation(-sw * armFrontAmp);
      this.armBack.setRotation(sw);
      this.legFront.setRotation(sw * 0.7);
      this.legBack.setRotation(-sw * 0.7);
      const bob = Math.abs(Math.sin(this.runPhase * 24)) * -1.5;
      this.head.y = bob;
      this.face.y = bob;
      this.frontHair.y = bob;
      this.backHair.y = bob;
      this.accessory.y = bob;
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
      this.accessory.y = breath;
    }
  }
}
