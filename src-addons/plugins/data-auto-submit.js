
import { dom } from 'appgine/lib/closure'
import { isSwapping } from '../../lib/update'

import { useEvent } from 'appgine/hooks/event'
import { bindDispatch } from 'appgine/hooks/channel'


let focusValue;
const $email = document.createElement('input');
$email.type = 'email';


export default function create($element) {
	const $form = dom.getAncestor($element, 'form');
	const internalDispatch = bindDispatch('auto-submit');
	const dispatch = (type, $element) => internalDispatch(type, $form, $element);

	let $focus = null;
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

	function clearSubmitForm($currentForm, type) {
		if ($form===$currentForm && $currentForm._appgineSubmitTimeout) {
			clearTimeout($currentForm._appgineSubmitTimeout);
			delete $currentForm._appgineSubmitTimeout;
			type && dispatch(type);
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
			clearSubmitForm(target.form);
			dispatch('start', target);

			if ((isTextInput || isTextarea) && delay) {
				target.form._appgineSubmitTimeout = setTimeout(function() {
					dispatch('submit', target);
					clearSubmitForm(target.form);
					target.form.submit();
				}, delayTimeout);

			} else {
				dispatch('submit', target);
				target.form.submit();
			}

		} else {
			clearSubmitForm(target.form, 'abort');
		}
	}

	const onSubmit = function(e) {
		// fix double send of form
		if ($focus) {
			value = $focus.value;
			checked = $focus.checked;
			clearSubmitForm(e.target); // TODO: Really?
		}
	}

	const onChange = function(e) {
		if (value!==e.target.value || checked!==e.target.checked) {
			value = e.target.value;
			checked = e.target.checked;
			autoSubmitForm(e.target, true);
		}
	}

	const onFocusIn = function(e) {
		if (focusValue && focusValue.now+200>Date.now()) {
			value = focusValue.value;
			checked = focusValue.checked;
			focusValue = null;
			onChange(e);

		} else {
			$focus = e.target;
			value = e.target.value;
			checked = e.target.checked;
		}
	}

	const onFocusOut = function(e) {
		if (isSwapping()) {
			focusValue = { now: Date.now(), value, checked }

		} else if (value!==e.target.value || checked!==e.target.checked) {
			autoSubmitForm(e.target, false);
		}

		$focus = null;
		value = undefined;
		checked = undefined;
	}

	$form && useEvent($form, 'submit', onSubmit);
	useEvent($element, 'change', onChange);
	useEvent($element, 'focusin', onFocusIn);
	useEvent($element, 'focusout', onFocusOut);
	useEvent($element, 'keyup', onChange);

	return function() {
		$form && clearSubmitForm($form);
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
