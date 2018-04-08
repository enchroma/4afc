window.BASE_PATH = ""
if (process.env.NODE_ENV === "production") {
  window.BASE_PATH = "/4afc/"
}
var helpers = require('./helpers');

//get output div by its class
var outputEl = document.querySelector('.output');
var c = document.getElementById('myCanvas');
c.width = window.innerWidth;
c.height = window.innerHeight;

var ColorLibrary = net.brehaut.Color;
var ctx = c.getContext('2d');

//**************
/// RESIZE HELPER FUNCTIONS
//**************

var radius;
var leftCIrcleX;
var CIRCLE_RADIUS_DEVISOR = 3.2;

function getScreenSize(circleScalar = CIRCLE_RADIUS_DEVISOR) {
  radius = Math.min(Math.min(window.innerWidth, window.innerHeight) / circleScalar, 400); // value to scale the circles, max radius of 300
  leftCIrcleX = Math.max(window.innerWidth / 2, radius + 20); //20 pixels minimum from the side
  c.width = window.innerWidth;
  c.height = window.innerHeight;
}

var HIDE_SLIDERS_DURING_TEST = false;

var downloadEl = document.querySelector('.download');
var testCompleteEl = document.querySelector('.test--complete');
var outputEl = document.querySelector('#output');
/*HIDE ELEMENTS*/
downloadEl.style.visibility = 'hidden';
testCompleteEl.style.visibility = 'hidden';

//***********
// SETUP
//***********
var JSON_CONFIG = null;
var TEST_SEQUENCE = [];
var OUTPUT_DATA = [];

//***********
// internal variables
//***********
var _testIndex = 0;
var _testSequence = [];

// DRAWING!!!
/*
    This is a loop at 60fps
    we measure elapsed time at the end to step through the timings
  */
//***********

const TAO = Math.PI * 2;

var _previousTime = performance.now();
var _timeElapsed = performance.now();

function drawAFC(afc) {
  if (!afc) return;
  afc.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(window.innerWidth / 2 * (i % 2), window.innerHeight / 2 * (i > 1 ? 1 : 0), window.innerWidth / 2, window.innerHeight / 2);
  });
}

function drawCircle(circleColor) {
  ctx.beginPath();
  ctx.arc(leftCIrcleX, window.innerHeight / 2, radius, 0, TAO, false);
  ctx.closePath();
  ctx.fillStyle = circleColor;
  ctx.fill();
}

function drawFocusCirlce(remappedTime) {
  ctx.setLineDash([]);
  ctx.beginPath();
  var _cos = Math.abs(Math.cos(remappedTime));
  var _sin = Math.abs(Math.sin(remappedTime));
  var _tan = Math.atan(_sin / _cos);
  if (ctx.ellipse) {
    ctx.ellipse(
      leftCIrcleX, //x
      window.innerHeight / 2, //y
      _cos * 2.5 + 2.5, //radiusX
      _sin * 2.5 + 2.5, //radiusY
      45 * Math.PI / 180,
      0,
      2 * Math.PI,
    );
  } else {
    ctx.arc(
      leftCIrcleX, //x
      window.innerHeight / 2, //y
      _cos * 0.5 + 4.5,
      0,
      2 * Math.PI,
      true,
    );
  }
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fill();
}

function drawCanvas() {
  var now = performance.now();

  if (!TEST_SEQUENCE.length) {
    return requestAnimationFrame(drawCanvas);
  }
  //check to see if completed, anc cancek out if so

  //pick the testObject out
  var testObject = TEST_SEQUENCE[_testIndex];
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  var circleColor;
  switch (testObject.type) {
    case 'induction':
      ctx.fillStyle = testObject.backgroundColor;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      break;
    case 'focus':
      ctx.fillStyle = testObject.backgroundColor;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      drawCircle(testObject.circleColor);
      drawFocusCirlce(now * 0.002);
      break;
    case 'afterImage':
      drawAFC(testObject.AFC);
      drawCircle(testObject.afterImageCircleColor);
      break;
    case 'intermission':
      ctx.fillStyle = testObject.backgroundColor;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      break;
  }

  _timeElapsed += now - _previousTime;
  if (_timeElapsed > testObject.holdDuration) {
    _timeElapsed = 0;
    _testIndex++;

    if (_testIndex > TEST_SEQUENCE.length - 1) {
      const csv = `${window.convertArrayOfObjectsToCSV({ data: OUTPUT_DATA })}`;
      outputEl.style.display = 'block';
      console.log(csv);
      outputEl.innerHTML = csv;
      return;
    }
  }
  requestAnimationFrame(drawCanvas);
  _previousTime = now;
}

window.addEventListener('resize', function(e) {
  getScreenSize();
});

getScreenSize();
//drawCanvas();
drawCanvas();

window.addEventListener('click', e => {
  const x = e.x || e.clientX || e.pageX;
  const y = e.y || e.clientY || e.pageY;
  const isRight = x > window.innerWidth / 2;
  const isBottom = y > window.innerHeight / 2;
  let quadIndex;
  if (isRight && !isBottom) {
    quadIndex = 1;
  } else if (!isRight && !isBottom) {
    quadIndex = 0;
  } else if (!isRight && isBottom) {
    quadIndex = 2;
  } else {
    quadIndex = 3;
  }
  const testObject = TEST_SEQUENCE[_testIndex];
  if (!testObject) return;
  if (!testObject.circleColor) return;
  const previousObject = OUTPUT_DATA[OUTPUT_DATA.length - 1] || {};
  const rgbCircleStr = testObject.circleColor.substring(4, testObject.circleColor.length - 1);
  if (testObject.AFC && previousObject.circleColorRGB !== rgbCircleStr) {
    const rgb = testObject.AFC[quadIndex].substring(4, testObject.AFC[quadIndex].length - 2).split(',');
    OUTPUT_DATA.push({
      Test_Type: 'AF',
      circleColorRGB: rgbCircleStr.split(',').join(' '),
      R: rgb[0],
      G: rgb[1],
      B: rgb[2],
      timestamp: new Date(),
    });
  }
});

window.loadConfig((err, res) => {
  const { circleScalar } = res;
  CIRCLE_RADIUS_DEVISOR = circleScalar;
  getScreenSize(circleScalar);
  JSON_CONFIG = res;
  TEST_SEQUENCE = [{ ...res.induction, type: 'induction' }];
  res.tests.forEach((test, i) => {
    TEST_SEQUENCE.push({ ...test, type: 'focus' });
    TEST_SEQUENCE.push({ ...test, type: 'afterImage', holdDuration: test.afterImageDuration });
    TEST_SEQUENCE.push({ ...res.intermission, type: 'intermission' });
  });
});
