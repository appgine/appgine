
import * as tick from '../tick'
import { requestStack, onReload, location } from '../engine/run'
import closure from '../closure'


export default function create() {
	let refreshLast;
	return tick.onEachTick(function() {
		const request = requestStack.loadRequest();
		const refresh = request && resolveRefresh(request.$fragment)

		if (refresh) {
			const refreshNow = [request, refresh[0], refresh[1], Date.now(), false];

			if (refreshLast && refreshLast[0]===refreshNow[0] && refreshLast[1]===refreshNow[1] && refreshLast[2]===refreshNow[2]) {
				refreshNow[3] = refreshLast[3];
				refreshNow[4] = refreshLast[4];
			}

			refreshLast = refreshNow;

			if (refreshLast[4]===false && refreshLast[3]+refreshLast[1]<Date.now()) {
				refreshLast[4] = true;

				if (refreshLast[2]) {
					location(document.body, refreshLast[2]);

				} else {
					onReload();
				}
			}
		}
	});
}


function resolveRefresh($fragment) {
	const refresh = findRefreshContent($fragment);
	const refreshMatch = refresh.match(/\s+content\s*=\s*[\"']([0-9]+)(?:;url=(.*))?[\"']/);
	return refreshMatch ? [parseInt(refreshMatch[1], 10)*1000, refreshMatch[2]] : null;
}


const $textarea = document.createElement('textarea');
function findRefreshContent($fragment) {
	const $refresh = $fragment.querySelector('meta[http-equiv="refresh"]');

	if ($refresh) {
		return $refresh.outerHTML;
	}

	for (let $noscript of Array.from($fragment.querySelectorAll('noscript'))) {
		$textarea.innerHTML = String($noscript.textContent||'').replace(/&amp;/g, '&');

		const matches = $textarea.value.match(/<[^>]*meta[^>]+http-equiv[^>]+refresh[^>]+>/);

		if (matches) {
			return matches[0];
		}
	}

	return '';
}
