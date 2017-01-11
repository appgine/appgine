
import { dom, shortcuthandler } from '../closure'


const listeners = [];

const listenShortcutHandler = shortcuthandler(function(e, identifier) {
	const $element = document.activeElement;

	const listeners = findListeners(
		[null, onShortcutCheck(identifier)],
		[api.onPluginShortcut, onShortcutCheck(identifier), onPluginCheck($element)],
		[api.onShortcut, onShortcutCheck(identifier), onElementCheck],
		[api.onShortcut, onShortcutCheck(identifier), onNoElementCheck],
	);

	const preventDefault = e.preventDefault;

	let stopped = false;
	let prevented = false;
	e.stopPopagation = function() { stopped = true; }
	e.preventDefault = function() { prevented = true; preventDefault.call(this); };

	for (let i=0; i<listeners.length; i++) {
		if (stopped===false) {
			listeners[i].handler(e, identifier, $element);
		}
	}

	return prevented;
});


const api = {
	onPluginShortcut(state=[], ...args) {
		state.push(createListener(api.onPluginShortcut, this.$element, ...args));
		return state;
	},
	onShortcut(state=[], ...args) {
		state.push(createListener(api.onShortcut, this.$element, ...args));
		return state;
	},
	destroy(state) {
		state.forEach(listener => listener());
	}
}

export default api;


export function listen(...shortcuts) {
	return createListener(null, null, ...shortcuts);
}


function createListener(type, $element, ...shortcuts) {
	const handler = shortcuts.pop();

	shortcuts = shortcuts.map(shortcut => String(shortcut).toLowerCase());
	shortcuts.forEach(shortcut => listenShortcutHandler(shortcut));

	const listener = { type, $element, shortcuts, handler };
	listeners.push(listener);

	return function() {
		if (listeners.indexOf(listener)!==-1) {
			listeners.splice(listeners.indexOf(listener), 1)
		}
	}
}


function findListeners(...args) {
	const _listeners = [];
	for (let i=0; i<args.length; i++) _listeners.push([]);

	for (let listener of listeners) {
		listener: {
			for (let j=0; j<args.length; j++) {
				filter: {
					let [type, ...filters] = args[j];

					if (listener.type===type) {
						for (let filter of filters) {
							if (!filter(listener.$element, listener.shortcuts)) {
								break filter;
							}
						}

						_listeners[j].push(listener);
						break listener;
					}
				}
			}
		}
	}

	return [].concat(..._listeners);
}


function onElementCheck($element) {
	return !!$element;
}


function onNoElementCheck($element) {
	return !$element;
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
