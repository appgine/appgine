
import { bindContext } from 'appgine/hooks'
import { useDestroy } from 'appgine/hooks/destroy'


export function bindHtmlContent($element) {
	let html = null;
	useDestroy(() => html!==null && ($element.innerHTML = html));

	return bindContext(function(newHtml) {
		html = html===null ? $element.innerHTML : html;
		$element.innerHTML = newHtml;
	});
}


export function bindTextContent($element) {
	let text = null;
	useDestroy(() => text!==null && ($element.textContent = text));

	return bindContext(function(newText) {
		text = text===null ? $element.textContent : text;
		$element.textContent = newText;
	});
}
