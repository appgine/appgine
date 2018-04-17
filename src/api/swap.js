
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
					}
				});
			}

			if (isCurrent) {
				swapDocument(function() {
					Object.keys(pending).forEach(function(swapId) {
						const $staticSwap = document.querySelector('[data-static] [data-swap="'+swapId+'"]');
						const $atomicSwap = document.querySelector('[data-atomic] [data-swap="'+swapId+'"]');
						const $documentSwap = document.querySelector('[data-swap="'+swapId+'"]');

						if ($staticSwap) {
							swapElement($staticSwap, pending[swapId], loadStatic, unloadStatic);

						} else if ($atomicSwap) {
							swapElement($atomicSwap, pending[swapId], loadAtomic, unloadAtomic, request);

						} else if ($documentSwap) {
							swapElement($documentSwap, pending[swapId], load, unload);
						}
					});
				});
			}
		}
	}

	return swapping;
}



function swapElement($swap, content, load, unload, request) {
	unload($swap, request);
	unloadScripts($swap);
	$swap.innerHTML = content;
	loadScripts($swap);
	load($swap, request);
}
