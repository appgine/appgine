
import closure from '../../closure'


export default function createElementScroll($element, scrollTop=false) {
	const selector = createSelector($element);
	const bounds = computeBounds($element);

	return function(keepScroll) {
		let scrolled = false;
		try {
			let $found;
			if (closure.dom.contains(document, $element)) {
				$found = $element;

			} else if (selector) {
				$found = findElement([...selector]);
			}

			const nowBounds = $found && computeBounds($found);

			if (bounds && nowBounds) {
				scrolled = true;

				if (keepScroll) {
					window.scrollTo(
						closure.scrollLeft()+nowBounds.left-bounds.left,
						closure.scrollTop()+nowBounds.top-bounds.top
					);

				} else {
					window.scrollTo(
						closure.scrollLeft() + Math.min(0, nowBounds.left),
						closure.scrollTop() + Math.min(0, nowBounds.top)
					);
				}
			}

		} catch (e) {}

		if (scrolled===false && scrollTop) {
			window.scrollTo(0, 0);
		}
	}
}


function createSelector($element) {
	const selector = [];

	let $parent = $element;
	do {
		const tagName = $parent.tagName.toLowerCase();

		if ($parent.id) {
			selector.push('#' + $parent.id);
			break;

		} else if (tagName==='form' && $parent.name) {
			selector.push('form[name="'+$parent.name+'"]');
			break;

		} else if ($parent.parentNode) {
			selector.push([tagName, Array.from($parent.parentNode.children||[]).indexOf($parent)]);

		} else {
			return null;
		}


	} while (($parent = $parent.parentNode) && $parent instanceof Element);

	return selector;
}


function findElement(selector) {
	let $tree = selector.length && document.querySelector(selector.pop());

	while (selector.length) {
		let [tagName, index] = selector.pop();

		if ($tree && $tree.children[index] && $tree.children[index].tagName.toLowerCase()===tagName) {
			$tree = $tree.children[index];

		} else {
			$tree = null;
		}
	}

	return $tree;
}


function computeBounds($node) {
	try {
		if ($node.parentNode instanceof Element) {
			if ($node.parentNode.children.length===1) {
				return computeBounds($node.parentNode);
			}
		}

		return $node.getBoundingClientRect();

	} catch (e) {}

	return null;
}
