
import { currentScreen, scrollTo } from 'appgine/hooks/window'
import intersection from 'appgine/utils/intersection'
import * as selection from 'appgine/utils/selection';
import * as forms from 'appgine/utils/forms'


export default function createFormFocus(isRequestNew) {
	if (document.activeElement) {
		const $active = document.activeElement;

		if (forms.isFormElement($active)) {
			const formId = forms.createFormId($active.form);
			const formName = $active.form.name||null;
			const inputName = $active.name;
			const inputValue = $active.value;
			const selectionStart = selection.getStart($active)||0;
			const selectionEnd = selection.getEnd($active)||0;

			const bounds = $active.getBoundingClientRect();
			const boundsObj = { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }
			const screen = currentScreen();

			const intersected = intersection(boundsObj, screen);

			return function(canKeepScroll) {
				let $inputs = [];
				const $found = forms.findForm(formName, formId);

				if ($found && $found[inputName] instanceof NodeList) {
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
					if ($inputs[0].hasAttribute('value') && isRequestNew) {
						$inputs[0].value = inputValue;
						$inputs[0].focus && $inputs[0].focus();
						selection.setCursorAtEnd($inputs[0]);
						selection.setStart($inputs[0], selectionStart);
						selection.setEnd($inputs[0], selectionEnd);

					} else {
						$inputs[0].focus && $inputs[0].focus();
						selection.setCursorAtEnd($inputs[0]);
					}

					if (intersected===false && canKeepScroll) {
						scrollTo(screen.scrollLeft, screen.scrollTop);
					}
				}
			}
		}
	}

	return function() {};
}
