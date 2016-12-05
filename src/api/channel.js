
const listeners = [];

export default {
	listen(state=[], type, action, fn) {
		state.push(createListener(type, action, fn));
		return state;
	},
	dispatch(state, type, action, ...args) {
		dispatch(type, action, ...args);
	},
	destroy(state) {
		state.forEach(listener => listener());
	},
}


export function addListener(type, action, fn) {
	return createListener(type, action, fn);
}


export function dispatch(type, action, ...args) {
	listeners.
		filter(listener => listener.type===null || listener.type===type).
		filter(listener =>  listener.action===null || listener.action===action).
		forEach(({ fn }) => fn(...arguments));
}


function createListener(type, action, fn) {
	if (typeof type==='function') {
		const _fn = type;
		action = null;
		type = null;
		fn = function(...args) { _fn(...args); };

	} else if (typeof action==='function') {
		const _fn = action;
		action = null;
		fn = function(type, ...args) { _fn(...args); };

	} else {
		const _fn = fn;
		fn = function(type, action, ...args) { _fn(...args); };
	}

	const listener = { type, action, fn };
	listeners.push(listener);

	return function() {
		if (listeners.indexOf(listener)!==-1) {
			listeners.splice(listeners.indexOf(listener), 1)
		}
	}
}
