
import { useContext, bindContextWithDestroy, bindContext } from 'appgine/hooks'
import { bindCallback } from 'appgine/hooks/callback'


export function useTimeout(fn, timeout) {
	return useContext(function() {
		let pointer = setTimeout(bindCallback(fn), timeout)
		return () => clearTimeout(pointer);
	});
}


export function bindTimeout() {
	return bindContextWithDestroy(useTimeout);
}


export function useInterval(fn, timeout) {
	return useContext(function() {
		let pointer = setInterval(bindCallback(fn), timeout)
		return () => clearInterval(pointer);
	});
}


export function useTriggeredInterval(fn, timeout) {
	return useContext(function() {
		fn();
		let pointer = setInterval(bindCallback(fn), timeout)
		return () => clearInterval(pointer);
	});
}


export function bindInterval(...args) {
	let pointer = null;
	return (args.length<=1 ? bindContextWithDestroy : bindContext)(function(...argsInternal) {
		return useContext(function() {
			const fn = args.unshift();
			pointer = pointer || setInterval(bindCallback(fn), ...args, ...argsInternal);
			return function() {
				clearInterval(pointer);
				pointer = null;
			}
		});
	});
}
