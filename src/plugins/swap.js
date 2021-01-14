
import {
	load, unload,
	loadScripts, unloadScripts,
	loadStatic, unloadStatic,
	loadAtomic, unloadAtomic
} from '../engine/plugins'


export function removeElement($element) {
	swapElement($element, null);
}


export function swapElement($element, content, request) {

	let $content = content;

	if (typeof content==='string') {
		$content = $element.cloneNode();
		$content.innerHTML = content;
	}

	if ($element.matches('[data-static] *')) {
		swapElementInternal($element, $content, loadStatic, unloadStatic);

	} else if ($element.matches('[data-atomic] *')) {
		swapElementInternal($element, $content, loadAtomic, unloadAtomic, request);

	} else {
		swapElementInternal($element, $content, load, unload);
	}

	return $content;
}


function swapElementInternal($swap, $content, load, unload, request) {

	unload && unload($swap, request);
	unloadScripts($swap);

	if ($swap.parentNode && $content) {
		$swap.parentNode.replaceChild($content, $swap);

		loadScripts($content);
		load && load($content, request);

	} else if ($swap.parentNode) {
		$swap.parentNode.removeChild($swap);
	}
}
