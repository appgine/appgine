
import {
	swapDocument,
	load, unload,
	loadScripts, unloadScripts,
	loadStatic, unloadStatic,
	loadAtomic, unloadAtomic
} from '../src/engine/plugins'

let swapping = null;

export function useSwap(swapId, content) {
	if (swapping===null) {
		throw new Error('Swapping is allowed only inside update methods.');
	}

	swapping.add(swapId, content);
}


export function createSwapping(request, isCurrent) {
	swapping = {
		pending: {},
		add(swapId, content) {
			this.pending[swapId] = content;
		},
		process() {
			swapping = null;
			const pending = this.pending;
			this.pending = {};

			swapDocument(function() {
				Object.keys(pending).forEach(function(swapId) {
					swapSelector('[data-swap="'+swapId+'"]', pending[swapId], swapId==='title' || swapId==='document-title', request, isCurrent);
				});
			});
		}
	}

	return swapping;
}


export function useSwapApi(fn) {
	swapDocument(fn);
}


export function swapSelector(selector, content, isTitle, request, isCurrent, fn) {
	if (isCurrent) {
		const $staticSwap = document.querySelector('[data-static] ' + selector);

		if ($staticSwap) {
			swapElement($staticSwap, content, loadStatic, unloadStatic);
			return fn && fn($staticSwap, true);
		}

		const $atomicSwap = document.querySelector('[data-atomic] ' + selector);

		if ($atomicSwap) {
			swapElement($atomicSwap, content, loadAtomic, unloadAtomic, request);
			return fn && fn($atomicSwap, true);
		}

		const $documentSwap = document.querySelector(selector);

		if ($documentSwap) {
			swapElement($documentSwap, content, load, unload);
			fn && fn($documentSwap, true);

		} else if (isTitle) {
			document.title = content;
		}
	}

	const $atomicSwap = request.$fragment.querySelector('[data-atomic] ' + selector);

	if ($atomicSwap) {
		swapElement($atomicSwap, content, loadAtomic, unloadAtomic, request);
		return fn && fn($atomicSwap, false);
	}

	const $documentSwap = request.$fragment.querySelector(selector);

	if ($documentSwap) {
		swapElement($documentSwap, content);
		fn && fn($documentSwap, false);

	} else if (isTitle) {
		const $title = request.$fragment.querySelector('title');

		if ($title) {
			$title.textContent = content;
		}
	}
}


function swapElement($swap, content, load, unload, request) {
	unload && unload($swap, request);
	unloadScripts($swap);
	$swap.innerHTML = content;
	loadScripts($swap);
	load && load($swap, request);
}
