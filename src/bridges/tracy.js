
import closure from '../closure'


export default function bridgeTracy(options={}) {
	const { initHTML, initFragment, onBeforeSwap } = options;
	let tracyId = null;

	options.initHTML = function($html) {
		initHTML && initHTML($html);

		const $tracy = $html.querySelector('#tracy-debug');
		const $body = $html.querySelector('body');

		if ($tracy && $body) {
			tracyId = closure.string.getRandomString();

			const $sibling = closure.dom.getNextElementSibling($tracy);

			const $tracyStatic = $html.ownerDocument.createElement('div');
			$tracyStatic.dataset.static = 'tracy-' + tracyId;
			$tracyStatic.appendChild($tracy);

			if ($sibling && String($sibling.tagName||'').toLowerCase()==='script') {
				$tracyStatic.appendChild($sibling);
			}

			$body.appendChild($tracyStatic);
		}
	}

	options.initFragment = function($fragment) {
		initFragment && initFragment($fragment);

		if (tracyId) {
			const $body = $fragment.querySelector('body');

			if ($body) {
				const $tracyStatic = ($fragment.ownerDocument||$fragment).createElement('div');
				$tracyStatic.dataset.static = 'tracy-' + tracyId;

				$body.appendChild($tracyStatic);
			}
		}
	}

	options.onBeforeSwap = function() {
		onBeforeSwap && onBeforeSwap();

		const $tracy = document.getElementById('tracy-bs-toggle');
		if ($tracy) {
			if (Tracy && Tracy.Toggle && Tracy.Toggle.toggle) {
				Tracy.Toggle.toggle($tracy, false);
			}
		}
	}

	return options;
}
