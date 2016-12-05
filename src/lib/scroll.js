
import closure from '../closure'


export function scrollToView(hash, animated, onEnd) {
	const $node = document.getElementById(hash);

	if ($node) {
		const fixedOffset = findHeaderBottom();
		const [left, top] = findNodeOffset($node);

		const scrollLeft = left;
		const scrollTop = top-fixedOffset;

		setTimeout(() => {
			animated
				? closure.animation.scrollTo(scrollLeft, scrollTop, onEnd)
				: window.scrollTo(scrollLeft, scrollTop);
		}, 0);
	}
}

export function scrollFormToView($form) {
	if ($form && $form.tagName.toLowerCase()==='form') {
		const fixedOffset = findHeaderBottom();
		const [left, top, right, bottom] = findNodeOffset($form);
		const screen = closure.rect.fromScreen()

		window.scrollTo(
			screen.left+screen.width < left ? left : Math.min(screen.left, left),
			screen.top+screen.height < top ? Math.min(top-fixedOffset, bottom-screen.height) : Math.min(screen.top, top-fixedOffset)
		);
	}
}


function findHeaderBottom() {
	const scrollTop = closure.scrollTop();

 	let offsetBottom = 0;
 	[].forEach.call(document.querySelectorAll('header, .header-fixed'), function($header) {
 		const bounds = closure.style.getBounds($header);
 		offsetBottom = Math.max(offsetBottom, bounds.top + bounds.height - scrollTop);
 	});

 	return offsetBottom;
}

function findNodeOffset($node) {
	if ($node.tagName.toLowerCase()==='tr') {
		return findTrOffset($node);
	}

	return _findNodeOffset($node);
}

function findTrOffset($node) {
	const siblings = [].slice.call($node.parentNode.children);

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
