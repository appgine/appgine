
import { useEvent } from 'appgine/hooks/event'


export default function create() {
	let $target;
	let enter = false;

	useEvent(window, 'keydown', function(e) {
		enter = enter || e.keyCode===13;
	});

	useEvent(window, 'keydown', function(e) {
		enter = e.keyCode===13 ? false : enter;
	});

	useEvent(window, 'blur', function(e) {
		enter = false;
	});

	useEvent(document, 'mousedown', function(e) {
		$target = e.target;
	});

	useEvent(document, 'mouseup', function(e) {
		let _$target = $target;
		do {
			if (['A', 'BUTTON', 'LABEL'].indexOf(_$target.tagName)!==-1) {
				if (enter===false && !_$target.onfocus && !_$target.onblur) {
					try { _$target.blur(); } catch (e) {}
				}
			}
		} while (_$target = _$target.parentNode);
	});
}
