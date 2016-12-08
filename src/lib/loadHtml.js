
const re = /<(\s*\/\s*script\s*>)/ig;

export default function loadHtml($element) {
	let html = '';
	if ($element.querySelectorAll) {
		html = $element.outerHTML;
		Array.from($element.querySelectorAll('script')).
			filter($script => re.test(String($script.textContent))).
			forEach($script => html = html.replace($script.textContent, content => content.replace(re, '__END_SCRIPT_TAG__$1')));
	}

	return html;
}
