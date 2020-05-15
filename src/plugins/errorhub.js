
const listeners = [];


export const ERROR = {
	LOADDATA: 0,
	COMMAND: 1,
	INSTANCE: 2,
	APICALL: 3,
	DESTROY: 4
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
		console.error(errno, error, e);
	}
}
