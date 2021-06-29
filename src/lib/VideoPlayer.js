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
    this.init();
  }

  createPlayButton(sketch) {
    let playButton = sketch.createButton("Play");
    playButton.mousePressed(() => {
      this.video.play();
    });
  }

  createPauseButton(sketch) {
    let pauseButton = sketch.createButton("Pause");
    pauseButton.mousePressed(() => {
      this.video.pause();
    });
  }

  createPlayPauseButton(sketch) {
    let playPauseButton = sketch.createButton("Play/Pause");
    playPauseButton.mousePressed(() => {
      this.togglePlayPause();
    });
  }

  togglePlayPause() {
    if (this.video.elt.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
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

      sketch.setup = () => {
        canvas = sketch.createCanvas(640, 480);

        if (this.debugMode) {
          //this.createPlayButton(sketch);
          //this.createPauseButton(sketch);
          this.createPlayPauseButton(sketch);
        }
        
        this.video = sketch.createVideo(
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          () => {
            console.log("video loaded");
          }
        );
        this.video.size(sketch.width, (sketch.width * 9) / 16);
        this.video.parent(this.container);
        this.video.volume(0);
        this.video.attribute("controls", true);
        
        webcam = sketch.createCapture(sketch.VIDEO);
        webcam.hide();

        handpose = ml5.handpose(
          webcam,
          {
            flipHorizontal: true
          },
					() => console.log('ml5 loaded')
        );

        // This sets up an event that fills the global variable "predictions"
        // with an array every time new hand poses are detected
        handpose.on("predict", (results) => {
          this.predictions = results;
        });

        canvas.parent(this.container);
      };

      sketch.draw = () => {
        sketch.clear();
        // sketch.background(0);

        if (this.debugMode) {
          // sketch.image(webcam, 0, 0, sketch.width, sketch.height);
          this.drawKeypoints(sketch, this.predictions);
        }
      };
    };

    new p5(s);
  }

  // A function to draw ellipses over the detected keypoints
  drawKeypoints(sketch, predictions) {
    for (let i = 0; i < predictions.length; i += 1) {
      const prediction = predictions[i];
			switch(Gestures.readGesture(prediction) ) {
        case Gestures.HIGHFIVE:
          if(!this.highFiveCooldown.flag){
            this.highFiveCooldown.flag = true;
            this.togglePlayPause();
            this.resetHighFiveCooldown();
          } else {
            clearTimeout(this.highFiveCooldown.timeout);
            this.resetHighFiveCooldown();

          }
					console.log('5')
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

      // let isHighFive = this.isHighFive(prediction);

      // sketch.text(isHighFive ? "HighFive" : "Not HighFive", 100, 100);

      // let oy = 100;
      // for (let k of Object.keys(prediction.annotations)) {
      //   sketch.fill(0);
      //   sketch.text(
      //     `${k}: [${prediction.annotations[k][0]}, ${prediction.annotations[k][1]}]`,
      //     100,
      //     oy
      //   );
      //   oy += 20;
      // }

      // let thumbDistanceFromPalm = sketch.dist(
      //   prediction.annotations["palmBase"][0][0],
      //   prediction.annotations["palmBase"][0][1],
      //   prediction.annotations["thumb"][3][0],
      //   prediction.annotations["thumb"][3][1]
      // );
      // sketch.fill(0);
      // sketch.text(thumbDistanceFromPalm, 100, 300);
      // console.log(prediction.annotations["palmBase"]);

      for (let k of Object.keys(prediction.annotations)) {
        sketch.push();
        sketch.beginShape();
        for (let f of prediction.annotations[k]) {
          sketch.vertex(f[0], f[1]);
          sketch.circle(f[0], f[1], 5);
        }
        sketch.endShape();
        sketch.pop();
      }

      // for (let j = 0; j < prediction.landmarks.length; j += 1) {
      //   const keypoint = prediction.landmarks[j];
      //   sketch.fill(0, 255, 0);
      //   sketch.noStroke();
      //   sketch.ellipse(keypoint[0], keypoint[1], 10, 10);
      // }
    }
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
