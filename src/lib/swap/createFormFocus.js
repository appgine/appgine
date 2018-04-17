
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
				const $found = dom.findForm(formName, formId);

				let $input = null;
				if ($found) {
					if (Array.isArray($found[inputName])) {
						$found[inputName].forEach(function(_$input) {
							if (_$input && _$input.value===inputValue) {
								$input = _$input;
							}
						});

					} else if ($found[inputName] instanceof Element) {
						$input = $found[inputName];
					}
				}

				if ($input) {
					$input.focus && $input.focus();
					selection.setCursorAtEnd($input);

					if ($input.hasAttribute('value') && isRequestNew) {
						$input.value = inputValue;
						selection.setStart($input, selectionStart);
						selection.setEnd($input, selectionEnd);
					}
				}
			}
		}
	}

	return function() {};
}
