
import { animation, browser } from 'appgine/lib/closure'

import { useEvent } from 'appgine/hooks/event'
import { useTargets, useComplete } from 'appgine/hooks/target'


export default function create($element, { step=1, infinite=false, duration=300, delay=0 }) {
	const state = { move: false, moving: 0, duration: 0, infinite: false };

	$element.classList.toggle('scroll-webkit', browser.isChrome());

	const $items = useTargets('item', $item => $item);
	const $parents = useTargets('parent', $parent => $parent);

	const $nextList = useTargets('next', function($next) {
		useEvent($next, 'mousedown', () => changeMove('next'));
		useEvent($next, 'mouseup', () => changeMove(false));
		useEvent($next, 'mouse', () => changeMove(false));
		return $next;
	});

	const $prevList = useTargets('prev', function($prev) {
		useEvent($prev, 'mousedown', () => changeMove('prev'));
		useEvent($prev, 'mouseup', () => changeMove(false));
		useEvent($prev, 'mouse', () => changeMove(false));
		return $prev;
	});

	useComplete(function() {
		const $parent = $parents[0] || ($items[0] && getScrollParent($items[0])) || null;
		const itemWidth = $items[0] && $items[0].getBoundingClientRect().width;
		const parentWidth = $parent && $parent.getBoundingClientRect().width;

		if (parentWidth && itemWidth && step) {
			state.duration = duration/step/itemWidth;
			state.infinite = infinite && itemWidth*($items.length-step) > parentWidth;
		}

		changeMove();
		$parent && useEvent($parent, 'scroll', onScroll);
	});

	useEvent(window, 'resize', changeMove);

	let scrollTimeout;
	function onScroll(e) {
		clearTimeout(scrollTimeout);

		if (state.moving===0) {
			scrollTimeout = setTimeout(changeMove, 10);

			if (e.target.scrollLeft>0 && e.target.scrollLeft+e.target.offsetWidth<e.target.scrollWidth) {
				changeMove();
			}
		}
	}

	function changeMove(move=state.move) {
		state.move = move;
		const $parent = $parents[0] || ($items[0] && getScrollParent($items[0])) || null;

		if ($items.length===0 || $parent===null) {
			$prevList.forEach($prev => $prev.disabled = true);
			$nextList.forEach($next => $next.disabled = true);
			return false;
		}

		const $currentItems = Array.from($items[0].parentNode.children);

		if (state.infinite && state.moving!==1) {
			const prevCount = state.move==='prev' ? step : (state.move ? 0 : 1);
			const nextCount = state.move==='next' ? step : (state.move ? 0 : 1);

			const parentBounds = $parent.getBoundingClientRect();
			let scrollLeft = $parent.scrollLeft;

			for (let i=0; i<prevCount; i++) {
				const itemBounds = $currentItems[i].getBoundingClientRect();

				if ((parentBounds.left-itemBounds.left)-itemBounds.width*0.33 < 0) {
					for (let j=0; j<prevCount-i; j++) {
						scrollLeft += $currentItems[$currentItems.length-1-j].getBoundingClientRect().width;
					}

					for (i; i<prevCount; i++) {
						$currentItems.unshift($currentItems.pop());
						$currentItems[1].parentNode.insertBefore($currentItems[0], $currentItems[1]);
					}

					$parent.scrollLeft = scrollLeft;
				}
			}

			for (let i=0; i<nextCount; i++) {
				const itemBounds = $currentItems[$currentItems.length-1-i].getBoundingClientRect();

				if (-(parentBounds.left-itemBounds.left)-itemBounds.width*0.33 < scrollLeft) {
					for (let j=0; j<nextCount-i; j++) {
						scrollLeft -= $currentItems[j].getBoundingClientRect().width;
					}

					for (i; i<nextCount; i++) {
						$currentItems[0].parentNode.appendChild($currentItems[0]);
						$currentItems.push($currentItems.shift());
					}

					$parent.scrollLeft = scrollLeft;
				}
			}
		}

		const scrollToPrev = resolveScrollTo($parent, $currentItems, step, false);
		const scrollToNext = resolveScrollTo($parent, $currentItems, step, true);
		const scrollTo = (state.move==='prev' ? scrollToPrev : (state.move==='next' ? scrollToNext : 0));

		$prevList.forEach($prev => $prev.disabled = scrollToPrev===0);
		$nextList.forEach($next => $next.disabled = scrollToNext===0);

		if (scrollTo===0) {
			state.move = false;

		} else if (state.moving===0) {
			state.moving = 1;

			function onAnimationEnd() {
				state.moving = 2;
				changeMove();

				setTimeout(function() {
					state.moving = 0;
					changeMove();
				}, delay);
			}

			animation.scrollElementTo(
				$parent,
				$parent.scrollLeft, $parent.scrollTop,
				$parent.scrollLeft + scrollTo, $parent.scrollTop,
				onAnimationEnd, Math.ceil(Math.abs(state.duration*scrollTo)) || duration
			);
		}
	}
}


function resolveScrollTo($parent, $items, step, next) {
	if (next) {
		$items = Array.from($items);
		$items.reverse();
	}

	const parentMaxScroll = $parent.scrollWidth-$parent.offsetWidth;
	const parentScroll = $parent.scrollLeft;
	const parentLeft = $parent.getBoundingClientRect().left;
	const scrollLeft = [];

	for (let i=0; i<$items.length; i++) {
		const itemBounds = $items[i].getBoundingClientRect();

		scrollLeft.push(Math.min(parentMaxScroll, Math.max(0, itemBounds.left - parentLeft + parentScroll)) - parentScroll);

		if ((next ? -1 : 1)*(parentLeft-itemBounds.left)-itemBounds.width*0.33 < 0) {
			return scrollLeft[Math.max(0, scrollLeft.length-1-step)];
		}
	}

	return 0;
}

function getScrollParent($element) {
    const overflowRegex = /(auto|scroll)/;
    const position = window.getComputedStyle($element).position;
    const excludeStaticParent = position === "absolute";

    if (position === "fixed") {
    	return document.body;
    }

    let $parent = $element;
    while ($parent = $parent.parentElement) {
		const style = window.getComputedStyle($parent);

		if (excludeStaticParent && style.position === "static") {
			continue;
		}

		if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
			return $parent;
		}
    }

    return document.body;
}
