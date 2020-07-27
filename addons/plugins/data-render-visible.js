
import * as lazy from '../stores/lazy'


const $textarea = document.createElement('textarea');

export default function create($noscript) {
	const handler = lazy.connect({ bucket: 'data-render-visible', $node: $noscript.parentNode, paddings: 50 });

	handler.then(function() {
		$textarea.innerHTML = String($noscript.textContent||'').replace(/&amp;/g, '&');
		$noscript.outerHTML = $textarea.value;
		handler();
	});

	return handler;
}
