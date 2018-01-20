
import closure from '../closure'
import scrollIntoViewIfNeeded from './scrollIntoViewIfNeeded'

let hashFixedEdge = null;

export function setHashFixedEdge(option) {
	hashFixedEdge = option;
}

export function scrollNodeToView($origin, $node, animated, onEnd) {
	setTimeout(() => {
		scrollIntoViewIfNeeded($node, animated, function(scrolled) {
			const bindFindScrollTo = (scrolled && $origin)
				? findScrollToWithOrigin.bind(null, $node, $origin)
				: findScrollTo.bind(null, $node);

			if (animated) {
				return closure.animation.scrollToLazy(bindFindScrollTo, function() {
					onEnd && onEnd();
				});

			} else {
				window.scrollTo(...bindFindScrollTo());
				onEnd && onEnd();
			}
		});
	}, 0);
}

export function scrollFormToView($form, top=false) {
	if ($form && $form.tagName.toLowerCase()==='form') {
		let $parent = $form;
		do {
			const styles = window.getComputedStyle($parent, null);
			if (String(styles.position||'').toLowerCase()==='fixed') {
				const screen = closure.rect.fromScreen()
				return window.scrollTo(
					Math.min(screen.left, parseInt(styles.left||0, 10)),
					Math.min(screen.top, parseInt(styles.top||0, 10))
				);
			}

		} while (($parent = $parent.parentNode) && ($parent instanceof Element));

		if (top) {
			return scrollNodeToView(null, $form)

		} else {
			const fixedEdge = findFixedEdge();
			const [left, top, right, bottom] = findNodeOffset($form);
			const screen = closure.rect.fromScreen()

			return window.scrollTo(
				screen.left+screen.width < left ? left : Math.min(screen.left, left),
				screen.top+screen.height < top ? Math.min(top-fixedEdge, bottom-screen.height) : Math.min(screen.top, top-fixedEdge)
			);
		}
	}
}


function findScrollTo($node) {
	const fixedEdge = findFixedEdge();
	const [left, top] = findNodeOffset($node);

	const scrollLeft = left;
	const scrollTop = top-fixedEdge;

	return [scrollLeft, scrollTop];
}


function findScrollToWithOrigin($node, $origin) {
	const [nodeScrollLeft, nodeScrollTop] = findScrollTo($node);
	const [originScrollLeft, originScrollTop] = findScrollTo($origin);
	const { left, top, width, height } = closure.rect.fromScreen();

	const originScreen = {
		left: Math.min(left, originScrollLeft),
		top: originScrollTop,
		width, height
	};

	if (isWithinScreen(nodeScrollLeft, nodeScrollTop, originScreen)) {
		return [originScreen.left, originScreen.top];
	}

	return [nodeScrollLeft, nodeScrollTop];
}


function findFixedEdge() {
	const scrollTop = closure.scrollTop();

 	let fixedEdge = 0;

 	let _hashFixedEdge = hashFixedEdge;
 	if (typeof _hashFixedEdge==='function') {
 		_hashFixedEdge = _hashFixedEdge();
 	}

 	if (typeof _hashFixedEdge==='string') {
 		_hashFixedEdge = [_hashFixedEdge];

 	} else if (_hashFixedEdge instanceof Element) {
 		_hashFixedEdge = [_hashFixedEdge];
 	}

 	if (Array.isArray(_hashFixedEdge)) {
 		_hashFixedEdge.forEach(function(val) {
 			if (typeof val==='function') {
 				val = val();
 			}

 			if (typeof val==='string') {
 				val = Array.from(document.querySelectorAll(val));

 			} else if (val instanceof Element) {
 				val = [val];
 			}

 			if (Array.isArray(val)) {
 				val.
 					filter($node => $node instanceof Element).
 					map(closure.style.getBounds).
 					forEach(({ top, height }) => fixedEdge = Math.max(fixedEdge, top + height - scrollTop));
 			}
 		});
 	}

 	return fixedEdge;
}

function findNodeOffset($node) {
	if ($node.tagName.toLowerCase()==='tr') {
		return findTrOffset($node);
	}

	return _findNodeOffset($node);
}

function findTrOffset($node) {
	const siblings = Array.from($node.parentNode.children).filter(function($child) {
		return String($child.tagName.toLowerCase())==='tr';
	});

	if (siblings.indexOf($node)===0) {
		const table = _findNodeOffset(closure.dom.getAncestor($node, 'table'));
		const tr = _findNodeOffset($node);

		if (table[1]===tr[1]) {
			table[1] = table[1]-Math.min(60, closure.style.getSize($node).height);
		}

		return table;
	}

	return _findNodeOffset(siblings[siblings.indexOf($node)-1]);
}

function _findNodeOffset($node) {
	const bounds = closure.style.getBounds($node);
	const margins = closure.style.getMarginBox($node);

	const point = [
		bounds.left-margins.left, bounds.top-margins.top,
		bounds.left+bounds.width+margins.right, bounds.top+bounds.height+margins.bottom
	];

	if (areChildrenAvailable($node)) {
		[].map.call($node.children, function($child) {
			if (isNodeAvailable($child)) {
				const [left, top, right, bottom] = _findNodeOffset($child);
				point[0] = Math.min(point[0], left);
				point[1] = Math.min(point[1], top);
				point[2] = Math.max(point[2], right);
				point[3] = Math.max(point[3], bottom);
			}
		});
	}

	return point;
}

function areChildrenAvailable($node) {
	return closure.style.isOverflow($node)===false;
}

function isNodeAvailable($node) {
	return closure.style.isVisible($node);
}


function isWithinScreen(left, top, screen) {
	if (left>screen.left+screen.width) {
		return false;

	} else if (left<screen.left) {
		return false;

	} else if (top>screen.top+screen.height) {
		return false;

	} else if (top<screen.top) {
		return false;
	}

	return true;
}
