
import { swapDocument, load, loadStatic, unload, unloadStatic } from '../engine/plugins'
import createFormFocus from './swap/createFormFocus'
import createKeepScroll from './swap/createKeepScroll'
import swapSelectorClasses from './swap/selectorClasses'

import { willUpdate } from '../update'
import closure from '../closure'
import createFragment from './createFragment'
import loadHtml from './loadHtml'
import loadTitle from './loadTitle'

const $textarea = document.createElement('textarea');


export default function swap(from, into, isRequestNew) {
	const { $fragment: $into, scrolled, scrollTop } = into;

	willUpdate(function() {
		swapDocument(function() {
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
				const keepScroll = $prevStatic && createKeepScroll($prevStatic);
				const bodyStatic = $prevStatic && $prevStatic.parentNode===$currentBody && $static.parentNode===$nextBody;

				$dataStatic.dataset.staticIndex = $staticList.length;
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

					} else if (!$bodyNodes[bodyIndex].dataset.static) {
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

					} else if (!$nextNodes[0].dataset.staticIndex) {
						$currentBody.insertBefore($nextNodes[0], $bodyNodes[bodyIndex] || null);

					} else {
						if ($staticList[$nextNodes[0].dataset.staticIndex].$prevStatic!==$bodyNodes[bodyIndex]) {
							$currentBody.insertBefore($staticList[$nextNodes[0].dataset.staticIndex].$prevStatic, $bodyNodes[bodyIndex] || null);
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
				});
			}

			unloadStatic($lastBody);
			unload($lastBody);

			formFocus();

			if (scrolled===-1) {
				window.scrollTo(0, scrollTop);
			}
		});
	});
}
