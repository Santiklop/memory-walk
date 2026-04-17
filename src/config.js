// Phaser config + boot. Must be last script loaded.

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: WORLD.viewW,
  height: WORLD.viewH,
  backgroundColor: '#FFE5C2',
  pixelArt: false,
  antialias: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1500 },
      debug: false,
    },
  },
  scene: [IntroScene, MainScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

window.addEventListener('load', () => {
  new Phaser.Game(gameConfig);
});
