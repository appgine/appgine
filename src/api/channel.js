
const listeners = [];

export default {
	initialState: [],
	listen(state, type, action, fn) {
		state.push(createListener(null, type, action, fn));
	},
	listenWorld(state, type, action, fn) {
		state.push(createListener(state, type, action, fn));
	},
	dispatch(state, type, action, ...args) {
		processDispatch(state, type, action, ...args);
	},
	destroy(state) {
		state.splice(0, state.length).forEach(fn => fn());
	},
}


export function addListener(type, action, fn) {
	return createListener(null, type, action, fn);
}


export function dispatch(...args) {
	processDispatch(null, ...args);
}


function processDispatch(origin, type, action, ...args) {
	listeners.
		filter(listener => listener.checkOrigin===null || origin===null || listener.checkOrigin!==origin).
		filter(listener => listener.type===null || listener.type===type).
		filter(listener =>  listener.action===null || listener.action===action).
		forEach(({ fn }) => fn(type, action, ...args));
}


function createListener(checkOrigin, type, action, fn) {
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

	const listener = { checkOrigin, type, action, fn };
	listeners.push(listener);

	return function() {
		if (listeners.indexOf(listener)!==-1) {
			listeners.splice(listeners.indexOf(listener), 1)
		}
	}
}
