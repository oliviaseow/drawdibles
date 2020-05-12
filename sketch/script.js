const availableModels = ['bird', 'ant','ambulance','angel','alarm_clock','antyoga','backpack','barn','basket','bear','bee','beeflower','bicycle','book','brain','bridge','bulldozer','bus','butterfly','cactus','calendar','castle','cat','catbus','catpig','chair','couch','crab','crabchair','crabrabbitfacepig','cruise_ship','diving_board','dog','dogbunny','dolphin','duck','elephant','elephantpig','everything','eye','face','fan','fire_hydrant','firetruck','flamingo','flower','floweryoga','frog','frogsofa','garden','hand','hedgeberry','hedgehog','helicopter','kangaroo','key','lantern','lighthouse','lion','lionsheep','lobster','map','mermaid','monapassport','monkey','mosquito','octopus','owl','paintbrush','palm_tree','parrot','passport','peas','penguin','pig','pigsheep','pineapple','pool','postcard','power_outlet','rabbit','rabbitturtle','radio','radioface','rain','rhinoceros','rifle','roller_coaster','sandwich','scorpion','sea_turtle','sheep','skull','snail','snowflake','speedboat','spider','squirrel','steak','stove','strawberry','swan','swing_set','the_mona_lisa','tiger','toothbrush','toothpaste','tractor','trombone','truck','whale','windmill','yoga','yogabicycle'];
const BASE_URL = 'https://storage.googleapis.com/quickdraw-models/sketchRNN/models/';
let selectModels = document.getElementById('selectModels');
let model;
let modelState; 
const temperature = 0.1;
let modelLoaded = false;
let modelIsActive = false;

let chirp = new Audio('https://cdn.glitch.com/6984a70e-6f4e-4c35-a7fb-04b0d531dbfe%2F0.wav?v=1587446067971');
let meow = new Audio('https://cdn.glitch.com/6984a70e-6f4e-4c35-a7fb-04b0d531dbfe%2F22.wav?v=1587446418487');
let woof = new Audio('https://cdn.glitch.com/6984a70e-6f4e-4c35-a7fb-04b0d531dbfe%2F32.wav?v=1587446460044');
let quack = new Audio('https://cdn.glitch.com/6984a70e-6f4e-4c35-a7fb-04b0d531dbfe%2F35.wav?v=1587446483583');

const sketch = function(p) {

  let dx, dy; 
  let x, y; 
  let startX, startY;
  let pen = [0,0,0];
  let previousPen = [1, 0, 0];
  const PEN = {DOWN: 0, UP: 1, END: 2};
  const epsilon = 2.0;

  let currentRawLine = [];
  let userPen = 0;
  let previousUserPen = 0;
  let currentColor = 'black';
  
  let lastHumanStroke;
  let lastHumanDrawing;
  let lastModelDrawing = [];
  
  /*
   * p5 code
   */
  p.setup = function() {

    const containerSize = document.getElementById('sketch').getBoundingClientRect();
    const screenWidth = Math.floor(containerSize.width);
    const screenHeight = Math.floor(containerSize.height);
    
    const btnClear = document.getElementById('btnClear');
    const btnRetry = document.getElementById('btnRetry');
    const btnSave = document.getElementById('btnSave');
    
    
    p.createCanvas(screenWidth, screenHeight);
    p.frameRate(60);

    restart();
    initModel(22);
    
    
    selectModels.innerHTML = availableModels.map(m => `<option>${m}</option>`).join('');
    selectModels.selectedIndex = 22; 
    selectModels.addEventListener('change', () => initModel(selectModels.selectedIndex));
    btnClear.addEventListener('click', restart);
    btnRetry.addEventListener('click', retryMagic);
    btnSave.addEventListener('click', () => {
      p.saveCanvas('drawdibles', 'jpg');
    });
  };
  
  p.windowResized = function () {
    console.log('resize canvas');
    const containerSize = document.getElementById('sketch').getBoundingClientRect();
    const screenWidth = Math.floor(containerSize.width);
    const screenHeight = Math.floor(containerSize.height);
    p.resizeCanvas(screenWidth, screenHeight);
  };

  p.mousePressed = function () {
    if (p.isInBounds()) {
      x = startX = p.mouseX;
      y = startY = p.mouseY;
      userPen = 1; // down

      modelIsActive = false;
      currentRawLine = [];
      lastHumanDrawing = [];
      previousUserPen = userPen;
      p.stroke(currentColor);
    }
  }

  p.mouseReleased = function () {
    if (p.isInBounds()) {
      userPen = 0;
      const currentRawLineSimplified = model.simplifyLine(currentRawLine);


      if (currentRawLineSimplified.length > 1) {
        lastHumanStroke = model.lineToStroke(currentRawLineSimplified, [startX, startY]);
        encodeStrokes(lastHumanStroke);
      }
      currentRawLine = [];
      previousUserPen = userPen;
    }
  }

  p.mouseDragged = function () {
    if (!modelIsActive && p.isInBounds()) {
      const dx0 = p.mouseX - x; 
      const dy0 = p.mouseY - y;
      if (dx0*dx0+dy0*dy0 > epsilon*epsilon) { 
        dx = dx0;
        dy = dy0;
        userPen = 1;
        if (previousUserPen == 1) {
          p.line(x, y, x+dx, y+dy);
          lastHumanDrawing.push([x, y, x+dx, y+dy]);
        }
        x += dx;
        y += dy;
        currentRawLine.push([x, y]);
      }
      previousUserPen = userPen;
    }
    return false;
  }

  p.draw = function() {
    if (!modelLoaded || !modelIsActive) {
      return;
    }
    
    pen = previousPen;
    modelState = model.update([dx, dy, ...pen], modelState);
    const pdf = model.getPDF(modelState, temperature);
    [dx, dy, ...pen] = model.sample(pdf);
  
    let drawn;
    
    if (pen[PEN.END] === 1) {
      drawn = model.checkpointURL.split('/').slice(-1)[0].split('.')[0];
      if (drawn == 'bird') {
        chirp.play();
      }
      else if (drawn == 'cat') {
        meow.play();
      }
      else if (drawn == 'dog') {
        woof.play();
      }
      else if (drawn == 'duck') {
        quack.play();
      }
      console.log('finished this one');
      modelIsActive = false;
    } else {
      
      if (previousPen[PEN.DOWN] === 1) {
        p.line(x, y, x+dx, y+dy);
        lastModelDrawing.push([x, y, x+dx, y+dy]);
      }
      
      x += dx;
      y += dy;
      previousPen = pen;
    }
  };

  p.isInBounds = function () {
    return p.mouseX >= 0 && p.mouseY >= 0 && p.mouseX < p.width && p.mouseY < p.height;
  }

  function retryMagic() {
    p.stroke('white');
    p.strokeWeight(6);
    
    for (let i = 0; i < lastModelDrawing.length; i++) {
      p.line(...lastModelDrawing[i]);
    }
    
    for (let i = 0; i < lastHumanDrawing.length; i++) {
      p.line(...lastHumanDrawing[i]);
    }
    
    p.strokeWeight(3.0);
    p.stroke(currentColor);
    
    for (let i = 0; i < lastHumanDrawing.length; i++) {
      p.line(...lastHumanDrawing[i]);
    }
    
    encodeStrokes(lastHumanStroke);
  }
  
  function restart() {
    p.background(255, 255, 255, 255);
    p.strokeWeight(3.0);

    startX = x = p.width / 2.0;
    startY = y = p.height / 3.0;

    userPen = 1;
    previousUserPen = 0;
    currentRawLine = [];
    strokes = [];

    modelIsActive = false;
    previousPen = [0, 1, 0];
  };

  function initModel(index) {
    modelLoaded = false;
    document.getElementById('sketch').classList.add('loading');
    
    if (model) {
      model.dispose();
    }
    
    model = new ms.SketchRNN(`${BASE_URL}${availableModels[index]}.gen.json`);
    model.initialize().then(() => {
      modelLoaded = true;
      document.getElementById('sketch').classList.remove('loading');
      console.log(`🤖${availableModels[index]} loaded.`);
      model.setPixelFactor(5.0);  // Bigger -> large outputs
    });
  };

  function encodeStrokes(sequence) {
    if (sequence.length <= 5) {
      return;
    }

    let newState = model.zeroState();
    newState = model.update(model.zeroInput(), newState);
    newState = model.updateStrokes(sequence, newState, sequence.length-1);

    modelState = model.copyState(newState);
    
    const lastHumanLine = lastHumanDrawing[lastHumanDrawing.length-1];
    x = lastHumanLine[0];
    y = lastHumanLine[1];

    const s = sequence[sequence.length-1];
    dx = s[0];
    dy = s[1];
    previousPen = [s[2], s[3], s[4]];

    lastModelDrawing = [];
    modelIsActive = true;
  }
  
  const COLORS = [
    { name: 'black', hex: '#000000'},
    { name: 'red', hex: '#f44336'},
    { name: 'pink', hex: '#E91E63'},
    { name: 'purple', hex: '#9C27B0'},
    { name: 'deeppurple', hex: '#673AB7'},
    { name: 'indigo', hex: '#3F51B5'},
    { name: 'blue', hex: '#2196F3'},
    { name: 'cyan', hex: '#00BCD4'},
    { name: 'teal', hex: '#009688'},
    { name: 'green', hex: '#4CAF50'},
    { name: 'lightgreen', hex: '#8BC34A'},
    { name: 'lime', hex: '#CDDC39'},
    { name: 'yellow', hex: '#FFEB3B'},
    { name: 'amber', hex: '#FFC107'},
    { name: 'orange', hex: '#FF9800'},
    { name: 'deeporange', hex: '#FF5722'},
    { name: 'brown', hex: '#795548'},
    { name: 'grey', hex: '#9E9E9E'}
  ];
  
  function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)].hex
  }
  function randomColorIndex() {
    return Math.floor(Math.random() * COLORS.length);
  }
  p.updateCurrentColor = function(index) {
    currentColor = COLORS[index].hex;
  }

};

const p5Sketch = new p5(sketch, 'sketch');
function changeColor(event){
  const btn = event.target;
  p5Sketch.updateCurrentColor(btn.dataset.index);
  document.querySelector('.active').classList.remove('active');
  btn.classList.add('active');
}


window.addEventListener("DOMContentLoaded", () => {
  
  function initModel(index) {
    modelLoaded = false;
    document.getElementById('sketch').classList.add('loading');
    
    if (model) {
      model.dispose();
    }
    
    model = new ms.SketchRNN(`${BASE_URL}${availableModels[index]}.gen.json`);
    model.initialize().then(() => {
      modelLoaded = true;
      document.getElementById('sketch').classList.remove('loading');
      console.log(`🤖${availableModels[index]} loaded.`);
      model.setPixelFactor(5.0);
  };
  
  const DEBUGSPEECH = true;
  const result = document.getElementById("result");
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (typeof SpeechRecognition !== "undefined") {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = function(event) {

      var hasFinal = false;
      for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal)
          hasFinal = true;
        else {
          console.log(event.results[i])
          result.innerHTML = event.results[i][0].transcript;
          for (const m of availableModels) {
            if (result.innerHTML.split(' ').includes(m)) {
              selectModels.selectedIndex = availableModels.findIndex(mod => mod === m);
              initModel(selectModels.selectedIndex);
            }
          }
        }
      }


    };
    
    recognition.onend = function(event) {
      setTimeout(function() {
        if (DEBUGSPEECH)
          result.innerHTML = "";
        recognition.start();
      }, 1000);
    };
    
    recognition.start();
    }
});