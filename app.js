// Lib
const Mathabs = Math.abs;

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
let player;
let pVelocity = 160;
let pVelocityCount = 0;
let platforms;
let tests;
// Controllers
let mCamera;
let kInput;
let cursors;
// Score
let pLifespan = 100;
let pAge = 20;
const pAgeIncreasePerQuestion = 10;
const pLifespanDecreasePerWrongAnswer = 10;

function preload() {
  this.load.image('sky', './assets/sky.png');
  this.load.image('ground', './assets/ground.png');
  this.load.image('wall', './assets/wall.png');
  this.load.image('bg1', './assets/bg1.png');
  this.load.image('test', './assets/test.png');
  this.load.spritesheet('dude', './assets/dude.png', {frameWidth: 128, frameHeight: 240});
}

function create() {
  // Camera
  mCamera = this.cameras.main;
  mCamera.setBounds(0, 0, cS.w, cS.h).setSize(cS.vw, cS.vh);

  // Background
  const bg = this.add.image(0, 0, 'sky').setOrigin(0, 0);
  spriteAutoScale(bg, 'xy');

  // First scene
  this.add.image(0, cS.h + 40, 'bg1').setOrigin(0, 1);

  // Platforms
  platforms = this.physics.add.staticGroup();
  // Ground
  const floor = platforms.create(0, cS.h, 'ground');
  floor.setOrigin(0, 1);
  spriteAutoScale(floor, 'xr');
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


  // The layer and its settings
  player = this.physics.add.sprite(10, cS.h - 200, 'dude');
  // Physics properties
  player.setBounce(0.1);
  player.setCollideWorldBounds(true);
  // Animations
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
  player.anims.play('turn');

  // Input Events
  cursors = this.input.keyboard.createCursorKeys();
  kInput = this.input.keyboard;

  // Colliders
  this.physics.add.collider(player, platforms);

  // Overlaps
  this.physics.add.overlap(player, tests, interactTest, null, this);
}

function update() {
  // Modify the velocity
  if (player.x > 2000 && pVelocityCount === 0) {
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

  // Camera follow
  if (Mathabs(player.body.velocity.x) > 5 || Mathabs(player.body.velocity.y) > 5) {
    mCamera.scrollX = player.x - cS.vwo;
    mCamera.scrollY = player.y - cS.vho;
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
  // Increase the poor dude age
  pAge += pAgeIncreasePerQuestion;
  // Reduce the lifespan if the answer is wrong
  if (testSelectedAnswerNode.dataset.qIndex !== testCorrectAnswerNode.dataset.qIndex) {
    pLifespan -= pLifespanDecreasePerWrongAnswer;
  }
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
  setTimeout(closeTestModal, 3000);
}

// Helpers
function spriteAutoScale(e, mode = 'xyr') {
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
