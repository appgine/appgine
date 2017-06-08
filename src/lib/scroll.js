
import closure from '../closure'


export function scrollHashToView(hash, animated, onEnd) {
	const $node = hash ? document.getElementById(hash) : document.body;

	if ($node) {
		scrollNodeToView($node, animated, onEnd);
		return true;

	} else {
		return false;
	}
}

export function scrollNodeToView($node, animated, onEnd) {
	if ($node) {
		const fixedOffset = findHeaderBottom();
		const [left, top] = findNodeOffset($node);

		const scrollLeft = left;
		const scrollTop = top-fixedOffset;

		setTimeout(() => {
			if (animated) {
				closure.animation.scrollTo(scrollLeft, scrollTop, onEnd);

			} else {
				window.scrollTo(scrollLeft, scrollTop);
				onEnd && onEnd();
			}
		}, 0);
	}
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

		} while ($parent = $parent.parentNode);

		if (top) {
			return scrollNodeToView($form)

		} else {
			const fixedOffset = findHeaderBottom();
			const [left, top, right, bottom] = findNodeOffset($form);
			const screen = closure.rect.fromScreen()

			return window.scrollTo(
				screen.left+screen.width < left ? left : Math.min(screen.left, left),
				screen.top+screen.height < top ? Math.min(top-fixedOffset, bottom-screen.height) : Math.min(screen.top, top-fixedOffset)
			);
		}
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
