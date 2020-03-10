

export default function createProgress($element, onValue, events={})
{
	if (!(onValue instanceof Function)) {
		events = onValue;
		onValue = percent => percent;
	}

	const eventStart = 'ontouchstart' in document.documentElement ? 'touchstart' : 'mousedown';
	const eventMove = 'ontouchmove' in document.documentElement ? 'touchmove' : 'mousemove';
	const eventEnd = 'ontouchstart' in document.documentElement ? 'touchend' : 'mouseup';

	let progress;
	function onEventStart(e) {
		progress && progress();

		if ((e.which!==2 && e.which!==3) && e.currentTarget) {
			e.preventDefault();

			const { left, width } = e.currentTarget.getBoundingClientRect();
			function onEventValue(event) {
				const x = event.targetTouches && (event.targetTouches[0] || event.changedTouches[0]).clientX || event.clientX || 0;
				const value1 = Math.max(0, Math.min(width, x-left))/width;
				const value2 = onValue && onValue(value1)
				return value2===undefined ? value1 : value2;
			}

			function onEventDestroy(e) {
				progress = null;
			}

			progress = createProgressEvent(e, eventMove, eventEnd, events, onEventValue, onEventDestroy);
		}
	}

	$element.addEventListener(eventStart, onEventStart, {passive: false});

	function destroy() {
		$element.removeEventListener(eventStart, onEventStart, {passive: false})
		progress && progress();
		progress = null;
	}

	destroy.isRunning = function() { return !!progress; }
	return destroy;
}


function createProgressEvent(event, eventMove, eventEnd, events, onValue, onDestroy) {
	let value = onValue(event);

	if (events.onStart && events.onStart(value) !== undefined) {
		return null;
	}

	events.onProgress && events.onProgress(value);

	function onMove(e) {
		value = onValue(e);
		events.onProgress && events.onProgress(value);
	}

	function onDragStart(e) {
		if (end()) {
			events.onEnd && events.onEnd();
		}
	}

	function onEnd(e) {
		if (event.target===e.target && e.timeStamp-event.timeStamp<300) {
			if (events.onClick && events.onClick(e) !== undefined) {
				end();
			}
		}

		if (end()) {
			value = onValue(e);
			events.onProgress && events.onProgress(value);
			events.onDone && events.onDone(value);
		}
	}

	let ended = false;
	function end() {
		if (ended===false) {
			ended = true;
			document.removeEventListener(eventEnd, onEnd);
			document.removeEventListener(eventMove, onMove);
			document.removeEventListener('dragstart', onDragStart);
			onDestroy();
			return true;
		}

		return false;
	}

	document.addEventListener('dragstart', onDragStart);
	document.addEventListener(eventMove, onMove);
	document.addEventListener(eventEnd, onEnd);

	return function() {
		end() && events.onAbort && events.onAbort();
	}
}
