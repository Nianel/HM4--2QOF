// Lib
const Mathabs = Math.abs;
const Mathmin = Math.min;
const Mathmax = Math.max;

// configSize
const cS = {
  w: 10000,
  h: 1000,
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
  },
  banner: false
};
const game = new Phaser.Game(config);

// Sprites
let bg1, bg2, bg3;
let platforms, player, tests;
// Controllers
let mCamera;
let kInput;
let cursors;
// Player properties
let animations;
let pVelocity = 180;
let pVelocityCount = 0;
let pLifespan = 100;
let pAge = 20;
const pAgeIncreasePerQuestion = 10;
const pLifespanDecreasePerWrongAnswer = 10;
let pScoreText;

function preload() {
  this.load.image('ground', './assets/ground.png');
  this.load.image('wall', './assets/wall.png');
  this.load.image('bg1', './assets/bg1.png');
  this.load.image('bg2', './assets/bg2.png');
  this.load.image('test', './assets/test.png');
  this.load.spritesheet('char1', './assets/char1.png', {frameWidth: 144, frameHeight: 256});
  this.load.spritesheet('char2', './assets/char2.png', {frameWidth: 144, frameHeight: 256});
  this.load.spritesheet('char3', './assets/char3.png', {frameWidth: 144, frameHeight: 256});
  this.load.spritesheet('char4', './assets/char4.png', {frameWidth: 144, frameHeight: 256});
}

function create() {
  // Camera
  mCamera = this.cameras.main;
  mCamera.setBounds(0, 0, cS.w, cS.h).setSize(cS.vw, cS.vh).setBackgroundColor('#000000');

  // First scene
  bg1 = this.add.image(0, cS.h, 'bg1').setOrigin(0, 1);
  bg2 = this.add.image(bg1.width, cS.h, 'bg2').setOrigin(0, 1);

  // Platforms
  platforms = this.physics.add.staticGroup();
  // Ground
  const floor = platforms.create(0, cS.h, 'ground').setOrigin(0, 1);
  spriteBundledTransformations(floor, 'axr');
  // Walls
  // platforms.create(600, cS.h - 350, 'wall').setOrigin(0, 1).setScale(1, 1.6).refreshBody();
  // platforms.create(600, cS.h - 550, 'ground').setOrigin(0, 1).setScale(9, 1).refreshBody();
  // platforms.create(1736, cS.h - 350, 'wall').setOrigin(0, 1).setScale(1, 1.6).refreshBody();
  // platforms.create(1737, cS.h - 350, 'ground').setOrigin(0, 1).setScale(10, 1).refreshBody();
  // platforms.create(2520, cS.h - 350, 'wall').setOrigin(0, 1).setScale(1, 1.6).refreshBody();

  // Tests objects
  tests = this.physics.add.staticGroup();
  const test1 = tests.create(1150, cS.h - 350, 'test');
  const test2 = tests.create(1500, cS.h - 350, 'test');
  const test3 = tests.create(1800, cS.h - 350, 'test');
  const test4 = tests.create(2100, cS.h - 350, 'test');

  //Player life
  pScoreText = this.add.text(0, cS.h - cS.vh, 'Age: 20 | Lifespan: 100', { fontSize: '24px', color: '#FFFFFF', backgroundColor: '#000000' }).setOrigin(0, 0);

  // The player and its settings
  player = spriteLoadChar(this, 10, cS.h - 200, 'char1');

  // Input Events
  cursors = this.input.keyboard.createCursorKeys();
  kInput = this.input.keyboard;
}

function update() {
  // Modify the velocity
  if (player.x > bg1.width && pVelocityCount === 0) {
    spriteSwapChar(this, 'char3');
    pVelocity -= 30;
    pVelocityCount++;
  } else if (player.x > bg2.width && pVelocityCount === 1) {
    spriteSwapChar(this, 'char4');
    pVelocity -= 70;
    pVelocityCount++;
  }

  // Movements
  if (cursors.left.isDown) {
    // Left Move
    player.setVelocityX(-pVelocity);
    player.anims.play('left', true);
  } else if (cursors.right.isDown) {
    // Right Move
    player.setVelocityX(pVelocity);
    player.anims.play('right', true);
  } else if (Mathabs(player.body.velocity.x) > 0) {
    // Standing
    player.setVelocityX(0);
    player.anims.play('turn');
  }

  // Jump
  if ((cursors.space.isDown || cursors.up.isDown) && player.body.touching.down) {
    player.setVelocityY(-(pVelocity + 200));
  }

  // Objects follow
  if (Mathabs(player.body.velocity.x) > 5 || Mathabs(player.body.velocity.y) > 5) {
    // Camera
    mCamera.scrollX = player.x - cS.vwo;
    mCamera.scrollY = player.y - cS.vho;
    // Score
    pScoreText.x = Mathmin(Mathmax(0, player.x - cS.vwo), cS.w - cS.vw);
  }
}

// Fetch the tests json
let testsPool;
fetch('./assets/tests.json')
  .then(function (response) {
    return response.json();
  })
  .then(function (jsonResponse) {
    testsPool = jsonResponse;
  });
// Tests handler
const testModal = $('#myModal');
let testModalIsVisible = false;
let testGameObject;
let testCorrectAnswerNode;
let testSelectedAnswerNode;
testModal.on('hidden.bs.modal', function (e) {
  // Increase the player age
  pAge += pAgeIncreasePerQuestion;
  // Reduce the lifespan if the answer is wrong
  if (testSelectedAnswerNode.dataset.qIndex !== testCorrectAnswerNode.dataset.qIndex) {
    pLifespan -= pLifespanDecreasePerWrongAnswer;
  }
  pScoreText.setText(`Age: ${pAge} | Lifespan: ${pLifespan}`);
  // Is it game over ?
  if (pAge >= pLifespan) {
    // Schedule the end of the game
    setTimeout(function () {
      // End the game
      game.destroy(true);
      // Clear the DOM
      const body = document.body;
      while (body.firstChild) {
        body.removeChild(body.firstChild);
      }
      // Insert the end image
      const img = new Image();
      img.src = 'https://www.fuzz-bayonne.com/wp-content/uploads/2017/02/JUSTICE-Cross.jpg';
      img.style.display = 'block';
      img.style.margin = 'auto';
      img.style.opacity = '0';
      body.appendChild(img);
      let steps = 0;
      let timer = setInterval(function() {
        steps++;
        img.style.opacity = (0.05 * steps).toString();
        if(steps >= 20) {
          clearInterval(timer);
          timer = undefined;
        }
      }, 50);
    }, 1500);
    // Fade the camera
    mCamera.fade(1500);
  }
  // Enable back keyboard kInput
  kInput.enabled = true;
  // Destroy the test
  testGameObject.disableBody(true, true);
  testGameObject = undefined;
  // Allow the trigger of another modal
  testModalIsVisible = false;
});
function interactTest(player, test) {
  if (!testModalIsVisible) {
    // Save the test game object
    testGameObject = test;

    // Disable keyboard kInput
    kInput.enabled = false;
    for (let i = 0; i < kInput.keys.length; i++) {
      let key = kInput.keys[i];
      if (key) {
        key.isDown = false;
      }
    }

    // Select a test
    const selectedTest = testsPool[Math.floor(Math.random() * Math.floor(testsPool.length))];

    // Display the question
    const questionNode = document.querySelector('#question');
    questionNode.innerText = selectedTest.question;

    // Display the answer
    // Clear the old answers
    const answersParentNode = document.querySelector('#answers');
    while (answersParentNode.firstChild) {
      answersParentNode.removeChild(answersParentNode.firstChild);
    }
    const answers = selectedTest.answers;
    // Fetch the new ones
    for (let index in answers) {
      // Force the index to be a number
      index = parseInt(index);
      // Create a child element
      const child = document.createElement("li");
      child.innerText = answers[index];
      child.dataset.qIndex = index;
      child.style.cursor = 'pointer';
      // Click callback
      child.addEventListener("click", function() {
        // Save the child reference of the selected answer
        testSelectedAnswerNode = child;
        displayCorrectAnswer();
      }, false);
      // Keep the child reference of the correct answer
      if (index === selectedTest.correct) {
        testCorrectAnswerNode = child;
      }
      // Then append it
      answersParentNode.appendChild(child);
    }

    // Trigger the modal
    openTestModal();
  }
}
function openTestModal () {
  testModalIsVisible = true;
  testModal.modal({
    backdrop: 'static',
    keyboard: false
  });
}
function closeTestModal () {
  testModal.modal('hide');
}
function displayCorrectAnswer () {
  testSelectedAnswerNode.style.border = '2px solid orange';
  testCorrectAnswerNode.style.background = 'green';
  setTimeout(closeTestModal, 2000);
}

// Helpers
function spriteBundledTransformations(e, mode) {
  if (mode.includes('a')) {
    e.alpha = 0;
  }
  if (mode.includes('x')) {
    e.scaleX = Math.floor(cS.w / e.width) + 1;
  }
  if (mode.includes('y')) {
    e.scaleY = Math.floor(cS.h / e.height) + 1;
  }
  if (mode.includes('r')) {
    e.refreshBody();
  }
}
function spriteLoadChar(scene, x, y, key) {
  const char = scene.physics.add.sprite(x, y, key);
  // Physics properties
  char.setBounce(0.1);
  char.setCollideWorldBounds(true);
  // Animations
  animations = [];
  animations.push(scene.anims.create({
    key: 'left',
    frames: scene.anims.generateFrameNumbers(key, {start: 0, end: 3}),
    frameRate: 10,
    repeat: -1
  }));
  animations.push(scene.anims.create({
    key: 'turn',
    frames: [{key: key, frame: 4}],
    frameRate: 20
  }));
  animations.push(scene.anims.create({
    key: 'right',
    frames: scene.anims.generateFrameNumbers(key, {start: 5, end: 7}),
    frameRate: 10,
    repeat: -1
  }));
  char.anims.play('turn');
  // Colliders
  scene.physics.add.collider(char, platforms);
  // Overlaps
  scene.physics.add.overlap(char, tests, interactTest, null, this);

  return char;
}
function spriteSwapChar(scene, key) {
  const x = player.x, y = player.y;
  for (let animation of animations) {
    animation.destroy();
  }
  player.destroy();
  player = spriteLoadChar(scene, x, y, key);
}
