
import * as closure from '../closure'
import * as history from '../engine/history'
import { requestStack } from '../engine/run'


export function createLayer($element, layerId) {
	const targets = this.createTargets();

	this.onShortcut('esc', function(e) {
		e.stopPropagation();
		e.preventDefault();

		let back = -1;
		let $back = null;
		targets.findAll('title').forEach(function({ $element, data }) {
			if (data>back) {
				back = data;
				$back = $element;
			}
		});

		$back && $back.click();
	});

	targets.every('title', function($target, { data }) {
		function onTitleClick(e) {
			e.stopPropagation();
			e.preventDefault();

			history.back(data);
		}

		$target.addEventListener('click', onTitleClick);

		return function() {
			$target.removeEventListener('click', onTitleClick);
		}
	});

	this.onRequest(function($target) {
		const willBeActive = $element.contains($target) || requestStack.findRequest($target, false)===false;

		return {
			onResponseSwap(request) {
				request._layersActive[layerId] = willBeActive;
			}
		}
	});
}


export function createNavigation($element, [ navigationActive, toggleActive ]) {
	let toggled = true;
	closure.classes.enable($element, navigationActive, toggled);

	function toggle() {
		toggled = !toggled;
		showToggle();
	}

	function showToggle() {
		closure.classes.enable($element, navigationActive, toggled);
		targets.findAllElement('toggle').forEach(function($toggle) {
			closure.classes.enable($toggle, toggleActive, toggled);
		});
	}

	function onNavigationClick(e) {
		const $target = e.target;
		const target = $target.target;
		$target.target = '_current';
		setTimeout(() => $target.target = target);
	}

	$element.addEventListener('click', onNavigationClick);

	this.onValidShortcut('left', function(e) {});
	this.onValidShortcut('right', function(e) {});

	const targets = this.createTargets();
	targets.every('toggle', function($target) {
		$target.addEventListener('click', toggle);

		return function() {
			$target.removeEventListener('click', toggle);
		}
	});

	targets.complete(showToggle);

	return {
		destroy() {
			$element.removeEventListener('click', onNavigationClick);
		}
	}
}
