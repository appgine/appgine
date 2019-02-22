
import { dom, selection } from '../../closure'


export default function createFormFocus(isRequestNew) {
	if (document.activeElement) {
		const $active = document.activeElement;

		if (dom.isFormElement($active)) {
			const formId = dom.createFormId($active.form);
			const formName = $active.form.name||null;
			const inputName = $active.name;
			const inputValue = $active.value;
			const selectionStart = selection.getStart($active);
			const selectionEnd = selection.getEnd($active);

			return function() {
				let $inputs = [];
				const $found = dom.findForm(formName, formId);

				if ($found && $found[inputName] instanceof RadioNodeList) {
					$inputs = Array.from($found[inputName]);

				} else if ($found && $found[inputName]) {
					$inputs = [$found[inputName]];
				}

				$inputs = $inputs.filter($input => $input instanceof HTMLInputElement);
				$inputs.sort(function($a, $b) {
					if ($a.value===inputValue) {
						return -1;

					} else if ($b.value===inputValue) {
						return 1;

					} else if ($a.value==='') {
						return -1;

					} else if ($b.value==='') {
						return 1;
					}

					return $a.hasAttribute('value') ? -1 : 1;
				});

				if ($inputs[0]) {
					$inputs[0].focus && $inputs[0].focus();
					selection.setCursorAtEnd($inputs[0]);

					if ($inputs[0].hasAttribute('value') && isRequestNew) {
						$inputs[0].value = inputValue;
						selection.setStart($inputs[0], selectionStart);
						selection.setEnd($inputs[0], selectionEnd);
					}
				}
			}
		}
	}

	return function() {};
}
