
import { listen as listenPlugins } from 'plugin-macro-loader/errorhub'
import loadScript from './lib/loadScript'
import cloneToSerializable from './lib/cloneToSerializable'

const onerror = window.onerror;
window.onerror = function(messageOrEvent, source, lineno, colno, error) {
	dispatch(ERROR.GLOBAL, 'window.onerror: ' + String(messageOrEvent||''), error, messageOrEvent, source, lineno, colno);
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

	if (listeners.length===0) {
		console_error(errno, error, e);
	}
}


export function createRavenHandler(endpoint, config) {
	return function(errno, error, e, ...payload) {
		loadScript(endpoint, function(first) {
			if (window.Raven) {
				if (first) {
					window.Raven.config(config);
				}

				if (isError(e)) {
					window.Raven.captureException(e, cloneToSerializable({ errno, error, payload }));

				} else {
					window.Raven.captureMessage(error, cloneToSerializable({ errno, error, payload }));
				}
			}
		});
	}
}


// Yanked from https://git.io/vS8DV re-used under CC0
// with some tiny modifications
function isError(value) {
  switch ({}.toString.call(value)) {
    case '[object Error]': return true;
    case '[object Exception]': return true;
    case '[object DOMException]': return true;
    default: return value instanceof Error;
  }
}
