
import closure from '../closure'


export default function create() {
	let $target;

	const onMouseDown = function(e) {
		$target = e.target;
	}

	const onMouseUp = function(e) {
		closure.blur.fromElement($target);
	}

	document.addEventListener('mousedown', onMouseDown);
	document.addEventListener('mouseup', onMouseUp);

	return function destory() {
		document.removeEventListener('mousedown', onMouseDown);
		document.removeEventListener('mouseup', onMouseUp);
	}
}
