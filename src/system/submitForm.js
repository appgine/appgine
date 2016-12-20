
import closure from '../closure'


export default function create() {
	let $submitter, _releaseClick, _releaseKey;
	const dispatch = this.dispatch.bind(this);

	const onClick = function onClick(e) {
		clearTimeout(_releaseClick);
		_releaseClick = setTimeout(function() { $submitter = null }, 250);
		$submitter = e;
	}

	const onKeyDown = function onKeyDown(e) {
		if (e.keyCode === 13) {
			clearTimeout(_releaseKey);
			_releaseKey = setTimeout(function() { $submitter = null; }, 300);
			$submitter = e;
		}
	}

	const onSubmit = function onSubmit(e) {
		const toTarget = (function() {
			if ($submitter && ($submitter.metaKey || $submitter.ctrlKey)) {
				return '_blank';

			} else if ($submitter && $submitter.target && $submitter.target.getAttribute('formtarget')) {
				return $submitter.target.getAttribute('formtarget');

			} else if (e.target && e.target.getAttribute('target')) {
				return e.target.getAttribute('target');
			}

			return '';
		})();

		const _$form = e.target;
		const _$submitter = ($submitter && closure.dom.contains(e.target, $submitter.target)) ? closure.dom.getSubmitter($submitter) : undefined;
		dispatch('app.event', 'submit', e, _$form, _$submitter, toTarget);
	}

	const submit = HTMLFormElement.prototype.submit;
	HTMLFormElement.prototype.submit = function() {
		const event = new Event('submit', {bubbles: true, cancelable: true, target: this, srcElement: this});
		this.dispatchEvent(event);

		if (!event.defaultPrevented) {
			submit.call(this);
		}
	}

	document.addEventListener('click', onClick);
	document.addEventListener('keydown', onKeyDown);
	document.addEventListener('submit', onSubmit);

	return function() {
		HTMLFormElement.prototype.submit = submit;
		document.removeEventListener('submit', onSubmit);
		document.removeEventListener('keydown', onKeyDown);
		document.removeEventListener('click', onClick);
	}
}
