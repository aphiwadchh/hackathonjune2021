import p5 from "p5";
import ml5 from "ml5";

export default class VideoPlayer {
  constructor(container) {
    this.container = container;
    this.debugMode = true;
    this.init();
  }

  init() {
    const s = (sketch) => {
      let canvas;
      let webcam;
      let handpose;

      sketch.setup = () => {
        canvas = sketch.createCanvas(640, 480);
        canvas.parent(this.container);

        webcam = sketch.createCapture(sketch.VIDEO);
        webcam.hide();

        handpose = ml5.handpose(webcam, () => {
          console.log("ml5 loaded");
        });
      };

      sketch.draw = () => {
        sketch.background(0);

        if (this.debugMode) {
          sketch.image(webcam, 0, 0, sketch.width, sketch.height);
        }
      };
    };

    new p5(s);
  }

  setDebugMode(state) {
    this.debugMode = state;
  }
}
