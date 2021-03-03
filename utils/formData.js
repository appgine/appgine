

export function isUpload($form)
{
	let isUpload = false;
	eachFormData($form, null, function(name, value, isFile) {
		isUpload = isUpload || isFile;
	});

	return isUpload;
}


export function postData($form, $submitter) {
	const data = new FormData();
	eachFormData($form, $submitter, function(name, value, isFile) {
		value = Array.isArray(value) ? value : [value];
		value.forEach(value => data.append(name, value));
	});

	return data;
}


export function queryData($form, $submitter) {
	const searchParams = new URLSearchParams();
	eachFormData($form, $submitter, function(name, value, isFile) {
		if (!isFile) {
			value = Array.isArray(value) ? value : [value];
			value.forEach(value => searchParams.append(name, value));
		}
	});

	return searchParams;
}


function eachFormData($form, $submitter, fnAppend) {
	const $elements = $form.elements;

	for (let $element, i=0; $element = $elements[i]; i++) {
	  	// Make sure we don't include elements that are not part of the form.
		// Some browsers include non-form elements. Check for 'form' property.
		// See http://code.google.com/p/closure-library/issues/detail?id=227
		// and
		// http://www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#the-input-element
		// HTMLFieldSetElement has a form property but no value.
		if ($element.form!==$form || $element.disabled || $element.tagName=='FIELDSET') {
			continue;
		}

		switch ($element.type.toUpperCase()) {
			case 'SUBMIT':
			case 'RESET':
			case 'BUTTON':
				break; // don't submit these
			case 'FILE':
				$element.files.length && fnAppend($element.name, $element.files[0], true);
				break;
			case 'SELECT-ONE':
				$element.selectedIndex>=0 && fnAppend($element.name, $element.options[$element.selectedIndex].value, false);
				break;
			case 'SELECT-MULTIPLE':
				for (let option, i = 0; option = $element.options[i]; i++) {
					option.selected && fnAppend($element.name, option.value, false);
				}
				break;
			case 'CHECKBOX':
			case 'RADIO':
				$element.checked && fnAppend($element.name, $element.value, false);
				break;
			default:
				$element.value!=null && fnAppend($element.name, $element.value, false);
				break;
		}
	}

	// input[type=image] are not included in the elements collection
	const $inputs = $form.getElementsByTagName('INPUT');

	for (let $input, i=0; $input = $inputs[i]; i++) {
		if ($input.form==$form && $input.type.toUpperCase() == 'IMAGE') {
			fnAppend($input.name, $input.value, false);
			fnAppend($input.name + '.x', '0', false);
			fnAppend($input.name + '.y', '0', false);
		}
	}

	$submitter && $submitter.name && fnAppend($submitter.name, $submitter.value, false);
}
