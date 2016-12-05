
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
			if ($submitter && $submitter.metaKey) {
				return true;

			} else if (e.target && e.target.getAttribute('target')) {
				return true;
			}

			return false;
		})();

		const _$form = e.target;
		const _$submitter = ($submitter && closure.dom.contains(e.target, $submitter.target)) ? closure.dom.getSubmitter($submitter) : undefined;
		dispatch('app.event', 'submit', e, _$form, _$submitter, toTarget);
	}

	document.addEventListener('click', onClick);
	document.addEventListener('keydown', onKeyDown);
	document.addEventListener('submit', onSubmit);

	return function() {
		document.removeEventListener('submit', onSubmit);
		document.removeEventListener('keydown', onKeyDown);
		document.removeEventListener('click', onClick);
	}
}
