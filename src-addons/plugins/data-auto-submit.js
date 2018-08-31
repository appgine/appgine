
import { dom } from 'appgine/lib/closure'

const $email = document.createElement('input');
$email.type = 'email';


export default function create($element) {
	const $form = dom.getAncestor($element, 'form');

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
			if ((new RegExp(/@[^\.]*$/, 'i')).test(target.value)) {
				delayTimeout = 2000;

			} else if ((new RegExp(/@.+\.([a-z]|co|ne)$/, 'i')).test(target.value)) {
				delayTimeout = 1000;
			}
		}

		target.form && clearTimeout(target.form._appgineSubmitTimeout);

		if (isValid) {
			if ((isTextInput || isTextarea) && delay) {
				target.form._appgineSubmitTimeout = setTimeout(() => target.form.submit(), delayTimeout);

			} else {
				target.form.submit();
			}
		}
	}

	const onSubmit = function(e) {
		// clearTimeout(e.target._appgineSubmitTimeout)
		// delete e.target._appgineSubmitTimeout;
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
			value = e.target.value;
			checked = e.target.checked;
			autoSubmitForm(e.target, false);
		}
	}

	const onKeyUp = function(e) {
		if (value!==e.target.value || checked!==e.target.checked) {
			value = e.target.value;
			checked = e.target.checked;
			autoSubmitForm(e.target, true);
		}
	}

	$form && $form.addEventListener('submit', onSubmit);
	$element.addEventListener('change', onChange);
	$element.addEventListener('focusin', onFocusIn);
	$element.addEventListener('focusout', onFocusOut);
	$element.addEventListener('keyup', onKeyUp);

	return function() {
		if ($form) {
			$form.removeEventListener('submit', onSubmit);
			clearTimeout($form._appgineSubmitTimeout);
			delete $form._appgineSubmitTimeout;
		}

		$element.removeEventListener('change', onChange);
		$element.removeEventListener('focusin', onFocusIn);
		$element.removeEventListener('focusout', onFocusOut);
		$element.removeEventListener('keyup', onKeyUp);
		$emails.map($email => $email.type = 'email');
	}
}


function isInputValid($input) {
	const type = String($input.type||'').toLowerCase();

	if (type==='email') {
		const regexp = /^\s*[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\s*$/;
		const modifier = 'i';
		const reg = new RegExp(regexp, modifier);

		return reg.test(String($input.value||''));

	} else if (typeof $input.checkValidity === 'function') {
		return $input.checkValidity();

	} else if (type==='number') {
		return /^\s*[0-9]+(\.[0-9]*)?\s*$/
	}

	return true;
}
