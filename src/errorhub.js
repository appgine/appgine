
import { listen as listenPlugins } from 'plugin-macro-loader/errorhub'

const onerror = window.onerror;
window.onerror = function(messageOrEvent, source, lineno, colno, error) {
	dispatch(ERROR.GLOBAL, 'window.onerror', error, messageOrEvent, source, lineno, colno);
	try { onerror && onerror.apply(window, arguments); } catch(e) {}
}

const console_error = console.error;
console.error = function() {
	dispatch(ERROR.CONSOLE, 'console.error', new Error(), ...arguments);
	console_error.apply(console, arguments);
}

listenPlugins(function(errno, error, e, ...payload) {
	dispatch(ERROR.PLUGINS, 'plugin-macro-loader', e, errno, error, payload);
});

const listeners = [];

export const ERROR = {
	GLOBAL: 0,
	PLUGINS: 1,
	CONSOLE: 2,
	REQUEST: 3,
}


export function listen(fn) {
	listeners.push(fn);
	return function() {
		if (listeners.indexOf(fn)!==-1) {
			listeners.splice(listeners.indexOf(fn), 1);
		}
	}
}


export function dispatch(errno, error, e, ...payload) {
	listeners.forEach(fn => fn(errno, error, e, ...payload));
}
