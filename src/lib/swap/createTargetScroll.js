
import { scrollOffset } from 'appgine/hooks/window'


export default function createTargetScroll(toTarget) {
	if (toTarget.indexOf('_this')===0 && toTarget.indexOf('#')>0) {
		const [, hash] = toTarget.split('#');
		const $element = hash && document.getElementById(hash);
		const boundsElement = $element && $element.getBoundingClientRect();

		return function() {
			const $found = hash && document.getElementById(hash);

			if ($element && $found) {
				const boundsFound = $found.getBoundingClientRect();
				scrollOffset(boundsFound.left-boundsElement.left, boundsFound.top-boundsElement.top);
			}
		}

	} else if (toTarget.indexOf('_this')===0) {
		return function() {}
	}

	return 0;
}
