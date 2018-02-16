

export default function create($form, data) {
	let value = undefined;
	let checked = undefined;
	let timeout = null;

	function autoSubmitForm(target, delay) {
		const tagName = String(target.tagName||'').toLowerCase();
		const isTextInput = tagName==='input' && String(target.type||'').toLowerCase()==='text';
		const isTextarea = tagName==='textarea';

		if ((isTextInput || isTextarea) && delay) {
			clearTimeout(timeout);
			timeout = setTimeout(() => $form.submit(), 400);

		} else {
			$form.submit();
		}
	}

	const onSubmit = function(e) { }

	const onChange = function(e) {
		if (value!==e.target.value || checked!==e.target.checked) {
			autoSubmitForm(e.target, true);
		}
	}

	const onFocusIn = function(e) { value = e.target.value; checked = e.target.checked; }
	const onFocusOut = function(e) {
		if (value!==e.target.value || checked!==e.target.checked) {
			autoSubmitForm(e.target, false);
		}

		value = undefined;
		checked = undefined;
	}

	const onKeyUp = function(e) {
		if (value!==e.target.value || checked!==e.target.checked) {
			value = e.target.value;
			checked = e.target.checked;
			autoSubmitForm(e.target, true);
		}
	}

	$form.addEventListener('submit', onSubmit);
	$form.addEventListener('change', onChange);
	$form.addEventListener('focusin', onFocusIn);
	$form.addEventListener('focusout', onFocusOut);
	$form.addEventListener('keyup', onKeyUp);

	return function() {
		$form.removeEventListener('submit', onSubmit);
		$form.removeEventListener('change', onChange);
		$form.removeEventListener('focusin', onFocusIn);
		$form.removeEventListener('focusout', onFocusOut);
		$form.removeEventListener('keyup', onKeyUp);
	}
}
