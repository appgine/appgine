
import closure from '../closure'


export default function bridgeTracy(options={}) {
	const { initHTML, initFragment, onBeforeSwap } = options;
	let tracyStaticId = null;

	options.initHTML = function($html) {
		initHTML && initHTML($html);

		const $tracy = $html.querySelector('#tracy-debug');
		const $body = $html.querySelector('body');

		if ($tracy && $body) {
			tracyStaticId = tracyStaticId || ('tracy-' + closure.string.getRandomString());

			const $siblings = findTracySiblings($tracy);

			const $tracyStatic = $html.ownerDocument.createElement('div');
			$tracyStatic.dataset.static = tracyStaticId;
			$tracyStatic.appendChild($tracy);

			for (let $sibling of $siblings) {
				$tracyStatic.appendChild($sibling);
			}

			$body.appendChild($tracyStatic);
		}
	}

	options.initFragment = function($fragment) {
		initFragment && initFragment($fragment);

		if (tracyStaticId) {
			const $body = $fragment.querySelector('body');

			if ($body) {
				const $tracyStatic = ($fragment.ownerDocument||$fragment).createElement('div');
				$tracyStatic.dataset.static = tracyStaticId;

				$body.appendChild($tracyStatic);
			}
		}
	}

	options.onResponse = function(status, response) {
		if (tracyStaticId && status===closure.ajax.ERROR && !response.html && !response.json) {
			response.html = "ERROR: " + response.error;
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


function findTracySiblings($tracy) {
	const patterns = [
		['link', 'script', 'script'],
		['script'],
	];

	for (let pattern of patterns) {
		loopSiblings: {
			const $siblings = [];

			let $element = $tracy;
			for (let tagName of pattern) {
				const $sibling = closure.dom.getNextElementSibling($element);

				if (!$sibling) {
					break loopSiblings;

				} else if (String($sibling.tagName).toLowerCase()!==tagName) {
					break loopSiblings;
				}

				$siblings.push($sibling);
				$element = $sibling;
			}

			return $siblings;
		}
	}

	return [];
}
