import p5 from "p5";
import ml5 from "ml5";

export default class VideoPlayer {
  constructor(container) {
    this.container = container;
    this.debugMode = true;
    this.predictions = [];
    this.video = null;
    this.init();
  }

  init() {
    const s = (sketch) => {
      let canvas;
      let webcam;
      let handpose;

      sketch.setup = () => {
        canvas = sketch.createCanvas(640, 480);

        this.video = sketch.createVideo(
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          () => {
            console.log("video loaded");
          }
        );
        this.video.size(sketch.width, sketch.height);
        this.video.parent(this.container);
        //this.video.masterVolume(0.0, [rampTime], [timeFromNow])
        this.video.attribute("controls", true);

        webcam = sketch.createCapture(sketch.VIDEO);
        webcam.hide();

        handpose = ml5.handpose(webcam, () => {
          console.log("ml5 loaded");
        });

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
      for (let j = 0; j < prediction.landmarks.length; j += 1) {
        const keypoint = prediction.landmarks[j];
        sketch.fill(0, 255, 0);
        sketch.noStroke();
        sketch.ellipse(keypoint[0], keypoint[1], 10, 10);
      }
    }
  }

  setDebugMode(state) {
    this.debugMode = state;
  }
}
