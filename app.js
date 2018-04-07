// cS
const cS = {
  w: 10000,
  h: 900,
  vw: window.innerWidth,
  vh: window.innerHeight,
  vwo: window.innerWidth / 2,
  vho: window.innerHeight / 2
};

const config = {
  type: Phaser.AUTO,
  width: cS.w,
  height: cS.h,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {y: 600},
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

let player;
// let stars;
// let bombs;
let platforms;
let cursors;
let score = 0;
let gameOver = false;
let scoreText;

const game = new Phaser.Game(config);

function preload() {
  this.load.image('sky', './assets/sky.png');
  this.load.image('ground', './assets/ground.png');
  this.load.image('wall', './assets/wall.png');
  // this.load.image('star', './assets/star.png');
  // this.load.image('bomb', './assets/bomb.png');
  this.load.spritesheet('dude', './assets/dude.png', {frameWidth: 128, frameHeight: 240});
}

function create() {
  //  The world is 3200 x 600 in size
  this.cameras.main.setBounds(0, 0, cS.w, cS.h);
  this.cameras.main.setSize(cS.vw, cS.vh);

  //  A simple background for our game
  let bg = this.add.image(400, 300, 'sky');
  bg.scaleX = 25;
  bg.scaleY = 20;

  //  The platforms group contains the ground and the 2 ledges we can jump on
  platforms = this.physics.add.staticGroup();

  //  Here we create the ground.
  //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
  let floor = platforms.create(0, cS.h, 'ground');
  floor.setOrigin(0, 1);
  floor.scaleX = Math.floor(cS.w / floor.width) + 1;
  floor.refreshBody();

  //  Now let's create some ledges
  platforms.create(600, cS.h - 350, 'wall').setOrigin(0, 1).setScale(1, 1.6).refreshBody();
  platforms.create(600, cS.h - 550, 'ground').setOrigin(0, 1).setScale(9, 1).refreshBody();
  platforms.create(1736, cS.h - 350, 'wall').setOrigin(0, 1).setScale(1, 1.6).refreshBody();
  platforms.create(1737, cS.h - 350, 'ground').setOrigin(0, 1).setScale(10, 1).refreshBody();
  platforms.create(2520, cS.h - 350, 'wall').setOrigin(0, 1).setScale(1, 1.6).refreshBody();


  // The player and its settings
  player = this.physics.add.sprite(1800, cS.h-200, 'dude');

  //  Player physics properties. Give the little guy a slight bounce.
  player.setBounce(0.1);
  player.setCollideWorldBounds(true);

  //  Our player animations, turning, walking left and walking right.
  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', {start: 0, end: 3}),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'turn',
    frames: [{key: 'dude', frame: 4}],
    frameRate: 20
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', {start: 5, end: 7}),
    frameRate: 10,
    repeat: -1
  });

  //  Input Events
  cursors = this.input.keyboard.createCursorKeys();

  //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
  // stars = this.physics.add.group({
  //   key: 'star',
  //   repeat: 17,
  //   setXY: {x: 100, y: 0, stepX: 70}
  // });

  // stars.children.iterate(function (child) {
  //
  //   //  Give each star a slightly different bounce
  //   child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  //
  // });

  // bombs = this.physics.add.group();
  //
  // //  The score
  // scoreText = this.add.text(16, 16, 'score: 0', {fontSize: '32px', fill: '#000'});

  //  Collide the player and the stars with the platforms
  this.physics.add.collider(player, platforms);
  // this.physics.add.collider(stars, platforms);
  // this.physics.add.collider(bombs, platforms);

  //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
  // this.physics.add.overlap(player, stars, collectStar, null, this);
  //
  // this.physics.add.collider(player, bombs, hitBomb, null, this);
}

function update() {
  if (gameOver) {
    return;
  }


  if (cursors.left.isDown) {
    player.setVelocityX(-160);

    player.anims.play('left', true);

  } else if (cursors.right.isDown) {
    player.setVelocityX(160);

    player.anims.play('right', true);
  } else {
    player.setVelocityX(0);

    player.anims.play('turn');
  }

  if ((cursors.space.isDown || cursors.up.isDown) && player.body.touching.down) {
    player.setVelocityY(-330);
  }

  if (Math.abs(player.body.velocity.x) > 5 || Math.abs(player.body.velocity.y) > 5) {
    this.cameras.main.scrollX = player.x - cS.vwo;
    this.cameras.main.scrollY = player.y - cS.vho;
  }
}

// function collectStar(player, star) {
//   star.disableBody(true, true);
//
//   //  Add and update the score
//   score += 10;
//   scoreText.setText('Score: ' + score);
//
//   if (stars.countActive(true) === 0) {
//     //  A new batch of stars to collect
//     stars.children.iterate(function (child) {
//
//       child.enableBody(true, child.x, 0, true, true);
//
//     });
//
//     const x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
//
//     const bomb = bombs.create(x, 16, 'bomb');
//     bomb.setBounce(1);
//     bomb.setCollideWorldBounds(true);
//     bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
//     bomb.allowGravity = false;
//
//   }
// }

// function hitBomb(player, bomb) {
//   this.physics.pause();
//
//   player.setTint(0xff0000);
//
//   player.anims.play('turn');
//
//   gameOver = true;
// }
