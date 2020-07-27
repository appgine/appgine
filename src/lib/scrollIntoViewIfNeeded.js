
import closure from 'appgine/closure'


export default function scrollIntoViewIfNeeded($element, animated, onEnd) {
	const $scrollElement = closure.getDocumentScrollElement();

	function withinBounds(value, min, max, extent) {
		if (max <= value + extent && value <= min + extent) {
			return Math.max(0, Math.min(max, Math.max(min, value)));
		} else {
			return Math.max(0, (min + max) / 2);
		}
	}

	function makeArea(left, top, width, height) {
		return  {
			left, top, width, height,
			right: left+width,
			bottom: top+height,
			translate(x, y) {
				return makeArea(x + left, y + top, width, height);
			},
			relativeFromTo(lhs, rhs) {
				let newLeft = left, newTop = top;
				lhs = lhs.offsetParent;
				rhs = rhs.offsetParent;
				if (lhs === rhs) {
					return area;
				}
				for (; lhs; lhs = lhs.offsetParent) {
					newLeft += lhs.offsetLeft + lhs.clientLeft;
					newTop += lhs.offsetTop + lhs.clientTop;
				}
				for (; rhs; rhs = rhs.offsetParent) {
					newLeft -= rhs.offsetLeft + rhs.clientLeft;
					newTop -= rhs.offsetTop + rhs.clientTop;
				}
				return makeArea(newLeft, newTop, width, height);
			},
		}
	}

	let scrollable = false;
	function scrollElementIfNeed($element, area, onEnd) {
		const $parent = $element.parentNode;

		if (!$parent instanceof HTMLElement) {
			return onEnd();

		} else if ($parent===$scrollElement) {
			return onEnd();
		}

		const clientLeft = $parent.offsetLeft + $parent.clientLeft;
		const clientTop = $parent.offsetTop + $parent.clientTop;

		// Make area relative to $parent's client area.
		area = area.
			relativeFromTo($element, $parent).
			translate(-clientLeft, -clientTop);

		const scrollLeft = withinBounds(
			$parent.scrollLeft,
			area.right - $parent.clientWidth, area.left,
			$parent.clientWidth
		);

		const scrollTop = withinBounds(
			$parent.scrollTop,
			area.bottom - $parent.clientHeight, area.top,
			$parent.clientHeight
		);

		function scrollParentIfNeed() {
			// Determine actual scroll amount by reading back scroll properties.
			scrollElementIfNeed($parent, area.translate(
				clientLeft - $parent.scrollLeft,
				clientTop - $parent.scrollTop
			), onEnd);
		}

		if ($parent.scrollWidth>$parent.clientWidth && $parent.scrollWidth>$parent.clientWidth) {
			scrollable = true;

			if (scrollTop!==$parent.scrollTop || scrollLeft!==$parent.scrollLeft) {
				if (animated) {
					return closure.animation.scrollElementTo(
						$parent,
						$parent.scrollLeft, $parent.scrollTop,
						scrollLeft, scrollTop,
						() => setTimeout(scrollParentIfNeed, 100)
					);

				} else {
					$parent.scrollTop = scrollTop;
					$parent.scrollLeft = scrollLeft;
				}
			}
		}

		return scrollParentIfNeed();
	}

	const area = makeArea(
		$element.offsetLeft, $element.offsetTop,
		$element.offsetWidth, $element.offsetHeight
	);

	scrollElementIfNeed($element, area, function() {
		onEnd(scrollable);
	});
}
