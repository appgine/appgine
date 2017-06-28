
import { swapDocument, load, loadStatic, unload, unloadStatic } from '../engine/plugins'
import createFormFocus from './swap/createFormFocus'

import { willUpdate } from '../update'
import closure from '../closure'
import createFragment from './createFragment'
import loadHtml from './loadHtml'
import loadTitle from './loadTitle'


export default function swap(from, into) {
	const { $fragment: $into, scrolled, scrollTop } = into;

	willUpdate(function() {
		swapDocument(function() {
			document.title = loadTitle($into);

			const formFocus = createFormFocus();

			const $atomicList = [];
			Array.from($into.querySelectorAll('[data-atomic]')).forEach(function($atomic) {
				$atomicList.push($atomic);
				$atomic.parentNode.replaceChild(document.createElement('dataAtomic'), $atomic);
			});

			const $nextFragment = createFragment(loadHtml($into.querySelector('body')));

			const $staticList = [];
			Array.from($nextFragment.querySelectorAll('[data-static]')).forEach(function($static) {
				const attr = $static.getAttribute('data-static');
				const $prevStatic = document.body.querySelector('[data-static="'+attr+'"]');
				const $dataStatic = document.createElement('dataStatic');

				$staticList.push([$static, $dataStatic, $prevStatic]);
				$static.parentNode.replaceChild($dataStatic, $static);
			});

			load($nextFragment);

			Array.from($nextFragment.querySelectorAll('dataAtomic')).forEach(function($dataAtomic, i) {
				$dataAtomic.parentNode.replaceChild($atomicList[i], $dataAtomic);
			});

			$staticList.filter(([,, $prevStatic]) => !$prevStatic).forEach(function([$static, $dataStatic, $prevStatic]) {
				loadStatic($static);
				$dataStatic.parentNode.replaceChild($static, $dataStatic);
			});

			$staticList.filter(([,, $prevStatic]) => $prevStatic).forEach(function([$static, $dataStatic, $prevStatic]) {
				$dataStatic.parentNode.replaceChild($prevStatic, $dataStatic);
			});

			const $lastBody = document.createElement('body');
			Array.from(document.body.childNodes).forEach($child => $lastBody.appendChild($child));
			Array.from($nextFragment.querySelector('body').childNodes).forEach($child => document.body.appendChild($child));

			closure.classes.swap('body', from ? from.$fragment : document, $into);

			if (from) {
				const $from = from.$fragment;
				const $fromAtomic = Array.from($lastBody.querySelectorAll('[data-atomic]'));

				Array.from($from.querySelectorAll('dataAtomic')).forEach(function($dataAtomic, i) {
					$dataAtomic.parentNode.replaceChild($fromAtomic[i], $dataAtomic);
				});
			}

			unloadStatic($lastBody);
			unload($lastBody);

			formFocus(into);

			if (scrolled===-1) {
				window.scrollTo(0, scrollTop);
			}
		});
	});
}
