
import { dom } from '../closure'


const listeners = [];
let unique = {};

export default {
	initialState: [],
	busListen(state, type, action, fn) {
		state.push(createListener(this.$element, type, action, fn));
	},
	busDispatch(state, type, action, ...args) {
		dispatch(this.$element, type, action, ...args);
	},
	bus(state, type, action, fn) {
		const $busElement = this.$element;

		state.push(createListener($busElement, function(_type, _action, ..._args) {
			const _dispatch = dispatch.bind(null, $busElement);

			if (typeof type === 'function') {
				type(_dispatch, _type, _action, ..._args);

			} else if (typeof action === 'function') {
				if (type===_type) {
					action(_dispatch, _action, ..._args);
				}

			} else if (typeof fn === 'function') {
				if (type===_type && action===_action) {
					fn(_dispatch, ..._args);
				}

			} else {
				if ((type===undefined || type===_type) && (action===undefined || action===_action)) {
					_dispatch(_type, _action, ..._args);
				}
			}
		}));
	},
	destroy(state) {
		state.forEach(listener => listener());
	},
}


export function dispatch($element, type, action, ...args) {
	setTimeout(() => { unique = {}; }, 0);
	const key = JSON.stringify([type, action, ...args]);
	unique[key] = unique[key] || [];
	unique[key].push($element);

	listeners.
		filter(listener => listener.type===null || listener.type===type).
		filter(listener => listener.action===null || listener.action===action).
		filter(listener => (unique[key]||[]).indexOf(listener.$element)===-1).
		filter(listener => dom.contains(listener.$element, $element) || dom.contains($element, listener.$element)).
		forEach(function(listener) {
			unique[key] = unique[key] || [];
			unique[key].push(listener.$element);
			listener.fn(type, action, ...args);
		});
}


function createListener($element, type, action, fn) {
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

	const listener = { $element, type, action, fn };
	listeners.push(listener);

	return function() {
		if (listeners.indexOf(listener)!==-1) {
			listeners.splice(listeners.indexOf(listener), 1)
		}
	}
}
