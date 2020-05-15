
import { useListen } from 'appgine/hooks/channel'
import { useValidShortcut, useShortcut } from 'appgine/hooks/shortcut'


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

	useListen('app.request', 'response', onRequest);
	useListen('ajax.request', 'response', onRequest);
	onRequest();

	useValidShortcut('tab', e => {
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

	useShortcut('shift+tab', 'tab', function() {
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
