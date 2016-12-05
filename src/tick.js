
import Kefir from 'kefir'
import { onUpdated, isUpdating } from './update'
import { isRequestCurrent } from './engine/run'
import closure from './closure'

const TICK = {
	DELAYED: 0,
	IMMEDIATE: 1,
	EACH: 2,
}

let ticks = [];
let ticking = false;
let updated = false;

const stream1 = Kefir.merge([
	Kefir.fromEvents(window, 'scroll'),
	Kefir.fromEvents(window, 'resize').throttle(100).onValue(() => ticks.forEach(tick => tick.updated = true)),
	Kefir.interval(300),
	Kefir.stream(emitter => onUpdated(() => {
		updated = true;
		ticks.forEach(tick => tick.updated = true);
		emitter.emit();
	})),
])
	.filter(() => ticks.length && ticking===false)
	.onValue(() => ticking = true);

const stream2 = Kefir.stream(emitter => stream1.onValue(() => window.requestAnimationFrame(() => emitter.emit())))
	.filter(() => ticking = ticks.length>0)
	.map(() => closure.rect.fromScreen())
	.onValue(screen => invokeTicks(TICK.EACH, screen))
	.filter(() => ticking = isRequestCurrent())
	.onValue(screen => invokeTicks(TICK.IMMEDIATE, screen))
	.onValue(screen => updated && !isUpdating() && invokeTicks(TICK.DELAYED, screen))
	.onValue(screen => updated = false)
	.onValue(screen => ticking = false)
	.delay(300)
	.throttle(100);

Kefir.stream(emitter => stream2.onValue(screen => window.requestAnimationFrame(() => emitter.emit(screen))))
	.filter(() => !isUpdating())
	.map(screen => closure.rect.intersection(screen, closure.rect.fromScreen()))
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
