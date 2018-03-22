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
  outputEl.style.left = leftCIrcleX * 2 + 'px';
  outputEl.style.width = window.innerWidth - leftCIrcleX * 2 - 70 + 'px';
}

var HIDE_SLIDERS_DURING_TEST = false;

var downloadEl = document.querySelector('.download');
var testCompleteEl = document.querySelector('.test--complete');
/*HIDE ELEMENTS*/
downloadEl.style.visibility = 'hidden';
testCompleteEl.style.visibility = 'hidden';

/*EXPORT CSV*/
downloadEl.addEventListener('click', function() {
  downloadCSV({ data: OUTPUT_DATA });
});

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

//***********
// internal setup function
//***********
// function setTestTimings() {
//   var _time = 0
//   RGB_TEST_VALUES.forEach(function(_, i) {

//     _time += STARE_DURATION
//     /*
//     Testing testObject
//     */
//     _testSequence.push({
//       endTime: _time,
//       leftCircleRGB: RGB_TEST_VALUES[i],
//       leftCircleHSL: rgbToHSL(...RGB_TEST_VALUES[i]),
//       rightCircleRGB: BACKGROUND_GREY,
//       isMatchingMode: false,
//     })

//     _time += MATCH_DURATION
//     /*
//     Matching testObject
//     */
//     _testSequence.push({
//       endTime: _time,
//       leftCircleRGB: WHITE,
//       rightCircleRGB: WHITE, // will be overwritten by UserColor
//       isMatchingMode: true,
//     })

//     _time += RESET_DURATION

//     if (RESET_DURATION) {
//       /*
//     RESET
//     reset testObject
//     */
//       _testSequence.push({
//         endTime: _time,
//         leftCircleRGB: BACKGROUND_GREY,
//         rightCircleRGB: BACKGROUND_GREY,
//         isResetingMode: true,
//         isMatchingMode: false,
//       })
//     }
//   })
// }

//***********
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
      testCompleteEl.style.visibility = 'visible';
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
