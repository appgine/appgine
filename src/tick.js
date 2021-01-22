
import Kefir from './kefir'
import { onUpdated, isUpdating } from './update'
import { isRequestCurrent } from './engine/run'
import intersection from 'appgine/utils/intersection'

import { currentScreen } from 'appgine/hooks/window'

const TICK = {
	DELAYED: 0,
	IMMEDIATE: 1,
	EACH: 2,
}

let loaded = false;
let ticks = [];
let ticking = false;
let updated = false;

window.addEventListener('load', () => loaded = true);
window.addEventListener('unload', () => { loaded = false; dispose() });

let stream_scroll;
let stream_resize;

const stream_interval = Kefir.stream(function(emitter) {
	let lastEmitted = 0;
	setInterval(function() {
		if (document.hidden!==true) {
			lastEmitted = Date.now()
		}

		if (lastEmitted+5000>Date.now()) {
			emitter.emit();
		}
	}, 300);
});

const stream_events = Kefir.stream(function(emitter) {
	let throttled = 0;
	let interval = null;
	function throttleTick() {
		if (throttled+100<Date.now()) {
			clearInterval(interval);
			interval = null;
			emitter.emit();
		}
	}

	stream_scroll = Kefir.fromEvents(window, 'scroll');
	stream_scroll.onValue(function() {
		throttled = Date.now();
		interval = interval || setInterval(throttleTick, 10);
	});

	stream_resize = Kefir.fromEvents(window, 'resize');
	stream_resize.onValue(function() {
		ticks.forEach(tick => tick.updated = true);
		throttled = Date.now();
		interval = interval || setInterval(throttleTick, 10);
	});
});

const stream1 = Kefir.merge([
	stream_events,
	stream_interval,
	Kefir.stream(emitter => onUpdated(() => {
		updated = true;
		ticks.forEach(tick => tick.updated = true);
		emitter.emit();
	})),
])
	.filter(() => loaded===true)
	.filter(() => ticks.length && ticking===false)
	.onValue(() => ticking = true);

const stream2 = Kefir.stream(emitter => stream1.onValue(() => window.requestAnimationFrame(() => emitter.emit())))
	.filter(() => ticking = ticks.length>0)
	.map(() => currentScreen())
	.onValue(screen => invokeTicks(TICK.EACH, screen))
	.filter(() => ticking = isRequestCurrent())
	.onValue(screen => invokeTicks(TICK.IMMEDIATE, screen))
	.onValue(screen => updated && !isUpdating() && invokeTicks(TICK.DELAYED, screen))
	.onValue(screen => updated = false)
	.onValue(screen => ticking = false);

Kefir.stream(function(emitter) {
	let delayed = null;
	let delayedTimeout = null;

	stream2.onValue(screen => {
		delayed = screen;
		clearTimeout(delayedTimeout);
		delayedTimeout = setTimeout(function() {
			const screen = delayed;
			delayed = null;
			window.requestAnimationFrame(() => emitter.emit(screen));
		}, 300);
	});
})
	.filter(() => !isUpdating())
	.map(screen => intersection(screen, currentScreen()))
	.filter(screen => screen && screen.height && screen.width)
	.onValue(screen => invokeTicks(TICK.DELAYED, screen));


export const onEachTick = ($element, fn) => addOnTick($element, fn, TICK.EACH, false);
export const onImmediateTick = ($element, fn) => addOnTick($element, fn, TICK.IMMEDIATE, false);
export const onceTick = ($element, fn) => addOnTick($element, fn, TICK.IMMEDIATE, true);
export const onTick = ($element, fn) => addOnTick($element, fn, TICK.DELAYED, false);


function addOnTick($element, fn, type, once) {
	if (typeof $element === 'function') {
		fn = $element;
		$element = null;
	}

	let tick = function(...args) {
		fn(...args);
	}

	tick.type = type;
	tick.once = once;
	tick.$element = $element;
	tick.updated = true;
	ticks.push(tick);

	return tick.unsubscribe = function unsubscribe() {
		if (ticks.indexOf(tick)!==-1) {
			ticks.splice(ticks.indexOf(tick), 1);
		}
	}
}


function invokeTicks(type, screen) {
	ticks
		.filter(tick => !tick.$element || document.contains(tick.$element))
		.filter(tick => tick.type===type || tick.once)
		.forEach(function(tick) {
			let _updated = tick.updated;
			tick.updated = false;
			tick(screen, _updated, isDone());

			if (tick.once) tick.unsubscribe();
		});
}


function isDone() {
	const updated = ticks
		.filter(tick => !tick.$element || document.contains(tick.$element))
		.filter(tick => tick.updated);

	return updated.length === 0 && !isUpdating();
}


export function dispose()
{
	stream_scroll && stream_scroll._emitEnd();
	stream_resize && stream_resize._emitEnd();
	stream_interval && stream_interval._emitEnd();
	stream1._emitEnd();
}
