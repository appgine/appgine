
import { dom, shortcuthandler } from '../lib/closure'
import createListeners from '../lib/lib/createListeners'

import { withModuleContext } from 'appgine/hooks'
import { useContext, bindContext } from 'appgine/hooks'

let listenShortcutHandler = null;

withModuleContext(module, function() {
	listenShortcutHandler && listenShortcutHandler.dispose();
	listenShortcutHandler = shortcuthandler(function(e, identifier, isValid) {
		const $element = document.activeElement;

		const found = listeners.find(
			[listenValid, isValid, onShortcutCheck(identifier)],
			[listen, onShortcutCheck(identifier)],
			[usePluginShortcut, onShortcutCheck(identifier), onElementCheck, onPluginCheck($element)],
			[useValidShortcut, isValid, onShortcutCheck(identifier), onElementCheck],
			[useShortcut, onShortcutCheck(identifier), onElementCheck],
		);

		let stopped = false;
		let stopPropagation = e.stopPropagation;
		e.stopPropagation = function() { stopped = true; stopPropagation && stopPropagation.call(e); }

		for (let i=0; i<found.length; i++) {
			if (stopped===false) {
				found[i].listener.handler(e, { identifier, shortcut: identifier, $element, isValid });
			}
		}
	});

	return function() {
		listenShortcutHandler && listenShortcutHandler.dispose();
		listenShortcutHandler = null;
	}
});


const listeners = createListeners(function(...args) {
	args = args.map(shortcut => String(shortcut).toLowerCase());
	args.forEach(shortcut => listenShortcutHandler && listenShortcutHandler(shortcut));
	return args;
});


export function usePluginShortcut(...args) {
	const fn = bindContext(args.pop());
	return useContext(context => listeners.create(usePluginShortcut, context.$element, ...args, fn));
}


export function useValidShortcut(...args) {
	const fn = bindContext(args.pop());
	return useContext(context => listeners.create(useValidShortcut, context.$element, ...args, fn));
}


export function useShortcut(...args) {
	const fn = bindContext(args.pop());
	return useContext(context => listeners.create(useShortcut, context.$element, ...args, fn));
}


export function listen(...shortcuts) {
	return listeners.create(listen, null, ...shortcuts);
}


export function listenValid(...shortcuts) {
	return listeners.create(listenValid, null, ...shortcuts);
}


function onElementCheck($element) {
	return $element ? document.contains($element) : true;
}


function onPluginCheck($requestElement) {
	return $element => dom.contains($element, $requestElement);
}


function onShortcutCheck(shortcut) {
	return (_, shortcuts) => shortcuts.indexOf(shortcut)!==-1;
}
