export default class Gestures {
	static UP = 0
	static RIGHT = 1
	static DOWN = 2
	static LEFT = 3

	static HIGHFIVE = 4
	static TWOFINGERPOINTLEFT = 5
	static TWOFINGERPOINTRIGHT = 6
	static NONE = null

	constructor() { }

	static isInOrder(nums) {
		for (let i = 0; i < nums.length - 1; i++) {
			if (nums[i] > nums[i + 1]) {
				return false;
			}
		}
		return true;
	}

	static slopesBetween(points) {
		return points.slice(0, points.length - 1).map(
			(p, i) =>
			// rise over run (change in Y / change in X)
			(points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0])
		);
	}

	static slopeBetween(points) {
		return Gestures.slopesBetween([points[0], points[points.length - 1]])[0];
	}

	static isHorizontalish(points) {
		let slope = Gestures.slopeBetween(points);
		return -1 < slope && slope < 1
	}

	static isVerticalish(points) {
		return !Gestures.isHorizontalish(points);
	}

	static isApproximatelyEqual(a, b, error = 0.25) {
		if( a < 0 && b < 0 ) {
			return (1-error) * Math.min(a, b) >= Math.max(a, b)
		} else {
			return (1-error) * Math.max(a, b) <= Math.min(a, b)
		}
	}

	static isParallelishToScreen(points) {
		let zs = points.map((p) => p[2]);
		return Gestures.isApproximatelyEqual(Math.max(zs), Math.min(zs));
	}

	static isStraightish(points) {
		let slopes = Gestures.slopesBetween(points);
		if( slopes.length == 0 ) {
			console.log(points)
		}
		let avg = slopes.reduce( (x, y) => x+y, 0 ) / slopes.length
		for (let i = 0; i < slopes.length; i++) {
			// currently the wiggle rooom for straightish is .3 = 30%
			if (!Gestures.isApproximatelyEqual(avg, slopes[i], 2)) {
				return false;
			}
		}
		return true;
	}

	static isRightish(points, quick = false) {
		return (
			(quick || (Gestures.isHorizontalish(points) && Gestures.isStraightish(points))) &&
			Gestures.isInOrder(points.map((x) => x[0]))
		);
	}

	static isLeftish(points, quick = false) {
		return (
			(quick || (Gestures.isHorizontalish(points) && Gestures.isStraightish(points))) &&
			!Gestures.isRightish(points, true)
		);
	}

	static isDownish(points, quick = false) {
		return (
			(quick || (Gestures.isVerticalish(points) && Gestures.isStraightish(points))) &&
			Gestures.isInOrder(points.map((x) => x[1]))
		);
	}

	static isUpish(points, quick = false) {
		return (
			(quick || (Gestures.isVerticalish(points) && Gestures.isStraightish(points))) &&
			!Gestures.isDownish(points, true)
		);
	}

	static isHighFive(hand, quick = false) {
		return (
			(quick || (Gestures.isParallelishToScreen(hand.landmarks) && Gestures.isUpish(hand.annotations.indexFinger))) &&
			Gestures.isUpish(hand.annotations.middleFinger) &&
			Gestures.isUpish(hand.annotations.ringFinger) &&
			Gestures.isUpish(hand.annotations.pinky)
		);
	}

	// we're thinking to use this for "skip"
	static isTwoFingerPointRight(hand, quick = false) {
		return (
			(quick || (Gestures.isParallelishToScreen(hand.landmarks) && Gestures.isRightish(hand.annotations.indexFinger))) &&
			Gestures.isRightish(hand.annotations.middleFinger) &&
			!Gestures.isStraightish(hand.annotations.ringFinger) &&
			!Gestures.isStraightish(hand.annotations.pinky)
		);
	}

	// we're thinking to use this for "skip back"
	static isTwoFingerPointLeft(hand, quick = false) {
		return (
			(quick || (Gestures.isParallelishToScreen(hand.landmarks) && Gestures.isLeftish(hand.annotations.indexFinger))) &&
			Gestures.isLeftish(hand.annotations.middleFinger) &&
			!Gestures.isStraightish(hand.annotations.ringFinger) &&
			!Gestures.isStraightish(hand.annotations.pinky)
		);
	}

	static orientation(points) {
		if( !Gestures.isStraightish(points) ) {
			return null; // no orientation to speak of
		} else if( Gestures.isHorizontalish(points) ) {
			return Gestures.isRightish(points, true) ? Gestures.RIGHT : Gestures.LEFT
		} else {
			return Gestures.isUpish(points, true) ? Gestures.UP : Gestures.DOWN
		}
	}

	static readGesture(hand) {
		let currentDate = new Date();
		let time = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
		console.log(time);
		switch(Gestures.orientation(hand.annotations.indexFinger) ) {
			case Gestures.UP:
				return Gestures.isHighFive(hand, true) ? Gestures.HIGHFIVE : Gestures.NONE;
			case Gestures.RIGHT:
				return Gestures.isTwoFingerPointLeft(hand, true) ? Gestures.TWOFINGERPOINTLEFT : Gestures.NONE;
			case Gestures.LEFT:
				return Gestures.isTwoFingerPointRight(hand, true) ? Gestures.TWOFINGERPOINTRIGHT: Gestures.NONE;
			default:
				return Gestures.NONE;
		}
	}

	static debug(hand) {
		let points = [
			['landmarks',			hand.landmarks],
			['thumb',					hand.annotations.thumb],
			['indexFinger',		hand.annotations.indexFinger],
			['middleFinger',	hand.annotations.middleFinger],
			['ringFinger',		hand.annotations.ringFinger],
			['pinky',					hand.annotations.pinky],
			['palmBase',			hand.annotations.palmBase],
		];
		let funcs = [
			['down',			Gestures.isDownish],
			['hor',				Gestures.isHorizontalish],
			['left',			Gestures.isLeftish],
			['par',				Gestures.isParallelishToScreen],
			['right',			Gestures.isRightish],
			['straight',	Gestures.isStraightish],
			['up',				Gestures.isUpish],
			['ver',				Gestures.isVerticalish],
		];
		let result = {};
		for (let i = 0; i < points.length; i++) {
			result[points[i][0]] = funcs.filter(
				([name, func]) => func(points[i][1])
			).map(
				([name, func]) => name
			).sort().reduce(
				(x, y) => { return `${x} ${y}` },
				''
			);
		}
		console.table(result);
	}

}
