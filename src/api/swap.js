
import {
	swapDocument,
	load, unload,
	loadScripts, unloadScripts,
	loadStatic, unloadStatic,
	loadAtomic, unloadAtomic
} from '../engine/plugins'


export default {
	swap(state, swapId, content) {
		if (swapping) {
			swapping.add(swapId, content);

		} else {
			throw new Error('Swapping is allowed only inside update methods.');
		}
	},
}


let swapping;
export function createSwapping(request, isCurrent) {
	swapping = {
		pending: {},
		add(swapId, content) {
			this.pending[swapId] = content;
		},
		process() {
			const pending = this.pending;
			this.pending = {};

			if (request) {
				Object.keys(pending).forEach(function(swapId) {
					const $atomicSwap = request.$fragment.querySelector('[data-atomic] [data-swap="'+swapId+'"]');
					const $swap = request.$fragment.querySelector('[data-swap="'+swapId+'"]');

					if ($atomicSwap) {
						swapElement($atomicSwap, pending[swapId], loadAtomic, unloadAtomic, request);

					} else if ($swap) {
						$swap.innerHTML = pending[swapId];

					} else if (swapId==='title' || swapId==='document-title') {
						const $titleSwap = request.$fragment.querySelector('title');

						if ($titleSwap) {
							$titleSwap.textContent = pending[swapId];
						}
					}
				});
			}

			if (isCurrent) {
				swapDocument(function() {
					Object.keys(pending).forEach(function(swapId) {
						swapSelectorInner('[data-swap="'+swapId+'"]', pending[swapId], swapId==='title' || swapId==='document-title', request);
					});
				});
			}
		}
	}

	return swapping;
}


export function swapSelector(...args) {
	swapDocument(function() {
		swapSelectorInner(...args);
	});
}


function swapSelectorInner(selector, content, isTitle, request, fn) {
	const $staticSwap = document.querySelector('[data-static] ' + selector);
	const $atomicSwap = document.querySelector('[data-atomic] ' + selector);
	const $documentSwap = document.querySelector(selector);

	if ($staticSwap) {
		swapElement($staticSwap, content, loadStatic, unloadStatic);
		fn && fn($staticSwap);

	} else if ($atomicSwap) {
		swapElement($atomicSwap, content, loadAtomic, unloadAtomic, request);
		fn && fn($atomicSwap);

	} else if ($documentSwap) {
		swapElement($documentSwap, content, load, unload);
		fn && fn($documentSwap);

	} else if (isTitle) {
		document.title = content;
	}
}


function swapElement($swap, content, load, unload, request) {
	unload($swap, request);
	unloadScripts($swap);
	$swap.innerHTML = content;
	loadScripts($swap);
	load($swap, request);
}
