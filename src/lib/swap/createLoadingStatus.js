


export default function createLoadingStatus() {
	const targets = [];
	const $link = document.createElement('a');

	function dispose() {
		for (let [$target, attr1, attr2] of targets.splice(0, targets.length)) {
			$target.removeAttribute(attr1);
			$target.removeAttribute(attr2);
		}
	}

	return {
		start($element, endpoint) {
			dispose();
			const tagName = String($element && $element.tagName || '').toLowerCase();

			if (tagName==='button' || tagName==='form' || tagName==='a') {
				targets.push([$element, 'data-appgine-loading', 'data-appgine-loaded']);
			}

			if (tagName==='button' && $element.form) {
				targets.push([$element.form, 'data-appgine-loading', 'data-appgine-loaded']);
			}

			if (tagName && $element.ownerDocument && tagName!=='button' && tagName!=='form') {
				$link.href = endpoint;
				$link.href = $link.href;

				let linkQuery, linkHref;
				linkQuery = $link.pathname + $link.search;
				linkQuery = linkQuery.replace(/["\\]/g, '\\$&');

				linkHref = $link.href;
				linkHref = linkHref.replace(/["\\]/g, '\\$&');

				const $found = [].concat(
					Array.from($element.ownerDocument.querySelectorAll('a[href="'+linkQuery+'"]')),
					Array.from($element.ownerDocument.querySelectorAll('a[href="'+linkHref+'"]'))
				);

				for (let $a of $found) {
					targets.push([$a, 'data-appgine-link-loading', 'data-appgine-link-loaded']);
				}
			}

			for (let [$target, attr1, attr2] of targets) {
				$target.setAttribute(attr1, '');
			}
		},
		loaded() {
			for (let [$target, attr1, attr2] of targets.splice(0, targets.length)) {
				$target.removeAttribute(attr1);

				if ($target.ownerDocument===document) {
					$target.setAttribute(attr2, '');
					targets.push([$target, attr1, attr2]);
				}
			}
		},
		end() {
			dispose();
		},
	}
}
