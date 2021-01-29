
import { useEvent } from 'appgine/hooks/event'
import { bindDispatch } from 'appgine/hooks/channel'
import { getAncestor } from 'appgine/utils/dom'

const $email = document.createElement('input');
$email.type = 'email';


export default function create($element) {
	const $form = getAncestor($element, 'form');
	const internalDispatch = bindDispatch('auto-submit');
	const dispatch = (type, $element, ...args) => internalDispatch(type, $form, $element, ...args);

	let value = undefined;
	let checked = undefined;
	let $emails = [];

	if ($element instanceof HTMLInputElement) {
		if ($element.type==='email') {
			$emails.push($element);
		}

	} else {
		$emails = Array.from($element.querySelectorAll('input[type="email"]'));
	}

	$emails.map($email => $email.type = 'text');

	function clearSubmitForm($currentForm, abortEvent) {
		if ($form===$currentForm && $currentForm._appgineSubmitTimeout) {
			clearTimeout($currentForm._appgineSubmitTimeout);
			delete $currentForm._appgineSubmitTimeout;
			abortEvent && dispatch('abort');
		}
	}

	function autoSubmitForm(target, delay) {
		const tagName = String(target.tagName||'').toLowerCase();
		const type = String(target.type||'').toLowerCase();
		const isInput = tagName==='input';
		const isTextInput = isInput && ['text', 'search', 'email', 'number', 'tel'].indexOf(type)!==-1
		const isTextarea = tagName==='textarea';

		let isValid = true;

		if (isInput) {
			if ($emails.indexOf(target)!==-1) {
				$email.value = target.value;
				isValid = isInputValid($email);

			} else {
				isValid = isInputValid(target);
			}
		}

		let delayTimeout = 400;

		if (isInput && $emails.indexOf(target)!==-1) {
			if (/@[^\.]*$/i.test(target.value)) {
				delayTimeout = 2000;

			} else if (/@.+\.([a-z]|co|ne)$/i.test(target.value)) {
				delayTimeout = 1000;
			}
		}

		if (isValid) {
			let aborted = 1;
			clearSubmitForm(target.form, false);
			dispatch('start', target, function() {
				clearSubmitForm($form, false);
				aborted = aborted>0 ? 2 : 0;
				aborted===0 && dispatch('abort');
			});

			if (aborted===2) {
				dispatch('abort');

			} else if ((isTextInput || isTextarea) && delay) {
				target.form._appgineSubmitTimeout = setTimeout(function() {
					clearSubmitForm(target.form, false);
					aborted===1 && dispatch('submit', target);
					aborted===1 && target.form.submit();
					aborted===2 && dispatch('abort');
					aborted = 0;
				}, delayTimeout);

			} else {
				aborted===1 && dispatch('submit', target);
				aborted===1 && target.form.submit();
				aborted = 0;
			}

		} else {
			clearSubmitForm(target.form, true);
		}
	}

	const onReset = function(e) {
		value = undefined;
		checked = undefined;
	}

	const onChange = function(e) {
		if (value!==e.target.value || checked!==e.target.checked) {
			value = e.target.value;
			checked = e.target.checked;
			autoSubmitForm(e.target, true);
		}
	}

	const onFocusIn = function(e) {
		value = e.target.value;
		checked = e.target.checked;
	}

	$form && useEvent($form, 'reset', onReset);
	useEvent($element, 'change', onChange);
	useEvent($element, 'keyup', onChange);
	useEvent($element, 'focusin', onFocusIn);

	return function() {
		$form && clearSubmitForm($form, false);
		dispatch('destroy');
		$emails.map($email => $email.type = 'email');
	}
}

const isEmailValidRegexp = /^\s*[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\s*$/i;

function isInputValid($input) {
	const type = String($input.type||'').toLowerCase();

	if (type==='email') {
		return isEmailValidRegexp.test(String($input.value||''));

	} else if (typeof $input.checkValidity === 'function') {
		return $input.checkValidity();

	} else if (type==='number') {
		return /^\s*[0-9]+(\.[0-9]*)?\s*$/
	}

	return true;
}
