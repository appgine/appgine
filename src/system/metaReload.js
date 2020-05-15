
import { requestStack } from '../engine/run'

import { useEachTick } from 'appgine/hooks/tick'
import { useDispatch } from 'appgine/hooks/channel'


export default function create() {
	let refreshLast;
	let refreshCached;

	useEachTick(function() {
		const request = requestStack.loadRequest();

		if (!refreshCached || refreshCached[0]!==request) {
			refreshCached = request ? [request, resolveRefresh(request.$fragment)] : null;
		}

		if (refreshCached && refreshCached[1]) {
			const refreshNow = [request, refreshCached[1][0], refreshCached[1][1], Date.now(), false];

			if (refreshLast && refreshLast[0]===refreshNow[0] && refreshLast[1]===refreshNow[1] && refreshLast[2]===refreshNow[2]) {
				refreshNow[3] = refreshLast[3];
				refreshNow[4] = refreshLast[4];
			}

			refreshLast = refreshNow;

			if (refreshLast[4]===false && refreshLast[3]+refreshLast[1]<Date.now()) {
				refreshLast[4] = true;
				useDispatch('meta-reload', 'reload', refreshLast[2]);
			}
		}
	});
}


function resolveRefresh($fragment) {
	const redirect = $fragment.querySelector('noscript[data-redirect]');

	if (redirect) {
		return [0, redirect.getAttribute('data-redirect')];
	}

	const refresh = findRefreshContent($fragment);
	const refreshMatch = refresh.match(/\s+content\s*=\s*[\"']([0-9]+)(?:;url=(.*))?[\"']/);
	return refreshMatch ? [parseInt(refreshMatch[1], 10)*1000, refreshMatch[2].replace(/&amp;/g, '&')] : null;
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
