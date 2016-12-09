
export default function loadHtml($element) {
	if ($element.querySelector) {
		const $title = $element.querySelector('title');
		return $title && $title.textContent || '';
	}

	return '';
}
