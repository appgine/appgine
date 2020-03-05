
import closure from '../closure'
import scrollIntoViewIfNeeded from './scrollIntoViewIfNeeded'

let optionsHashFixedEdge = null;
let optionsScrollPosition = null;

export function setHashFixedEdge(option) {
	optionsHashFixedEdge = option;
}

export function setScrollPosition(option) {
	optionsScrollPosition = option;
}

export function scrollNodeToView($origin, $node, animated, onEnd) {
	let internalCounter = 0;
	let internalLastScrollTo = [0, 0];

	function internalFindScrollTo(scrolled) {
		const found = (scrolled && $origin)
			? findScrollToWithOrigin($node, $origin)
			: findScrollTo($node);

		return internalLastScrollTo = found;
	}

	function internalOnEnd() {
		setTimeout(function() {
			const lastScrollTo = [...internalLastScrollTo];
			const thisScrollTo = internalFindScrollTo();

			if (internalCounter<3 && (lastScrollTo[0]!==thisScrollTo[0] || lastScrollTo[1]!==thisScrollTo[1])) {
				internalCounter++;
				return internalRun();
			}

			onEnd && onEnd();
		}, 0)
	}

	function internalRun() {
		scrollIntoViewIfNeeded($node, animated, function(scrolled) {
			if (animated) {
				return closure.animation.scrollToLazy(internalFindScrollTo.bind(null, scrolled), internalOnEnd);

			} else {
				closure.scrollTo(...internalFindScrollTo(scrolled));
				internalOnEnd();
			}
		});
	}

	setTimeout(internalRun, 0);
}

export function scrollFormToView($form, top=false) {
	if ($form && $form.tagName.toLowerCase()==='form') {
		let $parent = $form;
		do {
			const styles = window.getComputedStyle($parent, null);
			if (String(styles.position||'').toLowerCase()==='fixed') {
				const screen = closure.rect.fromScreen()
				return closure.scrollTo(
					Math.min(screen.left, parseInt(styles.left||0, 10)),
					Math.min(screen.top, parseInt(styles.top||0, 10))
				);
			}

		} while (($parent = $parent.parentNode) && ($parent instanceof Element));

		if (top===true) {
			return scrollNodeToView(null, $form)

		} else {
			const fixedEdge = findFixedEdge();
			const offset = findNodeOffset($form);
			const bounds = $form.getBoundingClientRect();
			const screen = closure.rect.fromScreen();

			let scrollLeft = screen.left + screen.width >= offset[0] ? Math.min(screen.left, offset[0]) : offset[0];
			let scrollTop = Math.min(offset[1] - fixedEdge, screen.top + screen.height < offset[1] ? offset[3] - screen.height : screen.top);

			return closure.scrollTo(scrollLeft, scrollTop);
		}
	}
}


export function findFixedEdge() {
	const scrollTop = closure.scrollTop();

 	let fixedEdge = 0;

 	let hashFixedEdge = optionsHashFixedEdge;
 	if (typeof hashFixedEdge==='function') {
 		hashFixedEdge = hashFixedEdge();
 	}

 	if (typeof hashFixedEdge==='string') {
 		hashFixedEdge = [hashFixedEdge];

 	} else if (hashFixedEdge instanceof Element) {
 		hashFixedEdge = [hashFixedEdge];
 	}

 	if (Array.isArray(hashFixedEdge)) {
 		hashFixedEdge.forEach(function(val) {
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
 					forEach(({ top, height }) => {
 						fixedEdge = Math.max(fixedEdge, top + height - scrollTop)
 					});
 			}
 		});
 	}

 	return fixedEdge;
}


function findScrollTo($node) {
	const fixedEdge = $node.hasAttribute('data-scrollToEdge') ? 0 : findFixedEdge();
	const nodeOffset = findNodeOffset($node);
	const siblingOffset = findSiblingOffset($node);

	let scrollLeft = siblingOffset ? siblingOffset[0] : nodeOffset[0];
	let scrollTop = (siblingOffset ? siblingOffset[1] : nodeOffset[1])-fixedEdge;

	if (optionsScrollPosition) {
		const optionsNodeOffset = optionsScrollPosition($node, nodeOffset[0], nodeOffset[1]);

		if (optionsNodeOffset) {
			scrollLeft = Math.min(scrollLeft, optionsNodeOffset[0]);
			scrollTop = Math.min(scrollTop, optionsNodeOffset[1]);
		}
	}

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


function findNodeOffset($node) {
	const bounds = closure.style.getBounds($node);
	const margins = closure.style.getMarginBox($node);

	const point = [
		bounds.left-margins.left, bounds.top-margins.top,
		bounds.left+bounds.width+margins.right, bounds.top+bounds.height+margins.bottom
	];

	if (closure.style.isOverflow($node)===false) {
		[].map.call($node.children, function($child) {
			if (closure.style.isVisible($child)) {
				const [left, top, right, bottom] = findNodeOffset($child);
				point[0] = Math.min(point[0], left);
				point[1] = Math.min(point[1], top);
				point[2] = Math.max(point[2], right);
				point[3] = Math.max(point[3], bottom);
			}
		});
	}

	return point;
}

function findSiblingOffset($node) {
	if ($node.tagName.toLowerCase()==='tr') {
		return findTrOffset($node);
	}

	return null;
}

function findTrOffset($node) {
	const siblings = Array.from($node.parentNode.children).filter(function($child) {
		return String($child.tagName.toLowerCase())==='tr';
	});

	const nodeHeight = closure.style.getSize($node).height;
	const nodeOffset = findNodeOffset($node);
	const index = siblings.indexOf($node);

	if (index===-1) {
		return null;

	} else if (index===0) {
		const tableOffset = findNodeOffset(closure.dom.getAncestor($node, 'table'));

		tableOffset[1] = Math.max(tableOffset[1], nodeOffset[1]-nodeHeight-60);
		tableOffset[1] = Math.min(tableOffset[1], nodeOffset[1]-Math.min(60, nodeHeight));
		return tableOffset;
	}

	for (let i=index-1; i>=0; i--) {
		const siblingOffset = findNodeOffset(siblings[i]);

		if (siblingOffset[1]<nodeOffset[1]-10) {
			siblingOffset[1] = Math.max(siblingOffset[1], nodeOffset[1]-nodeHeight-60);
			return siblingOffset;
		}
	}

	return null;
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
