
const onerror = window.onerror;
window.onerror = function(messageOrEvent, source, lineno, colno, error) {
	dispatch(ERROR.CONSOLE, 'window.onerror: ' + String(messageOrEvent||''), error, messageOrEvent, source, lineno, colno);
	try { onerror && onerror.apply(window, arguments); } catch(e) {}
}

const console_error = console.error;
console.error = function() {
	dispatch(ERROR.CONSOLE, 'console.error', new Error(), ...arguments);
	console_error.apply(console, arguments);
}

const listeners = [];

export const ERROR = {
	GLOBAL: 0,
	PLUGINS: 1,
	CONSOLE: 2,
	REQUEST: 3,
	OPTIONS: 4,
	AJAX: 5,
	LOADDATA: 6,
	CONTEXT: 7,
	DESTROY: 8,
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
