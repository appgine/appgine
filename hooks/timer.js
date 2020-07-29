
import { useContext, bindContextWithDestroy, bindContext } from 'appgine/hooks'


export function useTimeout(fn, timeout) {
	return useContext(function() {
		let pointer = setTimeout(fn, timeout)
		return () => clearTimeout(pointer);
	});
}


export function bindTimeout() {
	return bindContextWithDestroy(useTimeout);
}


export function useInterval(fn, timeout) {
	return useContext(function() {
		let pointer = setInterval(fn, timeout)
		return () => clearInterval(pointer);
	});
}


export function useTriggeredInterval(fn, timeout) {
	return useContext(function() {
		fn();
		let pointer = setInterval(fn, timeout)
		return () => clearInterval(pointer);
	});
}


export function bindInterval(...args) {
	let pointer = null;
	return (args.length<=1 ? bindContextWithDestroy : bindContext)(function(...argsInternal) {
		return useContext(function() {
			pointer = pointer || setInterval(...args, ...argsInternal);
			return function() {
				clearInterval(pointer);
				pointer = null;
			}
		});
	});
}
