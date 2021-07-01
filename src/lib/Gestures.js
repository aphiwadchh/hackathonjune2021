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
			(p, i) => [
				// rise over run (change in Y / change in X)
				(points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]),
				// rise over run (change in Z / change in X)
				(points[i + 1][2] - points[i][2]) / (points[i + 1][0] - points[i][0])
			]
		);
	}

	static slopeBetween(points) {
		let slopes = Gestures.slopesBetween(points);
		// average the slopes
		return [
			slopes.map( ([y, z]) => y).reduce( (a, b) => a+b) / slopes.length,
			slopes.map( ([y, z]) => z).reduce( (a, b) => a+b) / slopes.length,
		]
	}

	static isHorizontalish(points, palmbase) {
		let [y, z] = Gestures.slopeBetween(points);
		return -1 < y && y < 1
	}

	static isVerticalish(points, palmbase) {
		return !Gestures.isHorizontalish(points, palmbase);
	}

	static isApproximatelyEqual(a, b, error = 0.25) {
		if( a < 0 && b < 0 ) {
			return (1-error) * Math.min(a, b) >= Math.max(a, b)
		} else {
			return (1-error) * Math.max(a, b) <= Math.min(a, b)
		}
	}

	static isParallelishToScreen(points) {
		// the slope of the z-index between the furthest extremes
		return Math.abs(Gestures.slopeBetween([
			points.reduce( ([x,y,z], [x2, y2, z2]) => z <= z2 ? [x, y, z] : [x2, y2, z2] ), // min z-index
			points.reduce( ([x,y,z], [x2, y2, z2]) => z >= z2 ? [x, y, z] : [x2, y2, z2] )  // max z-index
		])[1]) < 0.4
	}

	static isStraightish(points, palmbase) {
		const fingertip_index = 3;
		let straight = false;
		const furthestFingerPoint = points.reduce(function(result, item, index){
			return Gestures.maxDistance(result, item, palmbase[0], index);
		}, {distance: 0, index: 0});
		if(furthestFingerPoint.index === fingertip_index) {
			straight = true;
		}
		return straight;
		/*let slopes = Gestures.slopesBetween(points)
		return true
		return Math.abs(slopes[slopes.length-1][0] - slopes[0][0]) < 1 */
	}

	static calcDistance(fingerpoint, palmbase) {
		return (Math.sqrt(
			Math.pow((palmbase[0] - fingerpoint[0]), 2) +
			Math.pow((palmbase[1] - fingerpoint[1]), 2) +
			Math.pow((palmbase[2] - fingerpoint[2]), 2)
		  ));
	}

	static maxDistance (result = {distance: 0, index: 0}, fingerpoint, palmbase, index) {

		const pointDistance = Gestures.calcDistance(fingerpoint, palmbase);
		if(result.distance < pointDistance){
		  result.distance = pointDistance;
		  result.index = index;
		} 
		return result;
	  }

	static isCrookedish(points, palmbase) {
		return true
		return !Gestures.isStraightish(points, palmbase)
	}

	static isRightish(points, palmbase, quick = false) {
		return (
			(quick || (Gestures.isHorizontalish(points, palmbase) && Gestures.isStraightish(points, palmbase))) &&
			Gestures.isInOrder(points.map((x) => x[0]))
		);
	}

	static isLeftish(points, palmbase, quick = false) {
		return (
			(quick || (Gestures.isHorizontalish(points, palmbase) && Gestures.isStraightish(points, palmbase))) &&
			!Gestures.isRightish(points, palmbase, true)
		);
	}

	static isDownish(points, palmbase, quick = false) {
		return (
			(quick || (Gestures.isVerticalish(points, palmbase) && Gestures.isStraightish(points, palmbase))) &&
			Gestures.isInOrder(points.map((x) => x[1]))
		);
	}

	static isUpish(points, palmbase, quick = false) {
		return (
			(quick || (Gestures.isVerticalish(points, palmbase) && Gestures.isStraightish(points, palmbase))) &&
			!Gestures.isDownish(points, palmbase, true)
		);
	}

	static isHighFive(hand, quick = false) {
		return (
			(quick || (Gestures.isParallelishToScreen(hand.landmarks) && Gestures.isUpish(hand.annotations.indexFinger, hand.annotations.palmBase))) &&
			Gestures.isUpish(hand.annotations.middleFinger, hand.annotations.palmBase) &&
			Gestures.isUpish(hand.annotations.ringFinger, hand.annotations.palmBase) &&
			Gestures.isUpish(hand.annotations.pinky, hand.annotations.palmBase)
		);
	}

	// we're thinking to use this for "skip"
	static isTwoFingerPointRight(hand, quick = false) {
		return (
			(quick || (Gestures.isParallelishToScreen(hand.landmarks) && Gestures.isRightish(hand.annotations.indexFinger, hand.annotations.palmBase))) &&
			Gestures.isRightish(hand.annotations.middleFinger, hand.annotations.palmBase) &&
			!Gestures.isStraightish(hand.annotations.ringFinger, hand.annotations.palmBase) &&
			!Gestures.isStraightish(hand.annotations.pinky, hand.annotations.palmBase)
		);
	}

	// we're thinking to use this for "skip back"
	static isTwoFingerPointLeft(hand, quick = false) {
		return (
			(quick || (Gestures.isParallelishToScreen(hand.landmarks) && Gestures.isLeftish(hand.annotations.indexFinger, hand.annotations.palmBase))) &&
			Gestures.isLeftish(hand.annotations.middleFinger, hand.annotations.palmBase) &&
			!Gestures.isStraightish(hand.annotations.ringFinger, hand.annotations.palmBase) &&
			!Gestures.isStraightish(hand.annotations.pinky, hand.annotations.palmBase)
		);
	}

	static orientation(points, palmbase) {
		if( !Gestures.isStraightish(points, palmbase) ) {
			return null; // no orientation to speak of
		} else if( Gestures.isHorizontalish(points, palmbase) ) {
			return Gestures.isRightish(points, palmbase,  true) ? Gestures.RIGHT : Gestures.LEFT
		} else {
			return Gestures.isUpish(points, palmbase, true) ? Gestures.UP : Gestures.DOWN
		}
		return Gestures.NONE
	}

	static readGesture(hand) {
		if( ! Gestures.isParallelishToScreen(hand.landmarks) ) {
			console.log('not parallel')
			return Gestures.NONE
		}
        switch(Gestures.orientation(hand.annotations.indexFinger, hand.annotations.palmBase) ) {
			case Gestures.UP:
				return Gestures.isHighFive(hand, true) ? Gestures.HIGHFIVE : Gestures.NONE;
			case Gestures.RIGHT:
				return Gestures.isTwoFingerPointRight(hand, true) ? Gestures.TWOFINGERPOINTRIGHT : Gestures.NONE;
			case Gestures.LEFT:
				return Gestures.isTwoFingerPointLeft(hand, true) ? Gestures.TWOFINGERPOINTLEFT: Gestures.NONE;
			default:
				return Gestures.NONE;
		}
	}

	static debug(hand) {
		let points = [
			//['landmarks',			hand.landmarks],
			['thumb',					hand.annotations.thumb],
			['indexFinger',		hand.annotations.indexFinger],
			['middleFinger',	hand.annotations.middleFinger],
			['ringFinger',		hand.annotations.ringFinger],
			['pinky',					hand.annotations.pinky],
			//['palmBase',			hand.annotations.palmBase],
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
				([name, func]) => func(points[i][1], hand.annotations.palmBase)
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
