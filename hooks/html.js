
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
