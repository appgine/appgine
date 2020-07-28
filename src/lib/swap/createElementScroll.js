
import { dom } from 'appgine/closure'
import { scrollZero, scrollOffset } from 'appgine/hooks/window'
import { setHashFixedEdge, findFixedEdge } from '../scroll'


export default function createElementScroll($element, scrollTop=false, hashFixedEdge=null) {
	const selectors = createSelectors($element);
	const bounds = computeBounds($element);

	return function(keepScroll) {
		let scrolled = false;
		try {
			const scroll = createSelectorsScroll($element, bounds, selectors);

			if (scroll) {
				setHashFixedEdge(hashFixedEdge);
				const fixedEdge = findFixedEdge();

				scrolled = true;

				if (keepScroll) {
					scrollOffset(scroll.now.left-scroll.prev.left, scroll.now.top-scroll.prev.top);

				} else {
					const scrollLeft = Math.max(scroll.now.left-scroll.prev.left, Math.min(0, scroll.now.left));
					const scrollTop = Math.max(scroll.now.top-scroll.prev.top, Math.min(0, scroll.now.top-fixedEdge));
					scrollOffset(scrollLeft, scrollTop);
				}
			}

		} catch (e) {}

		if (scrolled===false && scrollTop) {
			scrollZero();
		}
	}
}


function createSelectors($element) {
	const selectors = [];

	let $parent = $element;
	do {
		const tagName = $parent.tagName.toLowerCase();

		if (tagName==='form' && $parent.name) {
			selectors.push({
				selector: 'form[name="'+$parent.name+'"]' + ($parent.id ? ('#' + $parent.id) : ''),
				bounds: computeBounds($parent),
			});

		} else if ($parent.id) {
			selectors.push({
				selector: '#' + $parent.id,
				bounds: computeBounds($parent),
			});

		} else if ($parent.parentNode) {
			selectors.push({
				tagName,
				index: Array.from($parent.parentNode.children||[]).indexOf($parent),
				bounds: computeBounds($parent),
			});

		} else {
			return [];
		}

	} while (($parent = $parent.parentNode) && $parent instanceof Element);

	return selectors;
}


function createSelectorsScroll($element, oldBounds, selectors) {

	let active = false;
	let $tree;
	let treeBounds;

	if (dom.contains(document, $element)) {
		$tree = $element;
		treeBounds = oldBounds;

	} else {
		while (selectors.length) {
			const item = selectors.pop();

			if (item.selector) {
				$tree = document.querySelector(item.selector);
				treeBounds = $tree ? item.bounds : null;
				active = !!$tree;

			} else if (active && $tree.children[item.index] && $tree.children[item.index].tagName.toLowerCase()===item.tagName) {
				$tree = $tree.children[item.index];
				treeBounds = item.bounds;

			} else {
				active = false;
			}
		}
	}

	const now = $tree && computeBounds($tree);
	return now ? { prev: treeBounds, now } : null;
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
