
import closure from '../closure'


export default function create() {
	let _submitterEvent, _releaseClick, _releaseKey;
	const dispatch = this.dispatch.bind(this);

	const onClick = function onClick(e) {
		clearTimeout(_releaseClick);
		_releaseClick = setTimeout(function() { _submitterEvent = null }, 250);
		_submitterEvent = e;
	}

	const onKeyDown = function onKeyDown(e) {
		if (e.keyCode === 13) {
			clearTimeout(_releaseKey);
			_releaseKey = setTimeout(function() { _submitterEvent = null; }, 300);
			_submitterEvent = e;
		}
	}

	const onSubmit = function onSubmit(e) {
		const _$form = e.target;
		const _$submitter = (_submitterEvent && closure.dom.contains(e.target, _submitterEvent.target)) ? closure.dom.getSubmitter(_submitterEvent) : undefined;
		const _toTarget = (function() {
			if (_submitterEvent && (_submitterEvent.metaKey || _submitterEvent.ctrlKey)) {
				return '_blank';

			} else if (_$submitter && _$submitter.getAttribute('formtarget')) {
				return _$submitter.getAttribute('formtarget');

			} else if (e.target && e.target.getAttribute('target')) {
				return e.target.getAttribute('target');
			}

			return '';
		})();

		if (!e.defaultPrevented) {
			dispatch('app.event', 'submit', e, _$form, _$submitter, _toTarget);
		}
	}

	const submit = HTMLFormElement.prototype.submit;
	HTMLFormElement.prototype.submit = function() {
		let event = null;
		try {
			event = new Event('submit', {bubbles: true, cancelable: true, target: this, srcElement: this});

		} catch (e) {
			event = document.createEvent('Event');
			event.initEvent('submit', true, true);
		}

		const $form = document.body.contains(this) ? this : this.cloneNode(true);

		if ($form!==this) {
			document.body.appendChild($form);
		}

		$form.dispatchEvent(event);

		if (!event.defaultPrevented) {
			submit.call($form);
		}

		if ($form!==this) {
			$form.parentNode.removeChild($form);
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
