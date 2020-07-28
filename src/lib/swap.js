
import { swapDocument, load, loadStatic, unload, unloadStatic } from '../engine/plugins'
import createFormFocus from './swap/createFormFocus'
import createKeepScroll from './swap/createKeepScroll'
import swapSelectorClasses from './swap/selectorClasses'
import runtimeScript from './swap/runtimeScript'

import { willSwap } from '../update'
import { scrollTo } from 'appgine/hooks/window'
import createFragment from './createFragment'
import loadHtml from './loadHtml'
import loadTitle from './loadTitle'

const $textarea = document.createElement('textarea');


export default function swap(from, into, isRequestNew, isRequestInitial) {
	const { $fragment: $into, scrolled, scrollTop } = into;

	willSwap(function() {
		swapDocument(function() {
			document.title = ''; // fix: popstate bug
			document.title = loadTitle($into);

			const formFocus = createFormFocus(isRequestNew);

			const $atomicList = [];
			Array.from($into.querySelectorAll('[data-atomic]')).forEach(function($atomic) {
				$atomicList.push($atomic);
				$atomic.parentNode.replaceChild(document.createElement('dataAtomic'), $atomic);
			});

			const $nextFragment = createFragment(loadHtml($into.querySelector('body')));

			Array.from($nextFragment.querySelectorAll('noscript[data-render]')).forEach(function($noscript) {
				$textarea.innerHTML = String($noscript.textContent||'').replace(/&amp;/g, '&');
				$noscript.outerHTML = $textarea.value;
			});

			const $lastBody = document.createElement('body');
			const $currentBody = document.body;
			const $nextBody = $nextFragment.querySelector('body');

			const $staticList = [];
			Array.from($nextFragment.querySelectorAll('[data-static]')).forEach(function($static) {
				const attr = $static.getAttribute('data-static');
				const $prevStatic = $currentBody.querySelector('[data-static="'+attr+'"]');
				const $dataStatic = document.createElement('dataStatic');
				const keepScroll = $prevStatic && !isRequestInitial && createKeepScroll($prevStatic);
				const bodyStatic = $prevStatic && $prevStatic.parentNode===$currentBody && $static.parentNode===$nextBody;

				$dataStatic.setAttribute('data-static-index', $staticList.length);
				$staticList.push({ $static, $dataStatic, $prevStatic, keepScroll, bodyStatic });
				$static.parentNode.replaceChild($dataStatic, $static);
			});

			load($nextFragment);

			Array.from($nextFragment.querySelectorAll('dataAtomic')).forEach(function($dataAtomic, i) {
				$dataAtomic.parentNode.replaceChild($atomicList[i], $dataAtomic);
			});

			$staticList.filter(({ $prevStatic }) => !$prevStatic).forEach(function({ $static, $dataStatic, $prevStatic }) {
				loadStatic($static);
				$dataStatic.parentNode.replaceChild($static, $dataStatic);
			});

			$staticList.filter(({ $prevStatic, bodyStatic }) => $prevStatic && !bodyStatic).forEach(function({ $static, $dataStatic, $prevStatic }) {
				$dataStatic.parentNode.replaceChild($prevStatic, $dataStatic);
			});

			let bodyIndex = 0;
			let $bodyNodes = $currentBody.childNodes;
			let $nextNodes = $nextBody.childNodes;
			do {
				if ($bodyNodes[bodyIndex]) {
					if (!($bodyNodes[bodyIndex] instanceof Element)) {
						$lastBody.appendChild($bodyNodes[bodyIndex]);
						continue;

					} else if (!$bodyNodes[bodyIndex].getAttribute('data-static')) {
						$lastBody.appendChild($bodyNodes[bodyIndex]);
						continue;

					} else if ($nextNodes.length===0) {
						$lastBody.appendChild($bodyNodes[bodyIndex]);
						continue;
					}
				}

				if ($nextNodes.length) {
					if (!($nextNodes[0] instanceof Element)) {
						$currentBody.insertBefore($nextNodes[0], $bodyNodes[bodyIndex] || null);

					} else if (!$nextNodes[0].getAttribute('data-static-index')) {
						$currentBody.insertBefore($nextNodes[0], $bodyNodes[bodyIndex] || null);

					} else {
						if ($staticList[$nextNodes[0].getAttribute('data-static-index')].$prevStatic!==$bodyNodes[bodyIndex]) {
							$currentBody.insertBefore($staticList[$nextNodes[0].getAttribute('data-static-index')].$prevStatic, $bodyNodes[bodyIndex] || null);
						}

						$nextBody.removeChild($nextNodes[0]);
					}

					bodyIndex++;
					continue;
				}

			} while ($bodyNodes.length>bodyIndex || $nextNodes.length>0);

			swapSelectorClasses('body', from && from.$fragment || null, $into);
			swapSelectorClasses('html', from && from.$fragment || null, $into);

			$staticList.filter(({ $prevStatic }) => $prevStatic).forEach(({ keepScroll }) => keepScroll && keepScroll());

			if (from) {
				const $from = from.$fragment;
				const $fromAtomic = Array.from($lastBody.querySelectorAll('[data-atomic]'));

				Array.from($from.querySelectorAll('dataAtomic')).forEach(function($dataAtomic, i) {
					$dataAtomic.parentNode.replaceChild($fromAtomic[i], $dataAtomic);
					Array.from($dataAtomic.querySelectorAll('.suspense-animation')).forEach($tmp => $tmp.classList.remove('suspense-animation'));
				});
			}

			unloadStatic($lastBody);
			unload($lastBody);

			const $flattenList = [$lastBody];
			window.requestAnimationFrame(function() {
				for (let $flatten; $flatten = $flattenList.pop(); ) {
					$flatten.parentNode && $flatten.parentNode.removeChild($flatten);
					Array.from($flatten.children).forEach($child => $flattenList.push($child));
				}
			});

			Array.from(document.querySelectorAll('body script[data-runtime]')).forEach(runtimeScript);

			formFocus();

			if (scrolled===-1) {
				scrollTo(0, scrollTop);
			}
		});
	});
}
