
import { dom } from '../closure'


export default function create() {
	let $active, shouldHandleTabEvent;

	const onRequest = function() {
		shouldHandleTabEvent = true;
		try {
			$active = document.activeElement;

		} catch (e) {
			$active = null;
		}
	}

	this.listen('app.request', 'stop', onRequest);
	onRequest();

	this.onValidShortcut('tab', e => {
		if (shouldHandleTabEvent && document.activeElement===$active) {
			const $elements = Array.from(document.querySelectorAll('[tabIndex]')).
				filter($element => $element.getAttribute('tabIndex')).
				filter($element => $element.getAttribute('tabIndex')!=='-1');

			$elements.sort(function(a, b) {
				return parseInt(a.getAttribute('tabIndex'), 10)-parseInt(b.getAttribute('tabIndex'), 10);
			});

			if (focusFirstElement($elements)) {
				e.preventDefault();
			}
		}
	})

	this.onShortcut('shift+tab', 'tab', function() {
		shouldHandleTabEvent = false;
	});
}

function focusFirstElement($elements) {
	for (let $element of $elements) {
		if (($element.focus(), $element===document.activeElement)) {
			return true;
		}
	}

	for (let $element of $elements) {
		const bounds = $element.getBoundingClientRect();

		if (bounds.height>0 && bounds.width>0) {
			$element.focus();
			return true;
		}
	}

	return false;
}
