
import { scrollTo, scrollLeft, scrollTop } from 'appgine/closure';


export default function createTargetScroll(toTarget) {
	if (toTarget.indexOf('_this')===0 && toTarget.indexOf('#')>0) {
		const [, hash] = toTarget.split('#');
		const $element = hash && document.getElementById(hash);
		const boundsElement = $element && $element.getBoundingClientRect();

		return function() {
			const $found = hash && document.getElementById(hash);

			if ($element && $found) {
				const boundsFound = $found.getBoundingClientRect();

				scrollTo(
					scrollLeft()-boundsElement.left+boundsFound.left,
					scrollTop()-boundsElement.top+boundsFound.top
				);
			}
		}

	} else if (toTarget.indexOf('_this')===0) {
		return function() {}
	}

	return 0;
}
