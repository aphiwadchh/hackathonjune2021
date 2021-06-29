export default class Gestures {
	constructor() { }

	isInOrder(nums) {
		for (let i = 0; i < nums.length - 1; i++) {
			if (nums[i] > nums[i + 1]) {
				return false;
			}
		}
		return true;
	}

	slopesBetween(points) {
		return points.slice(0, points.length - 1).map(
			(p, i) =>
			// rise over run (change in Y / change in X)
			(points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0])
		);
	}

	slopeBetween(points) {
		return this.slopesBetween([points[0], points[points.length - 1]])[0];
	}

	isHorizontalish(points) {
		let slope = this.slopeBetween(points);
		return -1 < slope && slope < 1
	}

	isVerticalish(points) {
		return !this.isHorizontalish(points);
	}

	isApproximatelyEqual(a, b, error = 0.25) {
		if( a < 0 && b < 0 ) {
			return (1-error) * Math.min(a, b) >= Math.max(a, b)
		} else {
			return (1-error) * Math.max(a, b) <= Math.min(a, b)
		}
	}

	isParallelishToScreen(points) {
		let zs = points.map((p) => p[2]);
		return this.isApproximatelyEqual(Math.max(zs), Math.max(zs));
	}

	isStraightish(points) {
		let slopes = this.slopesBetween(points);
		let avg = slopes.reduce( (x, y) => x+y ) / slopes.length
		for (let i = 0; i < slopes.length; i++) {
			// currently the wiggle rooom for straightish is .3 = 30%
			if (!this.isApproximatelyEqual(avg, slopes[i], 0.3)) {
				return false;
			}
		}
		return true;
	}

	isRightish(points, quick = false) {
		return (
			(quick || (this.isHorizontalish(points) && this.isStraightish(points))) &&
			this.isInOrder(points.map((x) => x[0]))
		);
	}

	isLeftish(points, quick = false) {
		return (
			(quick || (this.isHorizontalish(points) && this.isStraightish(points))) &&
			!this.isRightish(points, true)
		);
	}

	isUpish(points, quick = false) {
		return (
			(quick || (this.isVerticalish(points) && this.isStraightish(points))) &&
			this.isInOrder(points.map((x) => x[1]))
		);
	}

	isDownish(points, quick = false) {
		return (
			(quick || (this.isVerticalish(points) && this.isStraightish(points))) &&
			!this.isUpish(points, true)
		);
	}

	isHighFive(hand) {
		return (
			this.isParallelishToScreen(hand.landmarks) &&
			this.isUpish(hand.annotations.indexFinger) &&
			this.isUpish(hand.annotations.middleFinger) &&
			this.isUpish(hand.annotations.ringFinger) &&
			this.isUpish(hand.annotations.pinky)
		);
	}

	// we're thinking to use this for "skip"
	isTwoFingerPointRight(hand) {
		return (
			this.isParallelishToScreen(hand.landmarks) &&
			this.isRightish(hand.annotations.indexFinger) &&
			this.isRightish(hand.annotations.middleFinger) &&
			!this.isStraightish(hand.annotations.ringFinger) &&
			!this.isStraightish(hand.annotations.pinky)
		);
	}

	// we're thinking to use this for "skip back"
	isTwoFingerPointLeft(hand) {
		return (
			this.isParallelishToScreen(hand.landmarks) &&
			this.isLeftish(hand.annotations.indexFinger) &&
			this.isLeftish(hand.annotations.middleFinger) &&
			!this.isStraightish(hand.annotations.ringFinger) &&
			!this.isStraightish(hand.annotations.pinky)
		);
	}

	debug(hand) {
		let points = [
			["landmarks", hand.landmarks],
			["thumb", hand.annotations.thumb],
			["indexFinger", hand.annotations.indexFinger],
			["middleFinger", hand.annotations.middleFinger],
			["ringFinger", hand.annotations.ringFinger],
			["pinky", hand.annotations.pinky],
			["palmBase", hand.annotations.palmBase]
		];
		let funcs = [
			["straight", this.isStraightish],
			["right", this.isRightish],
			["left", this.isLeftish],
			["up", this.isUpish],
			["down", this.isDownish],
			["hor", this.isHorizontalish],
			["ver", this.isVerticalish],
			["par", this.isParallelishToScreen]
		];
		let result = {};
		for (let i = 0; i < points.length; i++) {
			result[points[i][0]] = funcs
				.filter((x) => x[1](points[i][1]))
				.map((x) => x[0])
				.reduce((x, y) => `{x} {y}`);
		}
		console.table(result);
	}

}
