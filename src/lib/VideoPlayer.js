import p5 from "p5";
import ml5 from "ml5";
import Gestures from './Gestures.js';

export default class VideoPlayer {
  constructor(container) {
    this.container = container;
    this.debugMode = true;
    this.predictions = [];
    this.highFiveCooldown = {
      flag: false,
      timing: 500,
      timeout: null
    };
    this.intervalFwd = null,
    this.intervalRwd = null,
    this.init();
  }

  createPlayPauseButton(sketch) {
    const playPauseButton = sketch.createButton("Play/Pause");
    playPauseButton.parent(sketch.select('#debug-container'))
    playPauseButton.mousePressed(() => {
      this.togglePlayPause();
    });
  }

  createSkipAheadButton(sketch) {
    const skipAheadButton = sketch.createButton("Skip >> 10s");
    skipAheadButton.parent(sketch.select('#debug-container'))
    skipAheadButton.mousePressed(() => {
      this.skipAhead();
    });
  }

  createSkipBackButton(sketch) {
    const skipBackButton = sketch.createButton("Skip << 10s");
    skipBackButton.parent(sketch.select('#debug-container'))
    skipBackButton.mousePressed(() => {
      this.skipBack();
    });
  }

  togglePlayPause() {
    if (this.video.elt.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
  }

  skipBack(time = 10) {
    this.video.elt.currentTime -= time;
  }

  skipAhead(time = 10) {
    this.video.elt.currentTime += time;
  }

  detectHighFive() {
    console.log("I see a high five");
  }

  resetHighFiveCooldown() {
    this.highFiveCooldown.timeout = setTimeout(() => {
      this.highFiveCooldown.flag = false;
    }, this.highFiveCooldown.timing);
  }

  init() {
    const s = (sketch) => {
      let canvas;
      let webcam;
      let handpose;
      let debugContainer = document.querySelector('#debug-container')
      let readyState = 0
      let statusText = "status:"

      sketch.setup = () => {
        canvas = sketch.createCanvas(320, 240);

        statusText += "\n- loading video"
        this.video = sketch.createVideo(
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          () => {
            console.log("video loaded");
            statusText += "\n- video loaded"
          }
        );
        this.video.parent(this.container);
        this.video.volume(0);
        // this.video.attribute("controls", true);
        webcam = sketch.createCapture(sketch.VIDEO);
        webcam.size(sketch.width, sketch.height)
        webcam.parent(debugContainer)
        webcam.hide();

        statusText += "\n- loading ml5"
        handpose = ml5.handpose(
          webcam,
          {
            flipHorizontal: true,
            maxContinuousChecks: 5
          },
          () => {
            console.log('ml5 loaded')
            statusText += "\n- ml5 loaded"
          }
        );

        // This sets up an event that fills the global variable "predictions"
        // with an array every time new hand poses are detected
        handpose.on("predict", (results) => {
          readyState = 1
          if(results.length > 0) {
            console.log('ready')
            statusText += "\nready"
            readyState = 2
            this.predictions = results;
          }
        });

        canvas.parent(debugContainer);
        canvas.position(100, 100)

        if (this.debugMode) {
          this.createPlayPauseButton(sketch);
          this.createSkipBackButton(sketch);
          this.createSkipAheadButton(sketch);
        }
      };

      sketch.draw = () => {
        // sketch.clear();
        sketch.background(200);

        if (readyState == 0) {
          sketch.text(statusText, 50, sketch.height / 2)
        } else if(readyState > 0) {
          sketch.push()
          sketch.translate(webcam.width, 0)
          sketch.scale(-1.0, 1.0)
          sketch.image(webcam, 0 , 0, sketch.width, sketch.height);
          sketch.pop()

          if(readyState > 1) {
            this.drawKeypoints(sketch, this.predictions);
          }
        }
      };
    };

    new p5(s);
  }

  // A function to draw ellipses over the detected keypoints
  drawKeypoints(sketch, predictions) {
    for (let i = 0; i < predictions.length; i += 1) {
      const prediction = predictions[i];
      this.startClassify(prediction)

      this.drawHand(sketch, prediction.annotations)
    }
  }

  startClassify(prediction) {
    switch (Gestures.readGesture(prediction)) {
      case Gestures.HIGHFIVE:
        if(!this.highFiveCooldown.flag){
            this.highFiveCooldown.flag = true;
            this.togglePlayPause();
            this.resetHighFiveCooldown();
          } else {
            clearTimeout(this.highFiveCooldown.timeout);
            this.resetHighFiveCooldown();

          }console.log('5')
        break;;
      case Gestures.TWOFINGERPOINTLEFT:
        console.log('<<')
        break;;
      case Gestures.TWOFINGERPOINTRIGHT:
        console.log('>>')
        break;;
      case Gestures.NONE:
        console.log('no gesture')
        Gestures.debug(prediction);
        break;;
    }
  }

  drawHand(sketch, annotations) {
    for (let k of Object.keys(annotations)) {
      sketch.push();
      sketch.beginShape();
      sketch.noFill();
      sketch.stroke(0, 255, 0);
      sketch.strokeWeight(5);
      for (let f of annotations[k]) {
        sketch.vertex(f[0] * (sketch.width / 640) + (sketch.width / 2), f[1] * (sketch.height / 480));
        sketch.circle(f[0] * (sketch.width / 640) + (sketch.width / 2), f[1] * (sketch.height / 480), 5);
      }
      sketch.endShape();
      sketch.pop();
    }
  }

  ready() {

  }

  setDebugMode(state) {
    this.debugMode = state;
  }
}

/*
export const MESH_ANNOTATIONS: {[key: string]: number[]} = {
  thumb: [1, 2, 3, 4],
  indexFinger: [5, 6, 7, 8],
  middleFinger: [9, 10, 11, 12],
  ringFinger: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
  palmBase: [0]
};
*/
