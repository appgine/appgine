
import { dom, selection } from '../../closure'


export default function createFormFocus() {
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

				if ($found && $found[inputName]) {
					const $input = $found[inputName];

					$input.focus && $input.focus();
					selection.setCursorAtEnd($input);

					if ($input.hasAttribute('value')) {
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
