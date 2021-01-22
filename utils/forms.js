
import * as uri from 'appgine/src/engine/uri'
import crc32 from 'appgine/utils/crc32'


const formTagNames = {
	'input': true,
	'button': true,
	'textarea': true,
	'select': true,
};


export function isFormElement($element)
{
	const tagName = $element && String($element.tagName||'').toLowerCase();
	return formTagNames[tagName]===true && $element.name && $element.form;
}


export function shouldHaveFormId($form)
{
	for (let i=0; i<$form.elements.length; i++) {
		const $element = $form.elements[i];
		const tagName = String($element.tagName||'').toLowerCase();
		const type = String($element.type||'').toLowerCase();

		if (tagName==='button') {
			continue;

		} else if (type==='hidden' || type==='submit') {
			continue;
		}

		return true;
	}

	return false;
}


export function createFormId($form)
{
	const names = [
		uri.createFormAction($form),
		String($form.method||'GET'),
		String($form.name||'')
	];

	for (let i=0; i<$form.elements.length; i++) {
		const $element = $form.elements[i];
		const name = String($element.name||'');

		if (name && names.indexOf(name)===-1) {
			names.push(name);
		}
	}

	names.sort();
	return crc32(names.join('\n'));
}


export function findForm(formName, formId)
{
	if (formName) {
		return document.forms[formName]

	} else if (formId) {
		for (let i=0; i<document.forms.length; i++) {
			if (formId===createFormId(document.forms[i])) {
				return document.forms[i];
			}
		}
	}

	return null;
}
