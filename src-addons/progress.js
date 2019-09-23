

export default function createProgress(e, onValue, events={})
{
	if (!(onValue instanceof Function)) {
		events = onValue;
		onValue = percent => percent;
	}

	if (e.which===1 && e.currentTarget) {
		e.preventDefault();

		const { left, width } = e.currentTarget.getBoundingClientRect();

		const value = onValue(Math.max(0, Math.min(width, e.screenX-left))/width);
		events.onStart && events.onStart(value);
		events.onProgress && events.onProgress(value);

		function onMouseMove(e) {
			if (e.which) {
				const value = onValue(Math.max(0, Math.min(width, e.screenX-left))/width);
				events.onProgress && events.onProgress(value);

			} else {
				events.onEnd && events.onEnd();
			}
		}

		function onDragStart(e) {
			events.onEnd && events.onEnd();
		}

		function onMouseUp(e) {
			if (end()) {
				const value = onValue(Math.max(0, Math.min(width, e.screenX-left))/width);
				events.onProgress && events.onProgress(value);
				events.onDone && events.onDone(value);
			}
		}

		let ended = false;
		function end() {
			if (ended===false) {
				ended = true;
				document.removeEventListener('mousemove', onMouseMove);
				document.removeEventListener('mouseup', onMouseUp);
				document.removeEventListener('dragstart', onDragStart);
				return true;
			}

			return false;
		}

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('dragstart', onDragStart);
		document.addEventListener('mouseup', onMouseUp);

		return {
			abort() {
				if (end()) {
					const value = onValue(Math.max(0, Math.min(width, e.screenX-left))/width);
					events.onAbort && events.onAbort(value);
				}
			}
		}
	}
}
