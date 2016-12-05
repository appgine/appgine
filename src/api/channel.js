
const listeners = [];

export default {
	listen(state=[], type, action, fn) {
		if (typeof action==='function') {
			fn = action;
			action = null;
		}

		const listener = { type, action, fn };
		state.push(listener);
		listeners.push(listener);
		return state;
	},
	dispatch(state, type, action, ...args) {
		dispatch(type, action, ...args);
	},
	destroy(state) {
		state.
			filter(listener => listeners.indexOf(listener)!==-1).
			forEach(listener => listeners.splice(listeners.indexOf(listener), 1));
	},
}


export function addListener(type, action, fn) {
	const listener = { type, action, fn };
	listeners.push(listener);
}


export function dispatch(type, action, ...args) {
	listeners.
		filter(listener => listener.type===type && (listener.action===null || listener.action===action)).
		forEach(({ fn }) => fn(...args));
}
