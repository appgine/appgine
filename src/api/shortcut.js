
import { dom, shortcuthandler } from '../closure'
import createListeners from './createListeners'

const listeners = createListeners(function(...args) {
	args = args.map(shortcut => String(shortcut).toLowerCase());
	args.forEach(shortcut => listenShortcutHandler(shortcut));
});


const listenShortcutHandler = shortcuthandler(function(e, identifier, isValid) {
	const $element = document.activeElement;

	const found = listeners.find(
		[listenValid, isValid, onShortcutCheck(identifier)],
		[listen, onShortcutCheck(identifier)],
		[api.onPluginShortcut, onShortcutCheck(identifier), onElementCheck, onPluginCheck($element)],
		[api.onValidShortcut, isValid, onShortcutCheck(identifier), onElementCheck],
		[api.onShortcut, onShortcutCheck(identifier), onElementCheck],
	);

	let stopped = false;
	let stopPropagation = e.stopPropagation;
	e.stopPropagation = function() { stopped = true; stopPropagation && stopPropagation.call(e); }

	for (let i=0; i<found.length; i++) {
		if (stopped===false) {
			found[i].listener.handler(e, { identifier, $element, isValid });
		}
	}
});


const api = {
	onPluginShortcut(state=[], ...args) {
		state.push(listeners.create(api.onPluginShortcut, this.$element, ...args));
		return state;
	},
	onValidShortcut(state=[], ...args) {
		state.push(listeners.create(api.onValidShortcut, this.$element, ...args));
		return state;
	},
	onShortcut(state=[], ...args) {
		state.push(listeners.create(api.onShortcut, this.$element, ...args));
		return state;
	},
	destroy(state) {
		state.forEach(listener => listener());
	}
}

export default api;


export function listen(...shortcuts) {
	return listeners.create(listen, null, ...shortcuts);
}

export function listenValid(...shortcuts) {
	return listeners.create(listenValid, null, ...shortcuts);
}


function onElementCheck($element) {
	return !$element || document.contains($element);
}


function onPluginCheck($requestElement) {
	return function($element) {
		if ($requestElement && $element) {
			return dom.contains($element, $requestElement);
		}

		return false;
	}
}


function onShortcutCheck(shortcut) {
	return function($element, shortcuts) {
		return shortcuts.indexOf(shortcut)!==-1;
	}
}
