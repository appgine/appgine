
import { dom } from 'appgine/lib/closure'

const $email = document.createElement('input');
$email.type = 'email';


export default function create($element) {
	const $form = dom.getAncestor($element, 'form');
	const dispatch = (type, $element) => this.dispatch('auto-submit', type, $form, $element);

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
		if ($focus) {
			value = $focus.value;
			checked = $focus.checked;
			clearSubmitForm(e.target);
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
		value = e.target.value;
		checked = e.target.checked;
	}

	const onFocusOut = function(e) {
		if (value!==e.target.value || checked!==e.target.checked) {
			autoSubmitForm(e.target, false);
		}

		value = undefined;
		checked = undefined;
	}

	$form && $form.addEventListener('submit', onSubmit);
	$element.addEventListener('change', onChange);
	$element.addEventListener('focusin', onFocusIn);
	$element.addEventListener('focusout', onFocusOut);
	$element.addEventListener('keyup', onChange);

	return function() {
		if ($form) {
			$form.removeEventListener('submit', onSubmit);
			clearSubmitForm($form);
		}

		dispatch('destroy');
		$element.removeEventListener('change', onChange);
		$element.removeEventListener('focusin', onFocusIn);
		$element.removeEventListener('focusout', onFocusOut);
		$element.removeEventListener('keyup', onChange);
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
