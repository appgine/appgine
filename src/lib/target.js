

export function getEventTarget(e) {
	if (e && (e.metaKey || e.ctrlKey)) {
		return '_blank';
	}

	return '';
}


export function getElementTarget($element) {
	if (!$element) {
		return '';

	} else if ($element.getAttribute('target')) {
		return $element.getAttribute('target');

	} else if ($element.getAttribute('formtarget')) {
		return $element.getAttribute('formtarget');

	} else if ($element.getAttribute('data-target')) {
		return $element.getAttribute('data-target');

	} else if ($element.hasAttribute('data-ajax') || $element.hasAttribute('data-target-ajax')) {
		return '_ajax';

	} else if ($element.hasAttribute('data-target-current')) {
		return '_current';

	} else if ($element.hasAttribute('data-target-same')) {
		return '_this' + String($element.getAttribute('data-target-same')||'');
	}

	return '';
}
