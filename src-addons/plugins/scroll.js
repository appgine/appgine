
import closure from 'appgine/lib/closure'


export default function create($element, { step=1, infinite=false, duration=300, delay=0 }, state) {
	state.initial({move: false, moving: false, infinite: false});

	$element.classList.toggle('scroll-webkit', 'webkitRequestAnimationFrame' in window);

	const targets = this.createTargets(function(targets) {
		targets.every('next', registerMovingEvent('mousedown', 'next'));
		targets.every('next', registerMovingEvent('mouseup', false));
		targets.every('next', registerMovingEvent('mouse', false));
		targets.every('prev', registerMovingEvent('mousedown', 'prev'));
		targets.every('prev', registerMovingEvent('mouseup', false));
		targets.every('prev', registerMovingEvent('mouse', false));

		targets.complete(function() {
			const $items = targets.findAllElement('item');
			const $parent = targets.findElement('parent') || ($items.length && getScrollParent($items[0])) || null;

			if ($parent) {
				if (infinite && state.infinite===false && $items.length) {
					const parentWidth = $parent.getBoundingClientRect().width;
					const itemWidth = $items[0].getBoundingClientRect().width;

					state.infinite = itemWidth*($items.length-step) > parentWidth;
				}

				$parent.addEventListener('scroll', onScroll);
				return () => $parent.removeEventListener('scroll', onScroll);
			}
		});

		targets.complete(changeMove);
	});

	this.event(window, 'resize', () => changeMove());

	let scrollTimeout;
	function onScroll(e) {
		if (e) {
			clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(onScroll, 10);
		}

		if (state.moving===false) {
			if (!e) {
				changeMove(false);

			} else if (e.target.scrollLeft>0 && e.target.scrollLeft+e.target.offsetWidth<e.target.scrollWidth) {
				changeMove(false);
			}
		}
	}

	function changeMove(move=state.move) {
		state.move = move;

		if (state.moving || targets.findAllElement('item').length===0) {
			return false;
		}

		let $currentItems;
		const $items = targets.findAllElement('item');
		const $parent = targets.findElement('parent') || ($items.length && getScrollParent($items[0])) || null;

		$currentItems = $items.length ? Array.from($items[0].parentNode.children) : []

		const parentBounds = $parent.getBoundingClientRect();

		if (state.infinite) {
			const prevCount = move==='prev' ? step : (move ? 0 : 1);
			const nextCount = move==='next' ? step : (move ? 0 : 1);
			let scrollLeft = $parent.scrollLeft;

			for (let i=0; i<prevCount; i++) {
				const itemBounds = $currentItems[i].getBoundingClientRect();

				if ((parentBounds.x-itemBounds.x)-itemBounds.width*0.33 < 0) {
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

				if (-(parentBounds.x-itemBounds.x)-itemBounds.width*0.33 < scrollLeft) {
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

		if (!$parent) {
			targets.findAllElement('prev', $prev => $prev.disabled = true);
			targets.findAllElement('next', $next => $next.disabled = true);

		} else {
			const scrollToPrev = resolveScrollTo($parent, $currentItems, step, false);
			const scrollToNext = resolveScrollTo($parent, $currentItems, step, true);

			targets.findAllElement('prev', $prev => $prev.disabled = scrollToPrev===$parent.scrollLeft);
			targets.findAllElement('next', $next => $next.disabled = scrollToNext===$parent.scrollLeft);

			if (state.move) {
				const scrollTo = (state.move==='next' ? scrollToNext : scrollToPrev);

				if (scrollTo!=$parent.scrollLeft) {
					state.moving = true;

					function onAnimationEnd() {
						state.moving = false;
						changeMove();
					}

					closure.animation.scrollElementTo(
						$parent,
						$parent.scrollLeft, $parent.scrollTop,
						scrollTo, $parent.scrollTop,
						() => setTimeout(onAnimationEnd, delay),
						duration
					);
				}
			}
		}
	}

	function registerMovingEvent(eventName, move) {
		return function($element) {
			const onEvent = changeMove.bind(null, move);
			$element.addEventListener(eventName, onEvent);
			return () => $element.removeEventListener(eventName, onEvent);
		}
	}
}


function resolveScrollTo($parent, $items, step, next) {
	if (next) {
		$items = Array.from($items);
		$items.reverse();
	}

	const parentScroll = $parent.scrollLeft;
	const parentLeft = $parent.getBoundingClientRect().x;
	const scrollLeft = [];

	for (let i=0; i<$items.length; i++) {
		const itemBounds = $items[i].getBoundingClientRect();

		scrollLeft.push(parentScroll + (itemBounds.x - parentLeft));

		if ((next ? -1 : 1)*(parentLeft-itemBounds.x)-itemBounds.width*0.33 < 0) {
			return Math.min($parent.scrollWidth-$parent.offsetWidth, scrollLeft[Math.max(0, scrollLeft.length-1-step)]);
		}
	}

	return parentLeft;
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
