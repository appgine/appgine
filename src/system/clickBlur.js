
import closure from '../closure'


export default function create() {
	let $target;
	this.event(document, 'mousedown', e => $target = e.target);
	this.event(document, 'mouseup', e => closure.blur.fromElement($target));
}
