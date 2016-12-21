
import { dom, shortcuthandler } from '../closure'


export default function create() {
	let $active, shouldHandleTabEvent;

	const onRequest = function() {
		$active = document.activeElement;
		shouldHandleTabEvent = !dom.isFormTag($active);
	}

	this.listen('app.request', 'stop', onRequest);
	onRequest();

	return shortcuthandler('shift+tab', 'tab', (e, identifier) => {
		if (shouldHandleTabEvent) {
			shouldHandleTabEvent = false;

			if (identifier==='tab' && document.activeElement===$active) {
				const $elements = Array.from(document.querySelectorAll('[tabIndex]')).
					filter($element => $element.getAttribute('tabIndex')).
					filter($element => $element.getAttribute('tabIndex')!=='-1');

				$elements.sort(function(a, b) {
					return parseInt(a.getAttribute('tabIndex'), 10)-parseInt(b.getAttribute('tabIndex'), 10);
				});

				if (focusFirstElement($elements)) {
					e.preventDefault();
					return true;
				}
			}
		}

		return false;
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
