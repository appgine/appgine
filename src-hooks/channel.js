
import { useContext, bindContext } from 'appgine/hooks'

const listeners = [];


export function addListener(...args) {
	return createListener(null, ...args);
}


export function dispatch(...args) {
	return processDispatch(null, ...args);
}


export function useDispatch(...args) {
	return useContext(() => processDispatch(this, ...args));
}


export function bindDispatch(...args) {
	return bindContext(processDispatch.bind(this, this, ...args));
}


export function useListen(...args) {
	const fn = bindContext(args.pop());
	return useContext(() => createListener(null, ...args, fn));
}


export function useListenWorld(...args) {
	const fn = bindContext(args.pop());
	return useContext(() => createListener(this, ...args, fn));
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
