
import { dom } from 'appgine/closure'
import { useContext, bindContext } from 'appgine/hooks'


const listeners = [];
let unique = {};


export function useListen(type, action, fn) {
	fn = bindContext(fn);
	return useContext(context => createListener(context.$element, type, action, fn));
}


export function useDispatch(type, action, ...args) {
	return useContext(context => dispatch(context.$element, type, action, ...args));
}


export function bindDispatch(...args) {
	return bindContext((...args2) => useDispatch(...args, ...args2));
}


export function useBus(...args) {
	const fn = typeof args[args.length-1]==='function' ? bindContext(args.pop()) : null;
	return useContext(context => {
		const _dispatch = dispatch.bind(null, context.$element);

		return createListener(context.$element, function(..._args) {
			for (let i=0; i<args.length; i++) {
				if (args[i]!==undefined && args[i]!==_args[i]) {
					return false;
				}
			}

			if (fn) {
				fn(_dispatch, ..._args.slice(args.length));

			} else {
				_dispatch(..._args);
			}
		});
	});
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
