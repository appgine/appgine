
import { bindContext } from 'appgine/hooks'
import { useDestroy } from 'appgine/hooks/destroy'


export function bindHtmlContent($element) {
	let html = null;
	useDestroy(() => html!==null && ($element.innerHTML = html));

	return bindContext(function(newHtml) {
		html = html===null ? $element.innerHTML : html;
		$element.innerHTML = newHtml;
	});
}


export function bindTextContent($element) {
	let text = null;
	useDestroy(() => text!==null && ($element.textContent = text));

	return bindContext(function(newText) {
		text = text===null ? $element.textContent : text;
		$element.textContent = newText;
	});
}


export function bindClassList($element, ...args) {
	const classList = {};
	useDestroy(function() {
		Object.keys(classList).map(className => $element.classList.toggle(className, classList[className]));
	});

	function toggleClass(className, toggled=true) {
		if (classList[className]===undefined) {
			classList[className] = $element.classList.contains(className);
		}

		$element.classList.toggle(className, !!toggled);
	}

	function toggleClassList(className, toggled) {
		if (typeof className==='string') {
			toggleClass(className, toggled);

		} else if (Array.isArray(className)) {
			className.forEach(className => toggleClass(className, toggled));

		} else if (className && typeof className === 'object') {
			for (let _className of Object.keys(className)) {
				toggleClass(_className, className[_className]);
			}
		}
	}

	toggleClassList(...args);
	const context = bindContext(toggleClassList);
	context.contains = className => $element.classList.contains(className);
	context.add = className => toggleClass(className, true);
	context.remove = className => toggleClass(className, false);
	context.toggle = (className, toggled) => toggleClass(className, toggled===undefined ? !context.contains(className) : toggled);
	return context;
}
